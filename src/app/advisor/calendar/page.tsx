import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
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
import { getAdvisorDashboardData } from '@/lib/role-dashboard';
import { getAdvisorCalendarEvents } from '@/lib/academic-calendar-events';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';

export const metadata: Metadata = {
  title: 'Advisor Calendar',
  description:
    'Track your own hosted academic events, registration deadlines, and event dates on a monthly calendar.',
};

export const revalidate = 60;

export default async function AdvisorCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'advisor') redirect('/login');

  const [data, events] = await Promise.all([
    getAdvisorDashboardData({ userId: session.user.id, email: session.user.email ?? undefined }),
    getAdvisorCalendarEvents(session.user.id, 48).catch(() => []),
  ]);

  await connectDB();
  const advisor = await User.findById(session.user.id).select('googleCalendarConnected').lean();

  const deadlineCount = events.filter((event) => event.type === 'deadline').length;
  const eventCount = events.filter((event) => event.type === 'event_registration').length;

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor calendar"
      homeHref="/advisor/dashboard"
      navItems={ADVISOR_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Calendar"
          title="See your posted events on a real monthly calendar"
          description="Navigate month by month and keep only your hosted event dates and registration deadlines visible from one planner."
          actions={
            <>
              <ActionLink href="/advisor/dashboard#calendar" label="Back to Dashboard" />
              <ActionLink
                href="/advisor/profile#calendar"
                label={
                  advisor?.googleCalendarConnected
                    ? 'Manage Calendar Sync'
                    : 'Connect Google Calendar'
                }
                tone="ghost"
              />
            </>
          }
          aside={
            <Panel
              title="Planner snapshot"
              description="A compact overview of everything currently loaded into your advising calendar."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag label={`${events.length} events loaded`} tone="info" />
                <Tag label={`${eventCount} hosted events`} tone="success" />
                <Tag label={`${deadlineCount} deadline alerts`} tone="warning" />
              </div>
            </Panel>
          }
        />

        <DashboardSection
          id="calendar"
          title="Monthly calendar"
          description="Use the arrows to move between months and click any day to inspect your hosted academic events scheduled there."
        >
          <CalendarBoard
            events={events}
            isCalendarConnected={advisor?.googleCalendarConnected ?? false}
            mode="page"
            boardTitle="Calendar"
            boardSubtitle="Browse month by month and track only your hosted sessions and deadlines."
            manageCalendarHref="/advisor/profile#calendar"
            eventHrefTemplate="/advisor/events/:jobId/registrants"
            emptyNextEventMessage="No hosted advisor events are coming up yet. Post a workshop or webinar to populate this planner."
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
