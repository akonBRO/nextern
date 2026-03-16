// src/app/api/jobs/[jobId]/route.ts
// GET    /api/jobs/[jobId] — fetch single job + hasApplied flag
// PATCH  /api/jobs/[jobId] — update job (employer owner or admin)
// DELETE /api/jobs/[jobId] — delete job (employer owner or admin)

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { UpdateJobSchema } from '@/lib/validations';

type Params = { params: Promise<{ jobId: string }> };

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest, { params }: Params) {
  try {
    const { jobId } = await params;
    await connectDB();

    const job = await Job.findById(jobId).lean();
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    // Increment view count (fire and forget)
    Job.findByIdAndUpdate(jobId, { $inc: { viewCount: 1 } }).exec();

    let hasApplied = false;
    const session = await auth();
    if (session?.user?.id && session.user.role === 'student') {
      const existing = await Application.findOne({
        jobId,
        studentId: session.user.id,
      }).lean();
      hasApplied = !!existing;
    }

    return NextResponse.json({ job, hasApplied });
  } catch (error) {
    console.error('[GET JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch job' }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    await connectDB();

    const job = await Job.findById(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const isOwner = job.employerId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = UpdateJobSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const updates: Record<string, unknown> = { ...parsed.data };
    if (parsed.data.applicationDeadline) {
      updates.applicationDeadline = new Date(parsed.data.applicationDeadline as string);
    }
    if (parsed.data.startDate) {
      updates.startDate = new Date(parsed.data.startDate as string);
    }

    const updated = await Job.findByIdAndUpdate(jobId, { $set: updates }, { new: true });
    return NextResponse.json({ message: 'Job updated successfully', job: updated });
  } catch (error) {
    console.error('[UPDATE JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to update job' }, { status: 500 });
  }
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { jobId } = await params;
    await connectDB();

    const job = await Job.findById(jobId);
    if (!job) return NextResponse.json({ error: 'Job not found' }, { status: 404 });

    const isOwner = job.employerId.toString() === session.user.id;
    const isAdmin = session.user.role === 'admin';
    if (!isOwner && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await Job.findByIdAndDelete(jobId);
    return NextResponse.json({ message: 'Job deleted successfully' });
  } catch (error) {
    console.error('[DELETE JOB ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete job' }, { status: 500 });
  }
}
