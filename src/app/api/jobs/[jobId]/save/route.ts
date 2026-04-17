import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { JobView } from '@/models/JobView';
import { removeCalendarEvent, syncSavedJobDeadlineToCalendar } from '@/lib/calendar';

const SaveSchema = z.object({
  isSaved: z.boolean(),
});

type Params = { params: Promise<{ jobId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can save jobs.' }, { status: 403 });
    }

    const { jobId } = await params;
    if (!mongoose.isValidObjectId(jobId)) {
      return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = SaveSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid save request.' }, { status: 400 });
    }

    await connectDB();

    const job = await Job.findById(jobId)
      .select('_id title companyName applicationDeadline isActive')
      .lean();
    if (!job) return NextResponse.json({ error: 'Job not found.' }, { status: 404 });

    const now = new Date();
    const update = parsed.data.isSaved
      ? {
          $set: {
            isSaved: true,
            savedAt: now,
          },
          $setOnInsert: {
            studentId: session.user.id,
            jobId,
            viewCount: 0,
            firstViewedAt: now,
            lastViewedAt: now,
          },
        }
      : {
          $set: {
            isSaved: false,
          },
          $unset: {
            savedAt: '',
          },
          $setOnInsert: {
            studentId: session.user.id,
            jobId,
            viewCount: 0,
            firstViewedAt: now,
            lastViewedAt: now,
          },
        };

    const jobView = await JobView.findOneAndUpdate({ studentId: session.user.id, jobId }, update, {
      upsert: true,
      new: true,
    });

    if (parsed.data.isSaved) {
      if (
        job.isActive !== false &&
        job.applicationDeadline &&
        job.applicationDeadline > now &&
        jobView &&
        !jobView.googleCalendarEventId
      ) {
        await syncSavedJobDeadlineToCalendar(
          session.user.id,
          jobView._id.toString(),
          job.title ?? 'Saved job',
          job.companyName ?? 'Nextern',
          job.applicationDeadline
        ).catch((error) => {
          console.error('[SAVE JOB CALENDAR SYNC ERROR]', error);
        });
      }
    } else if (jobView?.googleCalendarEventId) {
      await removeCalendarEvent(session.user.id, jobView.googleCalendarEventId).catch((error) => {
        console.error('[REMOVE SAVED JOB CALENDAR EVENT ERROR]', error);
      });

      await JobView.findByIdAndUpdate(jobView._id, {
        $unset: { googleCalendarEventId: '' },
      }).catch((error) => {
        console.error('[CLEAR SAVED JOB CALENDAR ID ERROR]', error);
      });
    }

    return NextResponse.json({
      isSaved: parsed.data.isSaved,
      message: parsed.data.isSaved ? 'Job saved.' : 'Job removed from saved jobs.',
    });
  } catch (error) {
    console.error('[SAVE JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to update saved job.' }, { status: 500 });
  }
}
