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
import { BriefcaseBusiness, CalendarClock, CalendarDays, CheckCircle2 } from 'lucide-react';

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
  const deadlineCount = calendarEvents.filter((event) => event.type === 'deadline').length;
  const interviewCount = calendarEvents.filter((event) => event.type === 'interview').length;
  const registeredEventCount = calendarEvents.filter(
    (event) => event.type === 'event_registration'
  ).length;
  const syncedCount = calendarEvents.filter((event) => event.isSynced).length;
  const urgentCount = calendarEvents.filter((event) => event.daysLeft <= 3).length;
  const nextEvent = calendarEvents[0];

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
          title="Career calendar with deadlines, interviews, and event milestones"
          description="Track saved job deadlines, interview schedules, and registered event dates in one professional timeline. Use this page to spot urgent actions, confirm Google sync coverage, and review what is coming next."
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
                <Tag
                  label={`${urgentCount} urgent in 3 days`}
                  tone={urgentCount > 0 ? 'warning' : 'neutral'}
                />
                <Tag label={`${data.stats.totalApplications} applications`} tone="neutral" />
              </div>
            </Panel>
          }
        />

        <section
          style={{
            marginTop: 22,
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
          }}
        >
          {[
            {
              label: 'Upcoming deadlines',
              value: deadlineCount,
              detail: 'Saved jobs and active applications',
              Icon: CalendarDays,
              accent: '#F59E0B',
              bg: '#FFFBEB',
              border: '#FDE68A',
            },
            {
              label: 'Interviews scheduled',
              value: interviewCount,
              detail: 'Confirmed interview calendar items',
              Icon: CalendarClock,
              accent: '#6366F1',
              bg: '#EEF2FF',
              border: '#C7D2FE',
            },
            {
              label: 'Events registered',
              value: registeredEventCount,
              detail: 'Workshops and webinars on your timeline',
              Icon: BriefcaseBusiness,
              accent: '#0891B2',
              bg: '#ECFEFF',
              border: '#A5F3FC',
            },
            {
              label: 'Google sync coverage',
              value: `${syncedCount}/${calendarEvents.length || 0}`,
              detail: isCalendarConnected
                ? 'Items already mirrored to Google Calendar'
                : 'Connect Google to sync everything automatically',
              Icon: CheckCircle2,
              accent: isCalendarConnected ? '#059669' : '#64748B',
              bg: isCalendarConnected ? '#ECFDF5' : '#F8FAFC',
              border: isCalendarConnected ? '#A7F3D0' : '#E2E8F0',
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: '#FFFFFF',
                border: `1px solid ${item.border}`,
                borderRadius: 18,
                padding: '18px 20px',
                boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: item.bg,
                  border: `1px solid ${item.border}`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: item.accent,
                  marginBottom: 14,
                }}
              >
                <item.Icon size={18} />
              </div>
              <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>{item.label}</div>
              <div
                style={{
                  fontSize: 28,
                  lineHeight: 1.1,
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                  marginTop: 8,
                }}
              >
                {item.value}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: '#64748B', lineHeight: 1.55 }}>
                {item.detail}
              </div>
            </div>
          ))}
        </section>

        <DashboardSection
          id="calendar"
          title="Monthly calendar"
          description="Navigate month by month, inspect every milestone in detail, and review sync status, readiness urgency, and opportunity context for each job or event."
        >
          <CalendarBoard
            events={calendarEvents}
            isCalendarConnected={isCalendarConnected}
            mode="page"
          />
        </DashboardSection>

        <section
          style={{
            marginTop: 20,
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.15fr) minmax(280px, 0.85fr)',
            gap: 16,
          }}
        >
          <Panel
            title="How to use this calendar"
            description="A quick guide for turning the calendar into an action plan instead of just a date list."
          >
            <div style={{ display: 'grid', gap: 12 }}>
              {[
                'Saved-job deadlines appear even before you apply, so you can act early.',
                'Interview items stay separate from deadlines so you can prepare and follow up on time.',
                'Registered webinars and workshops show up with their own event timeline for easier planning.',
                'Google sync coverage helps you spot items that still need connection or re-sync support.',
              ].map((tip) => (
                <div
                  key={tip}
                  style={{
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    padding: '12px 14px',
                    fontSize: 13,
                    color: '#334155',
                    lineHeight: 1.65,
                  }}
                >
                  {tip}
                </div>
              ))}
            </div>
          </Panel>

          <Panel
            title="Next milestone"
            description="The nearest item that deserves your attention right now."
          >
            {nextEvent ? (
              <div
                style={{
                  borderRadius: 16,
                  border: '1px solid #DBEAFE',
                  background:
                    'linear-gradient(145deg, rgba(239,246,255,0.98), rgba(248,250,252,0.98))',
                  padding: 18,
                }}
              >
                <div
                  style={{ fontSize: 11, fontWeight: 800, color: '#2563EB', letterSpacing: 0.6 }}
                >
                  {nextEvent.type === 'deadline'
                    ? 'DEADLINE'
                    : nextEvent.type === 'interview'
                      ? 'INTERVIEW'
                      : 'EVENT'}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {nextEvent.title}
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#475569' }}>
                  {nextEvent.companyName}
                </div>
                <div
                  style={{
                    marginTop: 14,
                    display: 'flex',
                    gap: 8,
                    flexWrap: 'wrap',
                  }}
                >
                  <Tag
                    label={nextEvent.daysLeft <= 0 ? 'Today' : `${nextEvent.daysLeft} days left`}
                    tone={nextEvent.daysLeft <= 3 ? 'warning' : 'info'}
                  />
                  <Tag
                    label={nextEvent.isSynced ? 'Google synced' : 'Sync pending'}
                    tone={nextEvent.isSynced ? 'success' : 'neutral'}
                  />
                </div>
              </div>
            ) : (
              <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                No upcoming milestones are loaded yet. Save jobs, apply to opportunities, or
                register for events to build your planning timeline.
              </div>
            )}
          </Panel>
        </section>
      </DashboardPage>
    </DashboardShell>
  );
}
