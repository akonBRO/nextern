// src/app/student/dashboard/page.tsx

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getStudentAcademicFeedback } from '@/lib/academic-feedback';
import { getStudentDashboardData } from '@/lib/student-dashboard';
import { getUpcomingCalendarEvents } from '@/lib/calendar-events';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import DashboardClient from './DashboardClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Dashboard',
  description: 'Your Nextern student career dashboard',
};

export const revalidate = 60;

export default async function StudentDashboardPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'student') redirect('/login');
  if (!session.user.isVerified) redirect(`/verify-email?email=${session.user.email}`);

  let data;
  try {
    data = await getStudentDashboardData(session.user.id);
  } catch (error) {
    console.error('[DASHBOARD DATA ERROR]', error);
    data = {
      profile: {
        name: session.user.name ?? 'Student',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        opportunityScore: 0,
        profileCompleteness: 0,
        skills: [],
        isGraduated: false,
        unreadNotifications: 0,
        unreadMessages: 0,
      },
      stats: {
        totalApplications: 0,
        shortlisted: 0,
        hired: 0,
        avgFitScore: 0,
        profileCompleteness: 0,
        opportunityScore: 0,
        leaderboardRank: null,
        totalBadges: 0,
      },
      recentApplications: [],
      recommendedJobs: [],
      recentBadges: [],
      scoreHistory: [],
      deadlines: [],
      skillGapSummary: {
        totalHardGaps: 0,
        totalSoftGaps: 0,
        topHardGaps: [],
        topSoftGaps: [],
        closedGapsCount: 0,
      },
    };
  }

  // ── Fetch calendar data server-side ──────────────────────────────────────
  let calendarEvents: Awaited<ReturnType<typeof getUpcomingCalendarEvents>> = [];
  let isCalendarConnected = false;
  let academicReviews: Awaited<ReturnType<typeof getStudentAcademicFeedback>>['reviews'] = [];

  try {
    await connectDB();
    const [events, calUser, feedback] = await Promise.all([
      getUpcomingCalendarEvents(session.user.id, 24),
      User.findById(session.user.id).select('googleCalendarConnected').lean(),
      getStudentAcademicFeedback(session.user.id),
    ]);
    calendarEvents = events;
    isCalendarConnected = calUser?.googleCalendarConnected ?? false;
    academicReviews = feedback.reviews;
  } catch (err) {
    console.error('[CALENDAR WIDGET ERROR]', err);
    // non-blocking — dashboard still renders without calendar
  }

  return (
    <DashboardClient
      data={data}
      userId={session.user.id}
      calendarEvents={calendarEvents}
      isCalendarConnected={isCalendarConnected}
      initialAcademicReviews={academicReviews}
    />
  );
}
