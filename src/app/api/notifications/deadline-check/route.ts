// src/app/api/notifications/deadline-check/route.ts
// GET /api/notifications/deadline-check
//
// This endpoint scans all active job applications where:
//   - The job's applicationDeadline is 1, 2, or 3 days away
//   - The student has not yet received a reminder for that job+day combo
//
// Call this from Vercel Cron (vercel.json) or any external scheduler.
// Add to vercel.json:
// {
//   "crons": [{ "path": "/api/notifications/deadline-check", "schedule": "0 9 * * *" }]
// }
//
// The cron-secret header protects it from public access.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { JobView } from '@/models/JobView';
import { Notification } from '@/models/Notification';
import { sendHiringSuiteReminders } from '@/lib/hiring-suite';
import { notifyDeadlineReminder } from '@/lib/notify';
import mongoose from 'mongoose';

const CRON_SECRET = process.env.CRON_SECRET ?? 'nextern-cron-2026';
const REMIND_DAYS = [3, 2, 1]; // fire reminders at these days-before-deadline

export async function GET(req: NextRequest) {
  // ── Auth check ──────────────────────────────────────────────────────────
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const now = new Date();
    const fired: string[] = [];
    const skipped: string[] = [];

    // Find all saved jobs with upcoming deadlines (within 3 days)
    const cutoff = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000); // 4 days out

    const savedJobs = await JobView.find({
      isSaved: true,
    })
      .populate('jobId', 'title companyName applicationDeadline isActive')
      .lean();

    for (const savedJob of savedJobs) {
      const job = savedJob.jobId as unknown as {
        _id: mongoose.Types.ObjectId;
        title: string;
        companyName: string;
        applicationDeadline?: Date;
        isActive?: boolean;
      } | null;

      if (!job?.applicationDeadline) continue;
      if (!job.isActive) continue;

      const deadline = new Date(job.applicationDeadline);
      if (deadline <= now || deadline > cutoff) continue;

      const msLeft = deadline.getTime() - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));

      if (!REMIND_DAYS.includes(daysLeft)) continue;

      const studentId = savedJob.studentId.toString();
      const jobId = job._id.toString();

      // Check if we already sent a reminder for this (student, job, daysLeft) combo
      const alreadySent = await Notification.exists({
        userId: studentId,
        type: 'deadline_reminder',
        'meta.jobId': jobId,
        'meta.daysLeft': daysLeft,
      });

      if (alreadySent) {
        skipped.push(`${studentId}:${jobId}:${daysLeft}d`);
        continue;
      }

      await notifyDeadlineReminder(
        studentId,
        job.title,
        job.companyName,
        jobId,
        deadline,
        daysLeft
      );

      fired.push(`${studentId}:${jobId}:${daysLeft}d`);
    }

    await sendHiringSuiteReminders().catch((error) => {
      console.error('[HIRING REMINDER ERROR]', error);
    });

    return NextResponse.json({
      message: 'Deadline check complete',
      fired: fired.length,
      skipped: skipped.length,
      details: { fired, skipped },
    });
  } catch (err) {
    console.error('[DEADLINE CHECK ERROR]', err);
    return NextResponse.json({ error: 'Deadline check failed' }, { status: 500 });
  }
}
