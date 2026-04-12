// src/lib/notify.ts

import { connectDB } from '@/lib/db';
import { Notification, type NotificationType } from '@/models/Notification';
import { User } from '@/models/User';
import { pusherServer, userChannel, PUSHER_EVENTS } from '@/lib/pusher';

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  meta?: Record<string, unknown>;
  expiresAt?: Date;
  sendEmail?: boolean;
};

export async function createNotification(input: CreateNotificationInput) {
  try {
    await connectDB();

    const notification = await Notification.create({
      userId: input.userId,
      type: input.type,
      title: input.title,
      body: input.body,
      link: input.link,
      meta: input.meta ?? {},
      expiresAt: input.expiresAt,
      isRead: false,
      isEmailSent: false,
    });

    await pusherServer.trigger(userChannel(input.userId), PUSHER_EVENTS.NEW_NOTIFICATION, {
      _id: notification._id.toString(),
      type: notification.type,
      title: notification.title,
      body: notification.body,
      link: notification.link,
      meta: notification.meta,
      isRead: false,
      createdAt: notification.createdAt,
    });

    return notification;
  } catch (err) {
    console.error('[NOTIFY ERROR]', err);
    return null;
  }
}

// ── Application status changed ─────────────────────────────────────────────
export async function notifyApplicationStatusChanged(
  studentId: string,
  jobTitle: string,
  companyName: string,
  newStatus: string,
  applicationId: string
) {
  type StatusConfig = {
    type: NotificationType;
    icon: string; // Lucide React icon name
    title: string;
    body: string;
    prefKey: string;
  };

  const STATUS_CONFIG: Record<string, StatusConfig> = {
    under_review: {
      type: 'status_update',
      icon: 'ScanSearch',
      title: 'Your application is under review',
      body: `${companyName} is currently reviewing your application for "${jobTitle}". Hang tight — we'll notify you of any updates.`,
      prefKey: 'application_under_review',
    },
    shortlisted: {
      type: 'status_update',
      icon: 'ListChecks',
      title: "You've been shortlisted!",
      body: `Great news! ${companyName} has shortlisted you for "${jobTitle}". Prepare well — the next step may come soon.`,
      prefKey: 'application_shortlisted',
    },
    assessment_sent: {
      type: 'status_update',
      icon: 'ClipboardList',
      title: `Assessment sent — "${jobTitle}"`,
      body: `${companyName} has sent you an assessment for "${jobTitle}". Check your application tracker and complete it before the deadline.`,
      prefKey: 'application_assessment_sent',
    },
    interview_scheduled: {
      type: 'interview_scheduled',
      icon: 'CalendarCheck',
      title: `Interview scheduled — "${jobTitle}"`,
      body: `${companyName} has scheduled an interview for your "${jobTitle}" application. Check your application tracker for full details.`,
      prefKey: 'application_interview',
    },
    hired: {
      type: 'status_update',
      icon: 'BadgeCheck',
      title: 'Congratulations — you got the role!',
      body: `${companyName} has officially selected you for "${jobTitle}". Welcome aboard — this is just the beginning!`,
      prefKey: 'application_hired',
    },
    rejected: {
      type: 'status_update',
      icon: 'MailOpen',
      title: `Application update from ${companyName}`,
      body: `After careful consideration, ${companyName} has decided not to move forward with your application for "${jobTitle}". Keep going — every step brings you closer to the right opportunity.`,
      prefKey: 'application_rejected',
    },
    withdrawn: {
      type: 'status_update',
      icon: 'Undo2',
      title: 'Application withdrawn',
      body: `Your application for "${jobTitle}" at ${companyName} has been successfully withdrawn.`,
      prefKey: 'application_withdrawn',
    },
  };

  const cfg = STATUS_CONFIG[newStatus];
  if (!cfg) return; // unknown status — skip silently

  // ── Check notification preference before sending ──
  const student = await User.findById(studentId).select('notificationPreferences').lean();

  const prefs = (student as { notificationPreferences?: Record<string, boolean> } | null)
    ?.notificationPreferences;

  if (prefs?.[cfg.prefKey] === false) return; // student turned this off

  await createNotification({
    userId: studentId,
    type: cfg.type,
    title: cfg.title,
    body: cfg.body,
    link: '/student/applications',
    meta: { applicationId, jobTitle, companyName, newStatus, icon: cfg.icon },
  });
}

