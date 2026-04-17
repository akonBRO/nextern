// src/lib/employer-calendar-events.ts
// Fetches employer-facing calendar events in the same shape used by CalendarBoard.

import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';
import mongoose from 'mongoose';
import type { UpcomingCalendarEvent } from '@/lib/calendar-events';

function daysUntil(date: Date, now: Date) {
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

export async function getEmployerCalendarEvents(
  employerId: string,
  limit = 24
): Promise<UpcomingCalendarEvent[]> {
  await connectDB();

  const oid = new mongoose.Types.ObjectId(employerId);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  const [applications, jobs] = await Promise.all([
    Application.find({
      employerId: oid,
      status: { $nin: ['rejected', 'withdrawn'] },
      interviewScheduledAt: { $gte: now, $lte: cutoff },
    })
      .populate('studentId', 'name')
      .populate('jobId', 'title type')
      .lean(),
    Job.find({
      employerId: oid,
      isActive: true,
      $or: [
        { applicationDeadline: { $gte: now, $lte: cutoff } },
        { type: { $in: ['webinar', 'workshop'] }, startDate: { $gte: now, $lte: cutoff } },
      ],
    })
      .select('title companyName applicationDeadline startDate type')
      .lean(),
  ]);

  const events: UpcomingCalendarEvent[] = [];

  for (const application of applications) {
    const student = application.studentId as { name?: string } | null;
    const job = application.jobId as {
      _id: mongoose.Types.ObjectId;
      title?: string;
      type?: string;
    } | null;

    if (!job || application.status !== 'interview_scheduled' || !application.interviewScheduledAt) {
      continue;
    }

    const interviewDate = new Date(application.interviewScheduledAt);
    if (interviewDate <= now || interviewDate > cutoff) continue;

    events.push({
      id: `employer-interview-${application._id}`,
      type: 'interview',
      title: student?.name ?? 'Candidate interview',
      companyName: job.title ?? 'Interview',
      date: interviewDate.toISOString(),
      daysLeft: daysUntil(interviewDate, now),
      status: application.status,
      jobId: job._id.toString(),
      applicationId: application._id.toString(),
      isSynced: false,
      jobType: job.type,
    });
  }

  for (const job of jobs) {
    const jobId = job._id.toString();

    if (job.type === 'webinar' || job.type === 'workshop') {
      if (job.startDate) {
        const eventDate = new Date(job.startDate);
        if (eventDate > now && eventDate <= cutoff) {
          events.push({
            id: `employer-event-${jobId}`,
            type: 'event_registration',
            title: job.title,
            companyName: job.type === 'webinar' ? 'Webinar event' : 'Workshop event',
            date: eventDate.toISOString(),
            daysLeft: daysUntil(eventDate, now),
            status: 'scheduled',
            jobId,
            applicationId: '',
            isSynced: false,
            jobType: job.type,
          });
        }
      }

      continue;
    }

    if (!job.applicationDeadline) continue;

    const deadline = new Date(job.applicationDeadline);
    if (deadline <= now || deadline > cutoff) continue;

    events.push({
      id: `employer-deadline-${jobId}`,
      type: 'deadline',
      title: job.title,
      companyName: 'Application deadline',
      date: deadline.toISOString(),
      daysLeft: daysUntil(deadline, now),
      status: 'deadline',
      jobId,
      applicationId: '',
      isSynced: false,
      jobType: job.type,
    });
  }

  return events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}
