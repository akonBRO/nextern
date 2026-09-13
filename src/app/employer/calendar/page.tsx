import type { Metadata } from 'next';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
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
import { getEmployerDashboardData } from '@/lib/role-dashboard';
import { getEmployerCalendarEvents } from '@/lib/employer-calendar-events';
import { getUsageSummary } from '@/lib/premium';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';

export const metadata: Metadata = {
  title: 'Employer Calendar',
  description:
    'Track interview schedules, application deadlines, and employer-hosted events on a monthly calendar.',
};

export const revalidate = 60;

export default async function EmployerCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/login');

  const [data, usage, calendarEvents] = await Promise.all([
    getEmployerDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
    getUsageSummary(session.user.id),
    getEmployerCalendarEvents(session.user.id, 48).catch(() => []),
  ]);

  const interviewCount = calendarEvents.filter((event) => event.type === 'interview').length;
  const deadlineCount = calendarEvents.filter((event) => event.type === 'deadline').length;
  const eventCount = calendarEvents.filter((event) => event.type === 'event_registration').length;

  return (
    <DashboardShell
      embedded
      role="employer"
      roleLabel="Employer calendar"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={{ ...data.chromeUser, isPremium: usage.isPremium, userId: session.user.id }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Calendar"
          title="Hiring calendar"
          description="Your interviews, application deadlines, and campus events in one place."
          actions={
            <>
              <ActionLink href="/employer/jobs" label="View Jobs & Applicants" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Coming up"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Tag label={`${calendarEvents.length} events loaded`} tone="info" />
                <Tag label={`${interviewCount} interviews`} tone="warning" />
                <Tag label={`${deadlineCount} job deadlines`} tone="neutral" />
                <Tag label={`${eventCount} events`} tone="success" />
              </div>
            </Panel>
          }
        />

        <DashboardSection
          id="calendar"
          title="Monthly calendar"
          description="Select a day to see its schedule."
        >
          <CalendarBoard
            events={calendarEvents}
            isCalendarConnected={false}
            mode="page"
            boardTitle="Calendar"
            boardSubtitle="Browse month by month, track interviews, deadlines, and employer-hosted events."
            fullCalendarHref={null}
            manageCalendarHref={null}
            showConnectionStatus={false}
            eventHrefTemplate="/employer/jobs/:jobId/applicants"
            emptyNextEventMessage="No upcoming hiring events yet. Post roles, publish events, or schedule interviews to fill this planner."
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