// ── Job applied ────────────────────────────────────────────────────────────
export async function notifyJobApplied(
  studentId: string,
  jobTitle: string,
  companyName: string,
  applicationId: string
) {
  await createNotification({
    userId: studentId,
    type: 'status_update',
    title: 'Application submitted',
    body: `Your application for "${jobTitle}" at ${companyName} has been submitted successfully. We'll notify you of any updates.`,
    link: '/student/applications',
    meta: { applicationId, jobTitle, companyName, icon: 'CircleCheck' },
  });
}

// ── Deadline reminder ──────────────────────────────────────────────────────
export async function notifyDeadlineReminder(
  studentId: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
  deadline: Date,
  daysLeft: number
) {
  // Check preference
  const student = await User.findById(studentId).select('notificationPreferences').lean();
  const prefs = (student as { notificationPreferences?: Record<string, boolean> } | null)
    ?.notificationPreferences;
  if (prefs?.deadline_reminders === false) return;

  await createNotification({
    userId: studentId,
    type: 'deadline_reminder',
    title: `Deadline in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    body: `"${jobTitle}" at ${companyName} closes on ${deadline.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}. Don't miss your chance to apply!`,
    link: `/student/jobs/${jobId}`,
    meta: {
      jobId,
      jobTitle,
      companyName,
      deadline: deadline.toISOString(),
      daysLeft,
      icon: 'AlarmClock',
    },
    expiresAt: deadline,
  });
}

// ── Badge earned ───────────────────────────────────────────────────────────
export async function notifyBadgeEarned(
  userId: string,
  badgeName: string,
  badgeIcon: string,
  badgeSlug: string
) {
  // Check preference
  const student = await User.findById(userId).select('notificationPreferences').lean();
  const prefs = (student as { notificationPreferences?: Record<string, boolean> } | null)
    ?.notificationPreferences;
  if (prefs?.badge_earned === false) return;

  await createNotification({
    userId,
    type: 'badge_earned',
    title: `Badge earned: ${badgeName}`,
    body: `You just unlocked the "${badgeName}" badge on Nextern. Keep engaging to earn more!`,
    link: '/student/badges',
    meta: { badgeSlug, badgeName, badgeIcon, icon: 'Award' },
  });
}

// ── Job match ──────────────────────────────────────────────────────────────
export async function notifyJobMatch(
  studentId: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
  fitScore: number
) {
  // Check preference
  const student = await User.findById(studentId).select('notificationPreferences').lean();
  const prefs = (student as { notificationPreferences?: Record<string, boolean> } | null)
    ?.notificationPreferences;
  if (prefs?.job_matches === false) return;

  await createNotification({
    userId: studentId,
    type: 'job_match',
    title: `New job match — ${fitScore}% fit`,
    body: `"${jobTitle}" at ${companyName} is a strong match for your profile. Check it out before the deadline!`,
    link: `/student/jobs/${jobId}`,
    meta: { jobId, jobTitle, companyName, fitScore, icon: 'Sparkles' },
  });
}

// ── Advisor note ───────────────────────────────────────────────────────────
export async function notifyAdvisorNote(
  studentId: string,
  advisorName: string,
  notePreview: string
) {
  // Check preference
  const student = await User.findById(studentId).select('notificationPreferences').lean();
  const prefs = (student as { notificationPreferences?: Record<string, boolean> } | null)
    ?.notificationPreferences;
  if (prefs?.advisor_notes === false) return;

  await createNotification({
    userId: studentId,
    type: 'advisor_note',
    title: 'Note from your advisor',
    body: `${advisorName}: "${notePreview.slice(0, 100)}${notePreview.length > 100 ? '…' : ''}"`,
    link: '/student/dashboard',
    meta: { advisorName, icon: 'MessageSquare' },
  });
}

// ── Interview scheduled ────────────────────────────────────────────────────
export async function notifyInterviewScheduled(
  studentId: string,
  jobTitle: string,
  companyName: string,
  scheduledAt: Date,
  applicationId: string
) {
  await createNotification({
    userId: studentId,
    type: 'interview_scheduled',
    title: `Interview scheduled — "${jobTitle}"`,
    body: `${companyName} has scheduled an interview for "${jobTitle}" on ${scheduledAt.toLocaleDateString(
      'en-US',
      {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )}.`,
    link: '/student/applications',
    meta: {
      applicationId,
      jobTitle,
      companyName,
      scheduledAt: scheduledAt.toISOString(),
      icon: 'CalendarCheck',
    },
  });
}
