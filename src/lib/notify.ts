// src/lib/notify.ts

import { connectDB } from '@/lib/db';
import { Notification, type NotificationType } from '@/models/Notification';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { User } from '@/models/User';
import { pusherServer, userChannel, PUSHER_EVENTS } from '@/lib/pusher';
import {
  sendEmail,
  applicationStatusEmailTemplate,
  assessmentAssignedEmailTemplate,
  deadlineReminderEmailTemplate,
  employerApplicationNotificationEmailTemplate,
  eventRegistrationConfirmationEmailTemplate,
  hostedEventReminderEmailTemplate,
  registeredEventReminderEmailTemplate,
} from '@/lib/email';
import { formatDhakaDateTime } from '@/lib/datetime';

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

  type AssessmentEmailDetails = {
    dueAt?: Date | null;
    assessmentId?:
      | {
          title?: string | null;
          totalMarks?: number | null;
          durationMinutes?: number | null;
        }
      | string
      | null;
  } | null;

  const assessmentDetails =
    newStatus === 'assessment_sent' && extra?.assessmentAssignmentId
      ? ((await AssessmentAssignment.findById(extra.assessmentAssignmentId)
          .populate('assessmentId', 'title totalMarks durationMinutes')
          .select('dueAt assessmentId')
          .lean()) as AssessmentEmailDetails)
      : null;

  const assessmentRecord =
    assessmentDetails?.assessmentId && typeof assessmentDetails.assessmentId === 'object'
      ? assessmentDetails.assessmentId
      : null;

  const dueLabel =
    newStatus === 'assessment_sent'
      ? formatDhakaDateTime(assessmentDetails?.dueAt, 'No deadline set')
      : null;

  const notificationBody =
    newStatus === 'assessment_sent' && dueLabel
      ? `${companyName} has sent you an assessment for "${jobTitle}". Due: ${dueLabel}. Check your application tracker and complete it before the deadline.`
      : cfg.body;

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
    body: notificationBody,
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
    const appUrl = (process.env.NEXTAUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');
    const { subject, html } =
      emailStatus === 'assessment_sent'
        ? assessmentAssignedEmailTemplate({
            studentName: student.name ?? 'Student',
            jobTitle,
            companyName,
            assessmentTitle: assessmentRecord?.title?.trim() || `${jobTitle} assessment`,
            totalMarks: assessmentRecord?.totalMarks ?? null,
            durationMinutes: assessmentRecord?.durationMinutes ?? null,
            dueAt: assessmentDetails?.dueAt ?? null,
            assessmentUrl: `${appUrl}${link}`,
          })
        : applicationStatusEmailTemplate({
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

const DEFAULT_EMAIL_PREFERENCES: Record<string, boolean> = {
  application_received: true,
  deadline_reminders: true,
  event_registrations: true,
  event_reminders: true,
};

function normalizeNotificationPreferences(
  prefs?: Record<string, boolean> | null
): Record<string, boolean> {
  return { ...DEFAULT_NOTIFICATION_PREFERENCES, ...(prefs ?? {}) };
}

function normalizeEmailPreferences(
  prefs?: Record<string, boolean> | null
): Record<string, boolean> {
  return { ...DEFAULT_EMAIL_PREFERENCES, ...(prefs ?? {}) };
}

export async function notifyJobApplied(
  studentId: string,
  jobTitle: string,
  companyName: string,
  applicationId: string,
  options?: {
    isEventRegistration?: boolean;
    eventDate?: Date;
  }
) {
  const isEventRegistration = options?.isEventRegistration === true;
  const eventDateLabel = options?.eventDate?.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  const notification = await createNotification({
    userId: studentId,
    type: 'status_update',
    title: isEventRegistration ? 'Event registration confirmed' : 'Application submitted',
    body:
      isEventRegistration && eventDateLabel
        ? `Your registration for "${jobTitle}" at ${companyName} is confirmed for ${eventDateLabel}. We will remind you again before the event begins.`
        : `Your application for "${jobTitle}" at ${companyName} has been submitted successfully. We'll notify you of any updates.`,
    link: '/student/applications',
    meta: {
      applicationId,
      jobTitle,
      companyName,
      icon: isEventRegistration ? 'CalendarDays' : 'CircleCheck',
      ...(options?.eventDate ? { eventDate: options.eventDate.toISOString() } : {}),
    },
    preferenceKey: isEventRegistration ? 'event_registrations' : undefined,
  });

  if (!isEventRegistration || !notification || !options?.eventDate) return;

  const student = await User.findById(studentId)
    .select('name email notificationPreferences')
    .lean();
  const prefs = normalizeNotificationPreferences(
    (student as { notificationPreferences?: Record<string, boolean> } | null)
      ?.notificationPreferences
  );

  if (prefs.event_registrations === false || !student?.email) return;

  const { subject, html } = eventRegistrationConfirmationEmailTemplate({
    studentName: (student as { name?: string | null } | null)?.name?.trim() || 'Student',
    eventTitle: jobTitle,
    organizationName: companyName,
    eventDate: options.eventDate,
  });

  void sendEmail({ to: student.email, subject, html })
    .then(() =>
      Notification.findByIdAndUpdate(notification._id, {
        $set: { isEmailSent: true },
      }).catch(() => {})
    )
    .catch((err) => {
      console.error('[EVENT REGISTRATION EMAIL ERROR]', err);
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
  const employer = await User.findById(employerId)
    .select('role email name emailPreferences')
    .lean();

  const employerRole = employer?.role as string | undefined;
  const employerEmail = employer?.email as string | undefined;
  const employerName = employer?.name as string | undefined;
  const employerEmailPreferences = employer?.emailPreferences as
    | Record<string, boolean>
    | undefined;

  const isAdvisorEvent =
    options?.isEventRegistration && (employerRole === 'advisor' || employerRole === 'dept_head');
  const advisorEventLink =
    employerRole === 'dept_head'
      ? `/dept/events/${jobId}/applicants`
      : `/advisor/events/${jobId}/applicants`;

  await createNotification({
    userId: employerId,
    type: 'application_received',
    title: isAdvisorEvent
      ? `New registration from ${studentName}`
      : `New application from ${studentName}`,
    body: isAdvisorEvent
      ? `${studentName} registered for "${jobTitle}". Review the registrant from your event dashboard.`
      : `${studentName} has applied for "${jobTitle}" at ${companyName}. Review the applicant in your hiring pipeline.`,
    link: isAdvisorEvent ? advisorEventLink : `/employer/jobs/${jobId}/applicants`,
    meta: { jobId, applicationId, studentName, companyName, icon: 'Users' },
    preferenceKey: options?.isEventRegistration ? 'event_registrations' : 'application_received',
  });

  if (employerRole !== 'employer' || !employerEmail) return;

  const emailPrefs = normalizeEmailPreferences(employerEmailPreferences);
  const emailPreferenceKey = options?.isEventRegistration
    ? 'event_registrations'
    : 'application_received';
  if (emailPrefs[emailPreferenceKey] === false) return;

  const { subject, html } = employerApplicationNotificationEmailTemplate({
    employerName: employerName?.trim() || 'Employer',
    studentName,
    opportunityTitle: jobTitle,
    organizationName: companyName,
    isEventRegistration: options?.isEventRegistration,
  });

  void sendEmail({ to: employerEmail, subject, html }).catch((error) => {
    console.error('[EMPLOYER APPLICATION EMAIL ERROR]', error);
  });
}

// ── Deadline reminder ──────────────────────────────────────────────────────
export async function notifyDeadlineReminder(
  studentId: string,
  jobTitle: string,
  companyName: string,
  jobId: string,
  deadline: Date,
  daysLeft: number,
  reminderWindow?: string
) {
  const student = await User.findById(studentId)
    .select('name email notificationPreferences')
    .lean();
  const prefs = normalizeNotificationPreferences(
    (student as { notificationPreferences?: Record<string, boolean> } | null)
      ?.notificationPreferences
  );

  if (prefs.deadline_reminders === false) return;

  const title =
    reminderWindow === '24h'
      ? 'Deadline in 24 hours'
      : reminderWindow === '6h'
        ? 'Deadline in 6 hours'
        : `Deadline in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;

  const notification = await createNotification({
    userId: studentId,
    type: 'deadline_reminder',
    title,
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
      reminderWindow,
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

export async function notifyHostedEventReminder(params: {
  ownerId: string;
  ownerRole: 'advisor' | 'dept_head' | 'employer';
  eventTitle: string;
  organizationName: string;
  jobId: string;
  reminderDate: Date;
  daysLeft: number;
  reminderWindow?: string;
  kind: 'registration_deadline' | 'event_start';
  opportunityType?: string;
}) {
  const {
    ownerId,
    ownerRole,
    eventTitle,
    organizationName,
    jobId,
    reminderDate,
    daysLeft,
    reminderWindow,
    kind,
    opportunityType,
  } = params;

  const owner = await User.findById(ownerId)
    .select('name email notificationPreferences emailPreferences')
    .lean();

  const prefs = normalizeNotificationPreferences(
    (owner as { notificationPreferences?: Record<string, boolean> } | null)?.notificationPreferences
  );
  const emailPrefs = normalizeEmailPreferences(
    (owner as { emailPreferences?: Record<string, boolean> } | null)?.emailPreferences
  );
  const preferenceKey = kind === 'registration_deadline' ? 'deadline_reminders' : 'event_reminders';

  if (prefs[preferenceKey] === false) return;

  const isHostedEvent = opportunityType === 'webinar' || opportunityType === 'workshop';
  const link =
    ownerRole === 'employer'
      ? `/employer/jobs/${jobId}/applicants`
      : ownerRole === 'dept_head'
        ? `/dept/events/${jobId}/registrants`
        : `/advisor/events/${jobId}/registrants`;
  const title =
    kind === 'registration_deadline'
      ? isHostedEvent
        ? reminderWindow === '24h'
          ? 'Registration closes in 24 hours'
          : reminderWindow === '6h'
            ? 'Registration closes in 6 hours'
            : `Registration closes in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
        : reminderWindow === '24h'
          ? 'Application deadline in 24 hours'
          : reminderWindow === '6h'
            ? 'Application deadline in 6 hours'
            : `Application deadline in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`
      : reminderWindow === '24h'
        ? 'Event starts in 24 hours'
        : reminderWindow === '6h'
          ? 'Event starts in 6 hours'
          : `Event starts in ${daysLeft} day${daysLeft === 1 ? '' : 's'}`;
  const body =
    kind === 'registration_deadline'
      ? isHostedEvent
        ? `Registration for "${eventTitle}" closes on ${reminderDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}. Review registrations and publish any final instructions.`
        : `Applications for "${eventTitle}" close on ${reminderDate.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}. Review your applicant pipeline before the deadline passes.`
      : `"${eventTitle}" begins on ${reminderDate.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        })}. Review your event checklist and confirm the session details.`;

  const notification = await createNotification({
    userId: ownerId,
    type: 'deadline_reminder',
    title,
    body,
    link,
    meta: {
      jobId,
      eventTitle,
      organizationName,
      reminderKind: kind,
      reminderDate: reminderDate.toISOString(),
      daysLeft,
      reminderWindow,
      icon: 'CalendarDays',
    },
    expiresAt: reminderDate,
    preferenceKey,
  });

  if (!notification || !owner?.email || emailPrefs[preferenceKey] === false) return;

  const { subject, html } = hostedEventReminderEmailTemplate({
    recipientName:
      (owner as { name?: string | null } | null)?.name?.trim() ||
      (ownerRole === 'dept_head' ? 'Department head' : 'Advisor'),
    eventTitle,
    organizationName,
    eventDate: reminderDate,
    daysLeft,
    kind,
  });

  void sendEmail({ to: owner.email, subject, html })
    .then(() =>
      Notification.findByIdAndUpdate(notification._id, {
        $set: { isEmailSent: true },
      }).catch(() => {})
    )
    .catch((error) => {
      console.error('[HOSTED EVENT REMINDER EMAIL ERROR]', error);
    });
}

export async function notifyRegisteredEventReminder(params: {
  studentId: string;
  eventTitle: string;
  organizationName: string;
  jobId: string;
  eventDate: Date;
  daysLeft: number;
  reminderWindow?: string;
}) {
  const { studentId, eventTitle, organizationName, jobId, eventDate, daysLeft, reminderWindow } =
    params;

  const student = await User.findById(studentId)
    .select('name email notificationPreferences')
    .lean();

  const prefs = normalizeNotificationPreferences(
    (student as { notificationPreferences?: Record<string, boolean> } | null)
      ?.notificationPreferences
  );

  if (prefs.event_reminders === false) return;

  const title =
    reminderWindow === '24h'
      ? 'Event starts in 24 hours'
      : reminderWindow === '6h'
        ? 'Event starts in 6 hours'
        : `Event starts in ${daysLeft} day${daysLeft !== 1 ? 's' : ''}`;

  const notification = await createNotification({
    userId: studentId,
    type: 'deadline_reminder',
    title,
    body: `Your registered event "${eventTitle}" begins on ${eventDate.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    })}. Please be prepared for the session.`,
    link: '/student/applications',
    meta: {
      jobId,
      eventTitle,
      organizationName,
      reminderKind: 'registered_event_start',
      eventDate: eventDate.toISOString(),
      daysLeft,
      reminderWindow,
      icon: 'CalendarDays',
    },
    expiresAt: eventDate,
  });

  if (!notification || !student?.email) return;

  const { subject, html } = registeredEventReminderEmailTemplate({
    studentName: (student as { name?: string | null } | null)?.name?.trim() || 'Student',
    eventTitle,
    organizationName,
    eventDate,
    daysLeft,
  });

  void sendEmail({ to: student.email, subject, html })
    .then(() => {
      return Notification.findByIdAndUpdate(notification._id, {
        $set: { isEmailSent: true },
      }).catch(() => {});
    })
    .catch((err) => {
      console.error('[REGISTERED EVENT EMAIL ERROR]', err);
    });
}

export async function notifyEmployerRecommendationRequest(params: {
  employerId: string;
  studentId: string;
  studentName: string;
  recommenderId: string;
  recommenderName: string;
  recommenderRole: 'advisor' | 'dept_head';
  recommendationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
}) {
  const {
    employerId,
    studentId,
    studentName,
    recommenderId,
    recommenderName,
    recommenderRole,
    recommendationId,
    jobId,
    jobTitle,
    companyName,
  } = params;

  await createNotification({
    userId: employerId,
    type: 'recommendation_request',
    title: `Recommendation request for ${studentName}`,
    body: `${recommenderName} (${recommenderRole === 'dept_head' ? 'Department head' : 'Advisor'}) recommended ${studentName} for "${jobTitle}" at ${companyName}. Review the request and mark it as accepted, rejected, or on hold.`,
    link: '/employer/recommendations',
    meta: {
      recommendationId,
      studentId,
      recommenderId,
      jobId,
      jobTitle,
      companyName,
      icon: 'SendToBack',
    },
  });
}

export async function notifyRecommendationRequestDecision(params: {
  recommendationId: string;
  recommenderId: string;
  recommenderRole: 'advisor' | 'dept_head';
  employerName: string;
  studentId: string;
  studentName: string;
  jobId: string;
  jobTitle: string;
  requestStatus: 'accepted' | 'rejected' | 'hold';
  employerResponseNote?: string;
}) {
  const {
    recommendationId,
    recommenderId,
    recommenderRole,
    employerName,
    studentId,
    studentName,
    jobId,
    jobTitle,
    requestStatus,
    employerResponseNote,
  } = params;

  const statusLabel =
    requestStatus === 'hold'
      ? 'placed on hold'
      : requestStatus === 'accepted'
        ? 'accepted'
        : 'rejected';
  const title =
    requestStatus === 'hold'
      ? 'Recommendation request placed on hold'
      : `Recommendation request ${requestStatus}`;
  const link =
    recommenderRole === 'dept_head'
      ? `/dept/recommendations?studentId=${studentId}`
      : `/advisor/recommendations?studentId=${studentId}`;

  await createNotification({
    userId: recommenderId,
    type: 'recommendation_request',
    title,
    body: `${employerName} ${statusLabel} your recommendation for ${studentName} on "${jobTitle}".${
      employerResponseNote ? ` Note: ${employerResponseNote}` : ''
    }`,
    link,
    meta: {
      recommendationId,
      studentId,
      jobId,
      jobTitle,
      requestStatus,
      employerResponseNote,
      icon: 'SendToBack',
    },
  });

  await createNotification({
    userId: studentId,
    type: 'status_update',
    title: `Employer reviewed your recommendation for ${jobTitle}`,
    body: `${employerName} ${statusLabel} the academic recommendation shared for "${jobTitle}".${
      employerResponseNote ? ` Feedback: ${employerResponseNote}` : ''
    }`,
    link: '/student/profile',
    meta: {
      recommendationId,
      jobId,
      jobTitle,
      requestStatus,
      employerResponseNote,
      icon: 'Briefcase',
    },
  });
}

export async function notifyMentorshipRequest(
  mentorUserId: string,
  studentName: string,
  sessionType: string
) {
  const sessionTypeLabel = sessionType.replace('_', ' ');
  await createNotification({
    userId: mentorUserId,
    type: 'mentorship_request',
    title: `New mentorship request`,
    body: `${studentName} requested a ${sessionTypeLabel} session. Review the request to accept or decline.`,
    link: '/student/mentorship/dashboard',
    meta: { studentName, sessionType, icon: 'UserPlus' },
  });
}

export async function notifyMentorshipAccepted(
  studentId: string,
  mentorName: string,
  scheduledAt: Date
) {
  await createNotification({
    userId: studentId,
    type: 'mentorship_accepted',
    title: `Mentorship request accepted`,
    body: `${mentorName} accepted your mentorship request. The session is scheduled for ${scheduledAt.toLocaleDateString(
      'en-US',
      {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }
    )}. A message thread has been opened.`,
    link: '/student/mentorship/sessions',
    meta: { mentorName, scheduledAt: scheduledAt.toISOString(), icon: 'UserCheck' },
  });
}
