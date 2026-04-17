// src/lib/calendar.ts
// Google Calendar API wrapper for Nextern
// Handles creating, updating, and deleting calendar events
// for job deadlines, interviews, and event registrations

import { google, calendar_v3 } from 'googleapis';
import { getAuthenticatedClient } from '@/lib/google-oauth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { JobView } from '@/models/JobView';

// ── Types ──────────────────────────────────────────────────────────────────
export type CalendarEventInput = {
  title: string;
  description: string;
  startDateTime: Date;
  endDateTime?: Date; // defaults to startDateTime + 1 hour
  isAllDay?: boolean; // for deadlines — shows as full-day event
  location?: string;
  colorId?: string; // Google Calendar color IDs 1–11
};

// Google Calendar color IDs for reference:
// 1=Lavender, 2=Sage, 3=Grape, 4=Flamingo, 5=Banana
// 6=Tangerine, 7=Peacock, 8=Graphite, 9=Blueberry, 10=Basil, 11=Tomato
const COLOR = {
  deadline: '6', // Tangerine — orange for deadlines
  interview: '9', // Blueberry — blue for interviews
  event: '2', // Sage — green for webinars/workshops
  hired: '10', // Basil — dark green for hired
};

// ── Core helper — get calendar client for a user ───────────────────────────
async function getCalendarForUser(userId: string): Promise<calendar_v3.Calendar | null> {
  await connectDB();

  const user = await User.findById(userId)
    .select('googleRefreshToken googleCalendarConnected')
    .lean();

  if (!user?.googleRefreshToken || !user?.googleCalendarConnected) {
    return null; // User hasn't connected Google Calendar
  }

  try {
    const authClient = await getAuthenticatedClient(user.googleRefreshToken);
    return google.calendar({ version: 'v3', auth: authClient });
  } catch (err) {
    console.error('[CALENDAR] Failed to authenticate:', err);
    return null;
  }
}

// ── Create a calendar event ────────────────────────────────────────────────
async function createCalendarEvent(
  calendar: calendar_v3.Calendar,
  input: CalendarEventInput
): Promise<string | null> {
  try {
    const end = input.isAllDay
      ? (input.endDateTime ?? new Date(input.startDateTime.getTime() + 24 * 60 * 60 * 1000))
      : (input.endDateTime ?? new Date(input.startDateTime.getTime() + 60 * 60 * 1000));

    const eventBody: calendar_v3.Schema$Event = input.isAllDay
      ? {
          summary: input.title,
          description: input.description,
          start: {
            date: input.startDateTime.toISOString().split('T')[0],
            timeZone: 'Asia/Dhaka',
          },
          end: {
            date: end.toISOString().split('T')[0],
            timeZone: 'Asia/Dhaka',
          },
          colorId: input.colorId,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 60 * 24 * 3 }, // 3 days before
              { method: 'popup', minutes: 60 * 24 }, // 1 day before
              { method: 'email', minutes: 60 * 24 * 3 },
            ],
          },
        }
      : {
          summary: input.title,
          description: input.description,
          location: input.location,
          start: {
            dateTime: input.startDateTime.toISOString(),
            timeZone: 'Asia/Dhaka',
          },
          end: {
            dateTime: end.toISOString(),
            timeZone: 'Asia/Dhaka',
          },
          colorId: input.colorId,
          reminders: {
            useDefault: false,
            overrides: [
              { method: 'popup', minutes: 30 },
              { method: 'popup', minutes: 60 * 24 },
              { method: 'email', minutes: 60 },
            ],
          },
        };

    const response = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventBody,
    });

    return response.data.id ?? null;
  } catch (err) {
    console.error('[CALENDAR] Failed to create event:', err);
    return null;
  }
}

// ── Update a calendar event ────────────────────────────────────────────────
async function updateCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string,
  input: Partial<CalendarEventInput>
): Promise<boolean> {
  try {
    const patch: calendar_v3.Schema$Event = {};

    if (input.title) patch.summary = input.title;
    if (input.description) patch.description = input.description;
    if (input.colorId) patch.colorId = input.colorId;

    if (input.startDateTime) {
      const end = input.isAllDay
        ? (input.endDateTime ?? new Date(input.startDateTime.getTime() + 24 * 60 * 60 * 1000))
        : (input.endDateTime ?? new Date(input.startDateTime.getTime() + 60 * 60 * 1000));

      if (input.isAllDay) {
        patch.start = { date: input.startDateTime.toISOString().split('T')[0] };
        patch.end = { date: end.toISOString().split('T')[0] };
      } else {
        patch.start = {
          dateTime: input.startDateTime.toISOString(),
          timeZone: 'Asia/Dhaka',
        };
        patch.end = {
          dateTime: end.toISOString(),
          timeZone: 'Asia/Dhaka',
        };
      }
    }

    await calendar.events.patch({
      calendarId: 'primary',
      eventId,
      requestBody: patch,
    });

    return true;
  } catch (err) {
    console.error('[CALENDAR] Failed to update event:', err);
    return false;
  }
}

// ── Delete a calendar event ────────────────────────────────────────────────
async function deleteCalendarEvent(
  calendar: calendar_v3.Calendar,
  eventId: string
): Promise<boolean> {
  try {
    await calendar.events.delete({
      calendarId: 'primary',
      eventId,
    });
    return true;
  } catch (err) {
    console.error('[CALENDAR] Failed to delete event:', err);
    return false;
  }
}

