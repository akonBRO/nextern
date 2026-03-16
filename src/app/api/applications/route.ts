// src/app/api/applications/route.ts
// GET   /api/applications              — student: own apps | employer: all for their jobs
// PATCH /api/applications?id=[appId]   — employer updates application status

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { UpdateApplicationStatusSchema } from '@/lib/validations';
import { onApplicationStatusChanged } from '@/lib/events';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const jobId = searchParams.get('jobId');
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));

    await connectDB();

    const query: Record<string, unknown> = {};

    if (session.user.role === 'student') {
      query.studentId = session.user.id;
      query.isWithdrawn = { $ne: true };
    } else if (session.user.role === 'employer') {
      query.employerId = session.user.id;
      if (jobId) query.jobId = jobId;
    } else if (session.user.role === 'admin') {
      if (jobId) query.jobId = jobId;
    } else {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [applications, total] = await Promise.all([
      Application.find(query)
        .populate('jobId', 'title type companyName city locationType applicationDeadline isActive')
        .populate(
          'studentId',
          'name email university department cgpa skills opportunityScore resumeUrl image yearOfStudy'
        )
        .sort({ appliedAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
    ]);

    return NextResponse.json({
      applications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('[GET APPLICATIONS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}

// ── PATCH ─────────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const appId = searchParams.get('id');
    if (!appId) {
      return NextResponse.json({ error: 'Application ID is required' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = UpdateApplicationStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await Application.findById(appId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }
    if (application.employerId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updated = await Application.findByIdAndUpdate(
      appId,
      {
        $set: { status: parsed.data.status },
        $push: {
          statusHistory: {
            status: parsed.data.status,
            changedAt: new Date(),
            changedBy: session.user.id,
            note: parsed.data.note,
          },
        },
      },
      { new: true }
    );

    // Fire event hook for badge/notification system
    await onApplicationStatusChanged(application.studentId.toString(), parsed.data.status).catch(
      () => {}
    );

    return NextResponse.json({ message: 'Status updated successfully', application: updated });
  } catch (error) {
    console.error('[UPDATE APPLICATION ERROR]', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}
