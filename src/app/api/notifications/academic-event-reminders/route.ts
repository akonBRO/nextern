import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import { notifyHostedEventReminder, notifyRegisteredEventReminder } from '@/lib/notify';

const CRON_SECRET = process.env.CRON_SECRET ?? 'nextern-cron-2026';
const REMIND_DAYS = [3, 2, 1];

function daysUntil(targetDate: Date, now: Date) {
  return Math.ceil((targetDate.getTime() - now.getTime()) / 86400000);
}

export async function GET(req: NextRequest) {
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== CRON_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  try {
    await connectDB();

    const now = new Date();
    const cutoff = new Date(now.getTime() + 4 * 24 * 60 * 60 * 1000);

    const jobs = await Job.find({
      isActive: true,
      type: { $in: ['webinar', 'workshop'] },
      $or: [
        { applicationDeadline: { $gt: now, $lte: cutoff } },
        { startDate: { $gt: now, $lte: cutoff } },
      ],
    })
      .select('title companyName employerId applicationDeadline startDate')
      .lean();

    const ownerIds = [...new Set(jobs.map((job) => job.employerId.toString()))];
    const owners = await User.find({ _id: { $in: ownerIds } })
      .select('role')
      .lean();
    const ownerRoleMap = new Map(
      owners
        .filter((owner) => owner.role === 'advisor' || owner.role === 'dept_head')
        .map((owner) => [owner._id.toString(), owner.role as 'advisor' | 'dept_head'])
    );

    let fired = 0;
    let skipped = 0;

    for (const job of jobs) {
      const ownerRole = ownerRoleMap.get(job.employerId.toString());
      if (!ownerRole) continue;

      const reminders = [
        job.applicationDeadline
          ? {
              kind: 'registration_deadline' as const,
              targetDate: new Date(job.applicationDeadline),
              preferenceKey: 'deadline_reminders',
            }
          : null,
        job.startDate
          ? {
              kind: 'event_start' as const,
              targetDate: new Date(job.startDate),
              preferenceKey: 'event_reminders',
            }
          : null,
      ].filter(Boolean) as Array<{
        kind: 'registration_deadline' | 'event_start';
        targetDate: Date;
        preferenceKey: string;
      }>;

      for (const reminder of reminders) {
        const daysLeft = daysUntil(reminder.targetDate, now);
        if (!REMIND_DAYS.includes(daysLeft)) continue;

        const alreadySent = await Notification.exists({
          userId: job.employerId,
          type: 'deadline_reminder',
          'meta.jobId': job._id.toString(),
          'meta.reminderKind': reminder.kind,
          'meta.daysLeft': daysLeft,
        });

        if (alreadySent) {
          skipped++;
          continue;
        }

        await notifyHostedEventReminder({
          ownerId: job.employerId.toString(),
          ownerRole,
          eventTitle: job.title,
          organizationName: job.companyName,
          jobId: job._id.toString(),
          reminderDate: reminder.targetDate,
          daysLeft,
          kind: reminder.kind,
        });
        fired++;

        if (reminder.kind !== 'event_start') continue;

        const registrations = await Application.find({
          jobId: job._id,
          isEventRegistration: true,
          status: { $ne: 'withdrawn' },
        })
          .select('studentId')
          .lean();

        for (const registration of registrations) {
          const studentAlreadySent = await Notification.exists({
            userId: registration.studentId,
            type: 'deadline_reminder',
            'meta.jobId': job._id.toString(),
            'meta.reminderKind': 'registered_event_start',
            'meta.daysLeft': daysLeft,
          });

          if (studentAlreadySent) {
            skipped++;
            continue;
          }

          await notifyRegisteredEventReminder({
            studentId: registration.studentId.toString(),
            eventTitle: job.title,
            organizationName: job.companyName,
            jobId: job._id.toString(),
            eventDate: reminder.targetDate,
            daysLeft,
          });
          fired++;
        }
      }
    }

    return NextResponse.json({
      message: 'Academic event reminders complete',
      fired,
      skipped,
    });
  } catch (error) {
    console.error('[ACADEMIC EVENT REMINDERS ERROR]', error);
    return NextResponse.json({ error: 'Academic event reminders failed' }, { status: 500 });
  }
}
