// src/app/api/calendar/sync/route.ts
// POST /api/calendar/sync
// Called after Google OAuth to save refresh token and enable calendar sync.
// Also handles manual re-sync of all upcoming events.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';
import { JobView } from '@/models/JobView';
import {
  syncJobDeadlineToCalendar,
  syncSavedJobDeadlineToCalendar,
  syncInterviewToCalendar,
  syncEventRegistrationToCalendar,
  syncOwnedEventToCalendar,
} from '@/lib/calendar';
import mongoose from 'mongoose';

// ── POST — save refresh token + optionally re-sync all events ──────────────
export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { refreshToken, resync = false } = body as {
      refreshToken?: string;
      resync?: boolean;
    };

    await connectDB();

    // Save refresh token and mark calendar as connected
    if (refreshToken) {
      await User.findByIdAndUpdate(session.user.id, {
        googleRefreshToken: refreshToken,
        googleCalendarConnected: true,
      });
    }

    // Optional full re-sync of all upcoming events
    if (resync) {
      const oid = new mongoose.Types.ObjectId(session.user.id);
      const now = new Date();

      let synced = 0;

      if (session.user.role === 'student') {
        const applications = await Application.find({
          studentId: oid,
          status: { $nin: ['rejected', 'withdrawn'] },
          googleCalendarEventId: { $exists: false },
        }).lean();
        const activeApplicationJobIds = new Set(applications.map((app) => app.jobId.toString()));
        const savedJobs = await JobView.find({
          studentId: oid,
          isSaved: true,
          googleCalendarEventId: { $exists: false },
        })
          .populate('jobId', 'title companyName applicationDeadline isActive')
          .lean();

        for (const app of applications) {
          const job = await Job.findById(app.jobId)
            .select('title companyName applicationDeadline startDate type')
            .lean();

          if (!job) continue;

          if (
            app.status === 'interview_scheduled' &&
            app.interviewScheduledAt &&
            app.interviewScheduledAt > now
          ) {
            await syncInterviewToCalendar(
              session.user.id,
              app._id.toString(),
              job.title,
              job.companyName,
              app.interviewScheduledAt
            );
            synced++;
            continue;
          }

          if (app.isEventRegistration && job.startDate && job.startDate > now) {
            await syncEventRegistrationToCalendar(
              session.user.id,
              app._id.toString(),
              job.title,
              job.companyName,
              job.startDate
            );
            synced++;
            continue;
          }

          if (
            !app.isEventRegistration &&
            job.applicationDeadline &&
            job.applicationDeadline > now
          ) {
            await syncJobDeadlineToCalendar(
              session.user.id,
              app._id.toString(),
              job.title,
              job.companyName,
              job.applicationDeadline
            );
            synced++;
          }
        }

        for (const savedJob of savedJobs) {
          const job = savedJob.jobId as unknown as {
            _id: mongoose.Types.ObjectId;
            title: string;
            companyName: string;
            applicationDeadline?: Date;
            isActive?: boolean;
          } | null;

          if (!job?.applicationDeadline || job.isActive === false) continue;
          if (job.applicationDeadline <= now) continue;
          if (activeApplicationJobIds.has(job._id.toString())) continue;

          await syncSavedJobDeadlineToCalendar(
            session.user.id,
            savedJob._id.toString(),
            job.title,
            job.companyName,
            job.applicationDeadline
          );
          synced++;
        }
      } else if (session.user.role === 'advisor' || session.user.role === 'dept_head') {
        const ownedEvents = await Job.find({
          employerId: oid,
          type: { $in: ['webinar', 'workshop'] },
          isActive: true,
          startDate: { $gt: now },
        })
          .select('title companyName type startDate applicationDeadline ownerGoogleCalendarEventId')
          .lean();

        for (const event of ownedEvents) {
          if (!event.startDate || (event.type !== 'webinar' && event.type !== 'workshop')) continue;

          await syncOwnedEventToCalendar(
            session.user.id,
            event._id.toString(),
            event.title,
            event.companyName,
            event.startDate,
            event.type,
            event.applicationDeadline,
            event.ownerGoogleCalendarEventId
          );
          synced++;
        }
      }

      return NextResponse.json({
        message: 'Calendar connected and synced',
        synced,
      });
    }

    return NextResponse.json({ message: 'Calendar connected successfully' });
  } catch (err) {
    console.error('[CALENDAR SYNC ERROR]', err);
    return NextResponse.json({ error: 'Failed to sync calendar' }, { status: 500 });
  }
}

// ── GET — check if calendar is connected ──────────────────────────────────
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.user.id).select('googleCalendarConnected').lean();

    return NextResponse.json({
      connected: user?.googleCalendarConnected ?? false,
    });
  } catch (err) {
    console.error('[CALENDAR CHECK ERROR]', err);
    return NextResponse.json({ error: 'Failed to check calendar status' }, { status: 500 });
  }
}
