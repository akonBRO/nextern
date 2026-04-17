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
import { getDeptDashboardData } from '@/lib/role-dashboard';
import { getDeptCalendarEvents } from '@/lib/academic-calendar-events';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

export const metadata: Metadata = {
  title: 'Department Calendar',
  description:
    'Track your own hosted department events, registration deadlines, and event dates on a monthly calendar.',
};

export const revalidate = 60;

export default async function DeptCalendarPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'dept_head') redirect('/login');

  const [data, events] = await Promise.all([
    getDeptDashboardData({ userId: session.user.id, email: session.user.email ?? undefined }),
    getDeptCalendarEvents(session.user.id, 48).catch(() => []),
  ]);

  await connectDB();
  const deptHead = await User.findById(session.user.id).select('googleCalendarConnected').lean();

  const deadlineCount = events.filter((event) => event.type === 'deadline').length;
  const eventCount = events.filter((event) => event.type === 'event_registration').length;

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department calendar"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Department calendar"
          title="See your posted events on a real monthly calendar"
          description="Navigate month by month and keep only your hosted event dates and registration deadlines visible from one planner."
          actions={
            <>
              <ActionLink href="/dept/dashboard#calendar" label="Back to Dashboard" />
              <ActionLink
                href="/dept/profile#calendar"
                label={
                  deptHead?.googleCalendarConnected
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
              description="A compact overview of everything currently loaded into your department calendar."
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
          description="Use the arrows to move between months and click any day to inspect your hosted department events scheduled there."
        >
          <CalendarBoard
            events={events}
            isCalendarConnected={deptHead?.googleCalendarConnected ?? false}
            mode="page"
            boardTitle="Department Calendar"
            boardSubtitle="Browse month by month and track only your hosted sessions and deadlines."
            manageCalendarHref="/dept/profile#calendar"
            eventHrefTemplate="/dept/events/:jobId/registrants"
            emptyNextEventMessage="No hosted department events are coming up yet. Post a workshop or webinar to populate this planner."
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
