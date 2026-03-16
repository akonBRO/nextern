// src/app/api/jobs/[jobId]/apply/route.ts
// POST   /api/jobs/[jobId]/apply  — student applies to a job
// DELETE /api/jobs/[jobId]/apply  — student withdraws application

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { User } from '@/models/User';
import { ApplyJobSchema } from '@/lib/validations';
import { onJobApplied } from '@/lib/events';

type Params = { params: Promise<{ jobId: string }> };

// ── POST ──────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can apply to jobs' }, { status: 403 });
    }

    const { jobId } = await params;
    await connectDB();

    const job = await Job.findById(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    if (!job.isActive) {
      return NextResponse.json(
        { error: 'This listing is no longer accepting applications' },
        { status: 400 }
      );
    }
    if (job.applicationDeadline && new Date() > job.applicationDeadline) {
      return NextResponse.json({ error: 'Application deadline has passed' }, { status: 400 });
    }

    // Duplicate check
    const existing = await Application.findOne({ jobId, studentId: session.user.id });
    if (existing) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 });
    }

    const body = await req.json();
    const parsed = ApplyJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    // Snapshot student's resume at time of application
    const student = await User.findById(session.user.id).select('resumeUrl').lean();

    const isEvent = job.type === 'webinar' || job.type === 'workshop';

    const application = await Application.create({
      studentId: session.user.id,
      jobId,
      employerId: job.employerId,
      coverLetter: parsed.data.coverLetter,
      resumeUrlSnapshot: student?.resumeUrl ?? '',
      isEventRegistration: isEvent,
      status: 'applied',
      appliedAt: new Date(),
      statusHistory: [
        {
          status: 'applied',
          changedAt: new Date(),
          changedBy: session.user.id,
        },
      ],
    });

    // Increment application count
    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: 1 } });

    // Fire event hook for badge system (Jauad's module)
    await onJobApplied(session.user.id, jobId).catch(() => {});

    return NextResponse.json(
      { message: 'Application submitted successfully', application },
      { status: 201 }
    );
  } catch (error: unknown) {
    if ((error as { code?: number }).code === 11000) {
      return NextResponse.json({ error: 'You have already applied to this job' }, { status: 409 });
    }
    console.error('[APPLY JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to submit application' }, { status: 500 });
  }
}

// ── DELETE (withdraw) ─────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    await connectDB();

    const application = await Application.findOne({ jobId, studentId: session.user.id });
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (['hired', 'rejected'].includes(application.status)) {
      return NextResponse.json(
        { error: 'Cannot withdraw from a finalised application' },
        { status: 400 }
      );
    }

    await Application.findByIdAndUpdate(application._id, {
      status: 'withdrawn',
      isWithdrawn: true,
      $push: {
        statusHistory: {
          status: 'withdrawn',
          changedAt: new Date(),
          changedBy: session.user.id,
        },
      },
    });

    await Job.findByIdAndUpdate(jobId, { $inc: { applicationCount: -1 } });

    return NextResponse.json({ message: 'Application withdrawn successfully' });
  } catch (error) {
    console.error('[WITHDRAW ERROR]', error);
    return NextResponse.json({ error: 'Failed to withdraw application' }, { status: 500 });
  }
}
