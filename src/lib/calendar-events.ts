// src/lib/calendar-events.ts
// Fetches upcoming calendar events for the student dashboard widget

import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { JobView } from '@/models/JobView';
import mongoose from 'mongoose';

export type UpcomingCalendarEvent = {
  id: string;
  type: 'deadline' | 'interview' | 'event_registration';
  title: string;
  companyName: string;
  date: string; // ISO string
  daysLeft: number;
  status: string;
  jobId: string;
  applicationId?: string;
  href?: string;
  isSynced: boolean;
  jobType?: string;
};

export async function getUpcomingCalendarEvents(
  userId: string,
  limit = 6
): Promise<UpcomingCalendarEvent[]> {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000); // 12 months ahead

  const [applications, savedJobViews] = await Promise.all([
    Application.find({
      studentId: oid,
      status: { $nin: ['rejected', 'withdrawn'] },
    })
      .populate('jobId', 'title companyName applicationDeadline startDate type')
      .lean(),
    JobView.find({
      studentId: oid,
      isSaved: true,
    })
      .populate('jobId', 'title companyName applicationDeadline type isActive')
      .lean(),
  ]);

  const events: UpcomingCalendarEvent[] = [];
  const jobIdsWithActiveApplications = new Set<string>();

  for (const app of applications) {
    const job = app.jobId as {
      _id: mongoose.Types.ObjectId;
      title: string;
      companyName: string;
      applicationDeadline?: Date;
      startDate?: Date;
      type: string;
    } | null;

    if (!job) continue;
    jobIdsWithActiveApplications.add(job._id.toString());

    // Interview scheduled
    if (app.status === 'interview_scheduled' && app.interviewScheduledAt) {
      const date = new Date(app.interviewScheduledAt);
      if (date > now && date <= cutoff) {
        const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000);
        events.push({
          id: `interview-${app._id}`,
          type: 'interview',
          title: job.title,
          companyName: job.companyName,
          date: date.toISOString(),
          daysLeft,
          status: app.status,
          jobId: job._id.toString(),
          applicationId: app._id.toString(),
          href: '/student/applications',
          isSynced: !!app.googleCalendarEventId,
          jobType: job.type,
        });
      }
    }

    // Event registration (webinar/workshop)
    if (app.isEventRegistration && job.startDate) {
      const date = new Date(job.startDate);
      if (date > now && date <= cutoff) {
        const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000);
        events.push({
          id: `event-${app._id}`,
          type: 'event_registration',
          title: job.title,
          companyName: job.companyName,
          date: date.toISOString(),
          daysLeft,
          status: app.status,
          jobId: job._id.toString(),
          applicationId: app._id.toString(),
          href: '/student/applications',
          isSynced: !!app.googleCalendarEventId,
          jobType: job.type,
        });
      }
    }

    // Job application deadline
    if (!app.isEventRegistration && job.applicationDeadline) {
      const date = new Date(job.applicationDeadline);
      if (date > now && date <= cutoff) {
        const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000);
        events.push({
          id: `deadline-${app._id}`,
          type: 'deadline',
          title: job.title,
          companyName: job.companyName,
          date: date.toISOString(),
          daysLeft,
          status: app.status,
          jobId: job._id.toString(),
          applicationId: app._id.toString(),
          href: '/student/applications',
          isSynced: !!app.googleCalendarEventId,
          jobType: job.type,
        });
      }
    }
  }

  for (const view of savedJobViews) {
    const job = view.jobId as unknown as {
      _id: mongoose.Types.ObjectId;
      title: string;
      companyName: string;
      applicationDeadline?: Date;
      type?: string;
      isActive?: boolean;
    } | null;

    if (!job?.applicationDeadline || job.isActive === false) continue;

    const jobId = job._id.toString();
    if (jobIdsWithActiveApplications.has(jobId)) continue;

    const date = new Date(job.applicationDeadline);
    if (date <= now || date > cutoff) continue;

    const daysLeft = Math.ceil((date.getTime() - now.getTime()) / 86400000);
    events.push({
      id: `saved-deadline-${view._id}`,
      type: 'deadline',
      title: job.title,
      companyName: job.companyName,
      date: date.toISOString(),
      daysLeft,
      status: 'saved',
      jobId,
      href: `/student/jobs/${jobId}`,
      isSynced: !!view.googleCalendarEventId,
      jobType: job.type,
    });
  }

  // Sort by date ascending, limit
  return events
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}
