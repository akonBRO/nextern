import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import type { UpcomingCalendarEvent } from '@/lib/calendar-events';

function daysUntil(date: Date, now: Date) {
  return Math.ceil((date.getTime() - now.getTime()) / 86400000);
}

async function getHostedEvents(
  ownerId: mongoose.Types.ObjectId,
  basePath: '/advisor' | '/dept',
  now: Date,
  cutoff: Date
) {
  const jobs = await Job.find({
    employerId: ownerId,
    type: { $in: ['webinar', 'workshop'] },
    isActive: true,
    $or: [
      { applicationDeadline: { $gte: now, $lte: cutoff } },
      { startDate: { $gte: now, $lte: cutoff } },
    ],
  })
    .select(
      'title companyName type applicationDeadline startDate ownerGoogleCalendarEventId academicSession'
    )
    .lean();

  const events: UpcomingCalendarEvent[] = [];

  for (const job of jobs) {
    const jobId = job._id.toString();

    if (job.applicationDeadline) {
      const deadline = new Date(job.applicationDeadline);
      if (deadline > now && deadline <= cutoff) {
        events.push({
          id: `academic-deadline-${jobId}`,
          type: 'deadline',
          title: job.title,
          companyName: 'Registration deadline',
          date: deadline.toISOString(),
          daysLeft: daysUntil(deadline, now),
          status: 'registration_deadline',
          jobId,
          href: `${basePath}/events/${jobId}/registrants`,
          isSynced: !!job.ownerGoogleCalendarEventId,
          jobType: job.type,
        });
      }
    }

    if (job.startDate) {
      const startDate = new Date(job.startDate);
      if (startDate > now && startDate <= cutoff) {
        events.push({
          id: `academic-event-${jobId}`,
          type: 'event_registration',
          title: job.title,
          companyName: job.type === 'webinar' ? 'Hosted webinar' : 'Hosted workshop',
          date: startDate.toISOString(),
          daysLeft: daysUntil(startDate, now),
          status: 'event_start',
          jobId,
          href: `${basePath}/events/${jobId}/registrants`,
          isSynced: !!job.ownerGoogleCalendarEventId,
          jobType: job.type,
        });
      }
    }
  }

  return events;
}

export async function getAdvisorCalendarEvents(
  advisorId: string,
  limit = 24
): Promise<UpcomingCalendarEvent[]> {
  await connectDB();

  const oid = new mongoose.Types.ObjectId(advisorId);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const hostedEvents = await getHostedEvents(oid, '/advisor', now, cutoff);

  return hostedEvents
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}

export async function getDeptCalendarEvents(
  deptHeadId: string,
  limit = 24
): Promise<UpcomingCalendarEvent[]> {
  await connectDB();

  const oid = new mongoose.Types.ObjectId(deptHeadId);
  const now = new Date();
  const cutoff = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);
  const hostedEvents = await getHostedEvents(oid, '/dept', now, cutoff);

  return hostedEvents
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, limit);
}