// ── Public API ─────────────────────────────────────────────────────────────

/**
 * Called when a student applies to a job.
 * Syncs the application deadline as a full-day calendar event.
 */
export async function syncJobDeadlineToCalendar(
  studentId: string,
  applicationId: string,
  jobTitle: string,
  companyName: string,
  deadline: Date
): Promise<void> {
  try {
    const cal = await getCalendarForUser(studentId);
    if (!cal) return; // user hasn't connected calendar — silent skip

    const eventId = await createCalendarEvent(cal, {
      title: `⏰ Deadline: ${jobTitle} at ${companyName}`,
      description:
        `Application deadline for "${jobTitle}" at ${companyName} on Nextern.\n\n` +
        `Track your application at nextern-virid.vercel.app/student/applications`,
      startDateTime: deadline,
      isAllDay: true,
      colorId: COLOR.deadline,
    });

    if (eventId) {
      await Application.findByIdAndUpdate(applicationId, {
        googleCalendarEventId: eventId,
      });
    }
  } catch (err) {
    console.error('[CALENDAR] syncJobDeadlineToCalendar failed:', err);
  }
}

/**
 * Called when a student saves a job.
 * Syncs the job deadline to calendar via JobView.
 */
export async function syncSavedJobDeadlineToCalendar(
  studentId: string,
  jobViewId: string,
  jobTitle: string,
  companyName: string,
  deadline: Date
): Promise<void> {
  try {
    const cal = await getCalendarForUser(studentId);
    if (!cal) return;

    const eventId = await createCalendarEvent(cal, {
      title: `🔖 Saved job deadline: ${jobTitle}`,
      description:
        `You saved "${jobTitle}" at ${companyName} on Nextern. ` +
        `The application deadline is approaching.\n\n` +
        `Apply at nextern-virid.vercel.app/student/jobs`,
      startDateTime: deadline,
      isAllDay: true,
      colorId: COLOR.deadline,
    });

    if (eventId) {
      await JobView.findByIdAndUpdate(jobViewId, {
        googleCalendarEventId: eventId,
      });
    }
  } catch (err) {
    console.error('[CALENDAR] syncSavedJobDeadlineToCalendar failed:', err);
  }
}

/**
 * Called when application status changes to interview_scheduled.
 * Creates or updates the interview event on the student's calendar.
 */
export async function syncInterviewToCalendar(
  studentId: string,
  applicationId: string,
  jobTitle: string,
  companyName: string,
  scheduledAt: Date,
  existingEventId?: string
): Promise<void> {
  try {
    const cal = await getCalendarForUser(studentId);
    if (!cal) return;

    const endTime = new Date(scheduledAt.getTime() + 60 * 60 * 1000); // 1 hour duration

    const eventInput: CalendarEventInput = {
      title: `📅 Interview: ${jobTitle} at ${companyName}`,
      description:
        `You have an interview scheduled for "${jobTitle}" at ${companyName}.\n\n` +
        `Prepare well and check your application tracker for details:\n` +
        `nextern-virid.vercel.app/student/applications`,
      startDateTime: scheduledAt,
      endDateTime: endTime,
      isAllDay: false,
      colorId: COLOR.interview,
    };

    let eventId = existingEventId;

    if (existingEventId) {
      // Update existing event if interview was rescheduled
      await updateCalendarEvent(cal, existingEventId, eventInput);
    } else {
      // Create new event
      eventId = (await createCalendarEvent(cal, eventInput)) ?? undefined;
    }

    if (eventId) {
      await Application.findByIdAndUpdate(applicationId, {
        googleCalendarEventId: eventId,
      });
    }
  } catch (err) {
    console.error('[CALENDAR] syncInterviewToCalendar failed:', err);
  }
}

/**
 * Called when a student registers for an event (webinar/workshop).
 * Syncs the event date to their calendar.
 */
export async function syncEventRegistrationToCalendar(
  studentId: string,
  applicationId: string,
  eventTitle: string,
  organizerName: string,
  eventDate: Date,
  durationMinutes = 90
): Promise<void> {
  try {
    const cal = await getCalendarForUser(studentId);
    if (!cal) return;

    const endTime = new Date(eventDate.getTime() + durationMinutes * 60 * 1000);

    const eventId = await createCalendarEvent(cal, {
      title: `🎓 ${eventTitle}`,
      description:
        `You are registered for "${eventTitle}" organized by ${organizerName} on Nextern.\n\n` +
        `View event details at nextern-virid.vercel.app/student/applications`,
      startDateTime: eventDate,
      endDateTime: endTime,
      isAllDay: false,
      colorId: COLOR.event,
    });

    if (eventId) {
      await Application.findByIdAndUpdate(applicationId, {
        googleCalendarEventId: eventId,
      });
    }
  } catch (err) {
    console.error('[CALENDAR] syncEventRegistrationToCalendar failed:', err);
  }
}

/**
 * Removes a calendar event when an application is withdrawn
 * or a job deadline passes.
 */
export async function removeCalendarEvent(studentId: string, eventId: string): Promise<void> {
  try {
    const cal = await getCalendarForUser(studentId);
    if (!cal) return;
    await deleteCalendarEvent(cal, eventId);
  } catch (err) {
    console.error('[CALENDAR] removeCalendarEvent failed:', err);
  }
}
