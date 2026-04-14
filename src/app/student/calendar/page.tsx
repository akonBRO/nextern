import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getStudentDashboardData } from '@/lib/student-dashboard';
import { getUpcomingCalendarEvents } from '@/lib/calendar-events';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
  Tag,
} from '@/components/dashboard/DashboardContent';
import CalendarBoard from '@/components/calendar/CalendarBoard';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';

export const metadata: Metadata = {
  title: 'Calendar',
  description:
    'Track application deadlines, interviews, and event registrations on a monthly calendar.',
};

export const revalidate = 60;

export default async function StudentCalendarPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'student') redirect('/login');
  if (!session.user.isVerified) redirect(`/verify-email?email=${session.user.email}`);

  let data;
  try {
    data = await getStudentDashboardData(session.user.id);
  } catch (error) {
    console.error('[CALENDAR PAGE DATA ERROR]', error);
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

  let calendarEvents: Awaited<ReturnType<typeof getUpcomingCalendarEvents>> = [];
  let isCalendarConnected = false;

  try {
    await connectDB();
    const [events, calUser] = await Promise.all([
      getUpcomingCalendarEvents(session.user.id, 48),
      User.findById(session.user.id).select('googleCalendarConnected').lean(),
    ]);
    calendarEvents = events;
    isCalendarConnected = calUser?.googleCalendarConnected ?? false;
  } catch (error) {
    console.error('[CALENDAR PAGE ERROR]', error);
  }

  const profileSubtitle = [data.profile.university, data.profile.department]
    .filter(Boolean)
    .join(' | ');

  return (
    <DashboardShell
      role="student"
      roleLabel="Student calendar"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: data.profile.name,
        email: data.profile.email,
        image: data.profile.image,
        subtitle: profileSubtitle || 'Student workspace',
        userId: session.user.id,
        unreadNotifications: data.profile.unreadNotifications,
        unreadMessages: data.profile.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Calendar planner"
          title="See your deadlines on a real monthly calendar"
          description="Navigate month by month, spot key dates quickly, and keep interviews, application deadlines, and event registrations visible at a glance."
          actions={
            <>
              <ActionLink href="/student/dashboard#calendar" label="Back to Dashboard" />
              <ActionLink
                href="/student/profile#calendar"
                label={isCalendarConnected ? 'Manage Calendar Sync' : 'Connect Google Calendar'}
                tone="ghost"
              />
            </>
          }
          aside={
            <Panel
              title="Planner snapshot"
              description="A compact summary of what is already loaded into your student calendar."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag label={`${calendarEvents.length} events loaded`} tone="info" />
                <Tag
                  label={isCalendarConnected ? 'Google synced' : 'Needs Google connection'}
                  tone={isCalendarConnected ? 'success' : 'warning'}
                />
                <Tag label={`${data.stats.totalApplications} applications`} tone="neutral" />
              </div>
            </Panel>
          }
        />

        <DashboardSection
          id="calendar"
          title="Monthly calendar"
          description="Use the arrows to move between months and click any day to inspect the events scheduled there."
        >
          <CalendarBoard
            events={calendarEvents}
            isCalendarConnected={isCalendarConnected}
            mode="page"
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
