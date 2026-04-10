// src/app/api/resume/platform-activity/route.ts
// GET /api/resume/platform-activity
// Returns student's applications and event registrations for the resume page

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const oid = new mongoose.Types.ObjectId(session.user.id);

    const applications = await Application.find({ studentId: oid })
      .populate(
        'jobId',
        'title type companyName city locationType applicationDeadline stipendBDT durationMonths requiredSkills'
      )
      .sort({ appliedAt: -1 })
      .lean();

    const jobApplications = applications
      .filter((a) => !a.isEventRegistration)
      .map((a) => {
        const job = a.jobId as Record<string, unknown> | null;
        return {
          _id: (a._id as mongoose.Types.ObjectId).toString(),
          status: a.status,
          appliedAt: a.appliedAt?.toISOString() ?? null,
          fitScore: a.fitScore ?? null,
          coverLetter: a.coverLetter ?? null,
          job: job
            ? {
                _id: (job._id as mongoose.Types.ObjectId).toString(),
                title: job.title as string,
                type: job.type as string,
                companyName: job.companyName as string,
                city: (job.city as string) ?? null,
                locationType: job.locationType as string,
                applicationDeadline: job.applicationDeadline
                  ? (job.applicationDeadline as Date).toISOString()
                  : null,
                stipendBDT: (job.stipendBDT as number) ?? null,
                durationMonths: (job.durationMonths as number) ?? null,
                requiredSkills: (job.requiredSkills as string[]) ?? [],
              }
            : null,
        };
      });

    const eventRegistrations = applications
      .filter((a) => a.isEventRegistration)
      .map((a) => {
        const job = a.jobId as Record<string, unknown> | null;
        return {
          _id: (a._id as mongoose.Types.ObjectId).toString(),
          status: a.status,
          appliedAt: a.appliedAt?.toISOString() ?? null,
          job: job
            ? {
                _id: (job._id as mongoose.Types.ObjectId).toString(),
                title: job.title as string,
                type: job.type as string,
                companyName: job.companyName as string,
                applicationDeadline: job.applicationDeadline
                  ? (job.applicationDeadline as Date).toISOString()
                  : null,
              }
            : null,
        };
      });

    return NextResponse.json({ jobApplications, eventRegistrations });
  } catch (err) {
    console.error('[PLATFORM ACTIVITY ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch activity' }, { status: 500 });
  }
}
