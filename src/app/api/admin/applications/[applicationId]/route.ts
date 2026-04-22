import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/admin';
import { AdminApplicationUpdateSchema } from '@/lib/validations';
import { Application } from '@/models/Application';
import { Assessment } from '@/models/Assessment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { Job } from '@/models/Job';
import { JobView } from '@/models/JobView';
import { onApplicationStatusChangedForApplication } from '@/lib/events';

type Params = { params: Promise<{ applicationId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { applicationId } = await params;
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminApplicationUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const updates: Record<string, unknown> = {};
    const pushHistory: Record<string, unknown>[] = [];

    if (parsed.data.status) {
      updates.status = parsed.data.status;
      pushHistory.push({
        status: parsed.data.status,
        changedAt: new Date(),
        changedBy: session.user.id,
        note: parsed.data.note,
      });
    }

    if (typeof parsed.data.employerNotes === 'string') {
      updates.employerNotes = parsed.data.employerNotes;
    }

    const updated = await Application.findByIdAndUpdate(
      applicationId,
      {
        ...(Object.keys(updates).length > 0 ? { $set: updates } : {}),
        ...(pushHistory.length > 0 ? { $push: { statusHistory: { $each: pushHistory } } } : {}),
      },
      { new: true }
    )
      .populate('jobId', 'title companyName')
      .populate('studentId', 'name email')
      .lean();

    if (parsed.data.status) {
      await onApplicationStatusChangedForApplication(applicationId).catch(console.error);
    }

    return NextResponse.json({
      message: 'Application updated successfully.',
      application: updated,
    });
  } catch (error) {
    console.error('[ADMIN APPLICATION UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update application' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { applicationId } = await params;
    if (!mongoose.Types.ObjectId.isValid(applicationId)) {
      return NextResponse.json({ error: 'Invalid application ID' }, { status: 400 });
    }

    await connectDB();

    const application = await Application.findById(applicationId).select('jobId studentId');
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    await Promise.all([
      Assessment.updateMany(
        { assignedApplicationIds: application._id },
        { $pull: { assignedApplicationIds: application._id } }
      ),
      AssessmentSubmission.deleteMany({ applicationId }),
      JobView.updateMany(
        { jobId: application.jobId, studentId: application.studentId },
        { $set: { isApplied: false } }
      ),
      Job.findByIdAndUpdate(application.jobId, { $inc: { applicationCount: -1 } }),
      Application.findByIdAndDelete(applicationId),
    ]);

    return NextResponse.json({ message: 'Application deleted successfully.' });
  } catch (error) {
    console.error('[ADMIN APPLICATION DELETE ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete application' }, { status: 500 });
  }
}
