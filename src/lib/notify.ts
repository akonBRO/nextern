// src/lib/notify.ts
// Core notification helper used everywhere across the platform.
// Call createNotification() from any server-side code to:
//   1. Save notification to MongoDB
//   2. Push real-time event via Pusher to the user's channel
//   3. Optionally send email (Gmail SMTP)

import { connectDB } from '@/lib/db';
import { Notification, type NotificationType } from '@/models/Notification';
import { pusherServer, userChannel, PUSHER_EVENTS } from '@/lib/pusher';

// ── Types ──────────────────────────────────────────────────────────────────
export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  meta?: Record<string, unknown>;
  expiresAt?: Date; // set for deadline_reminder — auto-deleted after this date
  sendEmail?: boolean; // future: triggers Gmail send
};

// ── Main helper ────────────────────────────────────────────────────────────
export async function createNotification(input: CreateNotificationInput) {
  try {
    await connectDB();

    // 1. Save to MongoDB
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

    // 2. Push real-time to user's Pusher channel
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
    // Notifications are non-critical — never let them crash the caller
    console.error('[NOTIFY ERROR]', err);
    return null;
  }
}

// ── Convenience wrappers ───────────────────────────────────────────────────

export async function notifyApplicationStatusChanged(
  studentId: string,
  jobTitle: string,
  companyName: string,
  newStatus: string,
  applicationId: string
) {
  const statusLabels: Record<string, string> = {
    shortlisted: 'You have been shortlisted! 🎉',
    under_review: 'Your application is under review',
    assessment_sent: 'An assessment has been sent to you',
    interview_scheduled: 'An interview has been scheduled for you! 📅',
    hired: 'Congratulations — you have been hired! 🎊',
    rejected: 'Application update from ' + companyName,
    withdrawn: 'Application withdrawn',
  };

  const statusEmoji: Record<string, string> = {
    shortlisted: '🎉',
    hired: '🎊',
    interview_scheduled: '📅',
    assessment_sent: '📋',
    under_review: '👀',
    rejected: '📩',
  };

  await createNotification({
    userId: studentId,
    type: newStatus === 'interview_scheduled' ? 'interview_scheduled' : 'status_update',
    title: statusLabels[newStatus] ?? `Application status updated`,
    body: `${companyName} updated your application for "${jobTitle}" — status is now: ${newStatus.replace(/_/g, ' ')}.`,
    link: '/student/applications',
    meta: { applicationId, jobTitle, companyName, newStatus },
  });
}

export async function notifyJobApplied(
  studentId: string,
  jobTitle: string,
  companyName: string,
  applicationId: string
) {
  await createNotification({
    userId: studentId,
    type: 'status_update',
    title: `Application submitted`,
    body: `Your application for "${jobTitle}" at ${companyName} has been submitted successfully.`,
    link: '/student/applications',
    meta: { applicationId, jobTitle, companyName },
  });
}

export async function notifyDeadlineReminder(
  studentId: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
  deadline: Date,
  daysLeft: number
) {
  await createNotification({
    userId: studentId,
    type: 'deadline_reminder',
    title: `⏰ Deadline in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`,
    body: `"${jobTitle}" at ${companyName} closes on ${deadline.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}.`,
    link: `/student/jobs/${jobId}`,
    meta: { jobId, jobTitle, companyName, deadline: deadline.toISOString(), daysLeft },
    expiresAt: deadline, // auto-deleted from DB after deadline passes
  });
}

export async function notifyBadgeEarned(
  userId: string,
  badgeName: string,
  badgeIcon: string,
  badgeSlug: string
) {
  await createNotification({
    userId,
    type: 'badge_earned',
    title: `Badge earned: ${badgeName} ${badgeIcon}`,
    body: `You just unlocked the "${badgeName}" badge. Keep it up!`,
    link: '/student/badges',
    meta: { badgeSlug, badgeName, badgeIcon },
  });
}

export async function notifyJobMatch(
  studentId: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
  fitScore: number
) {
  await createNotification({
    userId: studentId,
    type: 'job_match',
    title: `New job match — ${fitScore}% fit`,
    body: `"${jobTitle}" at ${companyName} is a strong match for your profile.`,
    link: `/student/jobs/${jobId}`,
    meta: { jobId, jobTitle, companyName, fitScore },
  });
}

export async function notifyAdvisorNote(
  studentId: string,
  advisorName: string,
  notePreview: string
) {
  await createNotification({
    userId: studentId,
    type: 'advisor_note',
    title: `Note from your advisor`,
    body: `${advisorName}: "${notePreview.slice(0, 100)}${notePreview.length > 100 ? '…' : ''}"`,
    link: '/student/dashboard',
    meta: { advisorName },
  });
}

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
    title: `Interview scheduled 📅`,
    body: `${companyName} has scheduled an interview for "${jobTitle}" on ${scheduledAt.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}.`,
    link: '/student/applications',
    meta: { applicationId, jobTitle, companyName, scheduledAt: scheduledAt.toISOString() },
  });
}
