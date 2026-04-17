// src/lib/notify.ts

import { connectDB } from '@/lib/db';
import { Notification, type NotificationType } from '@/models/Notification';
import { User } from '@/models/User';
import { pusherServer, userChannel, PUSHER_EVENTS } from '@/lib/pusher';
import {
  sendEmail,
  applicationStatusEmailTemplate,
  deadlineReminderEmailTemplate,
} from '@/lib/email';

type ApplicationStatusEmailType = Parameters<typeof applicationStatusEmailTemplate>[0]['status'];

export type CreateNotificationInput = {
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  link?: string;
  meta?: Record<string, unknown>;
  expiresAt?: Date;
  sendEmail?: boolean;
  preferenceKey?: string;
};

export async function createNotification(input: CreateNotificationInput) {
  try {
    await connectDB();

    if (input.preferenceKey) {
      const user = await User.findById(input.userId).select('notificationPreferences').lean();
      const prefs = normalizeNotificationPreferences(
        (user as { notificationPreferences?: Record<string, boolean> } | null)
          ?.notificationPreferences
      );
      if (prefs[input.preferenceKey] === false) {
        return null;
      }
    }

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

const EMAIL_STATUSES = new Set<ApplicationStatusEmailType>([
  'under_review',
  'shortlisted',
  'assessment_sent',
  'interview_scheduled',
  'hired',
  'rejected',
] as const);

// ── Application status changed ─────────────────────────────────────────────
export async function notifyApplicationStatusChanged(
  studentId: string,
  jobTitle: string,
  companyName: string,
  newStatus: string,
  applicationId: string,
  extra?: {
    assessmentAssignmentId?: string;
    interviewSessionId?: string;
  }
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

  const link =
    newStatus === 'assessment_sent' && extra?.assessmentAssignmentId
      ? `/student/assessments/${extra.assessmentAssignmentId}`
      : newStatus === 'interview_scheduled' && extra?.interviewSessionId
        ? `/student/interviews/${extra.interviewSessionId}`
        : '/student/applications';

  // ── Check notification preference before sending ──
  const student = await User.findById(studentId)
    .select('name email notificationPreferences')
    .lean();

  if (!student) return;

  const prefs = normalizeNotificationPreferences(
    (student as { notificationPreferences?: Record<string, boolean> } | null)
      ?.notificationPreferences
  );

  if (prefs[cfg.prefKey] === false) return; // student turned this off

  await createNotification({
    userId: studentId,
    type: cfg.type,
    title: cfg.title,
    body: cfg.body,
    link,
    meta: {
      applicationId,
      jobTitle,
      companyName,
      newStatus,
      icon: cfg.icon,
      assessmentAssignmentId: extra?.assessmentAssignmentId,
      interviewSessionId: extra?.interviewSessionId,
    },
  });

  const emailStatus = EMAIL_STATUSES.has(newStatus as ApplicationStatusEmailType)
    ? (newStatus as ApplicationStatusEmailType)
    : null;

  if (emailStatus && student.email) {
    const { subject, html } = applicationStatusEmailTemplate({
      studentName: student.name ?? 'Student',
      jobTitle,
      companyName,
      status: emailStatus,
    });

    void sendEmail({ to: student.email, subject, html }).catch((err) => {
      console.error('[STATUS EMAIL ERROR]', err);
    });
  }
}

// ── Job applied ────────────────────────────────────────────────────────────
const DEFAULT_NOTIFICATION_PREFERENCES: Record<string, boolean> = {
  application_received: true,
  application_under_review: true,
  application_shortlisted: true,
  application_assessment_sent: true,
  application_interview: true,
  application_hired: true,
  application_rejected: true,
  application_withdrawn: true,
  deadline_reminders: true,
  job_matches: true,
  badge_earned: true,
  advisor_notes: true,
  event_registrations: true,
  waitlist_updates: true,
  student_messages: true,
  event_reminders: true,
};

function normalizeNotificationPreferences(
  prefs?: Record<string, boolean> | null
): Record<string, boolean> {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(prefs ?? {}) };
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
    title: 'Application submitted',
    body: `Your application for "${jobTitle}" at ${companyName} has been submitted successfully. We'll notify you of any updates.`,
    link: '/student/applications',
    meta: { applicationId, jobTitle, companyName, icon: 'CircleCheck' },
  });
}

export async function notifyEmployerApplicationReceived(
  employerId: string,
  studentName: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
  applicationId: string,
  options?: { isEventRegistration?: boolean }
) {
  let employerRole: string | undefined;

  if (options?.isEventRegistration) {
    const employer = await User.findById(employerId).select('role').lean();
    employerRole = employer?.role as string | undefined;
  }

  const isAdvisorEvent =
    options?.isEventRegistration && (employerRole === 'advisor' || employerRole === 'dept_head');

  await createNotification({
    userId: employerId,
    type: 'application_received',
    title: isAdvisorEvent
      ? `New registration from ${studentName}`
      : `New application from ${studentName}`,
    body: isAdvisorEvent
      ? `${studentName} registered for "${jobTitle}". Review the registrant from your event dashboard.`
      : `${studentName} has applied for "${jobTitle}" at ${companyName}. Review the applicant in your hiring pipeline.`,
    link: isAdvisorEvent
      ? `/advisor/events/${jobId}/applicants`
      : `/employer/jobs/${jobId}/applicants`,
    meta: { jobId, applicationId, studentName, companyName, icon: 'Users' },
    preferenceKey: options?.isEventRegistration ? 'event_registrations' : 'application_received',
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
  const student = await User.findById(studentId)
    .select('name email notificationPreferences')
    .lean();
  const prefs = normalizeNotificationPreferences(
    (student as { notificationPreferences?: Record<string, boolean> } | null)
      ?.notificationPreferences
  );

  if (prefs.deadline_reminders === false) return;

  const notification = await createNotification({
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

  if (!notification || !student?.email) return;

  const { subject, html } = deadlineReminderEmailTemplate({
    studentName: (student as { name?: string | null } | null)?.name?.trim() || 'Student',
    jobTitle,
    companyName,
    deadline,
    daysLeft,
  });

  void sendEmail({ to: student.email, subject, html })
    .then(() => {
      return Notification.findByIdAndUpdate(notification._id, {
        $set: { isEmailSent: true },
      }).catch(() => {});
    })
    .catch((err) => {
      console.error('[DEADLINE EMAIL ERROR]', err);
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
