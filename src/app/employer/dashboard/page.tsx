import ContextIcon from '@/components/ui/ContextIcon';
import HiringPipeline from '@/components/employer/HiringPipeline';
// src/app/employer/dashboard/page.tsx

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { getEmployerCalendarEvents } from '@/lib/employer-calendar-events';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroAsideCard,
  HeroCard,
  Panel,
  ProgressBar,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { getEmployerDashboardData } from '@/lib/role-dashboard';
import { getUsageSummary } from '@/lib/premium';
import {
  BriefcaseBusiness,
  CheckCircle2,
  Clock3,
  CreditCard,
  Crown,
  Globe,
  MapPin,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';
import Link from 'next/link';
import CalendarBoard from '@/components/calendar/CalendarBoard';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Calendar', href: '/employer/calendar', icon: 'calendar' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
  {
    label: 'Hiring',
    icon: 'briefcase' as const,
    items: [
      {
        label: 'Open roles',
        href: '/employer/dashboard#jobs',
        description: 'Review your latest jobs, activity status, and response volume.',
        icon: 'briefcase' as const,
      },
      {
        label: 'Pipeline',
        href: '/employer/dashboard#pipeline',
        description: 'Track how applications are moving across the hiring funnel.',
        icon: 'insights' as const,
      },
      {
        label: 'Applications',
        href: '/employer/dashboard#applications',
        description: 'See fresh applicant activity flowing into your team.',
        icon: 'file' as const,
      },
    ],
  },
  {
    label: 'Talent',
    icon: 'users' as const,
    items: [
      {
        label: 'Top candidates',
        href: '/employer/dashboard#candidates',
        description: 'Surface the strongest student matches already in your pipeline.',
        icon: 'sparkles' as const,
      },
      {
        label: 'Recommendation requests',
        href: '/employer/recommendations',
        description: 'Review advisor and department-head endorsements for your active roles.',
        icon: 'target' as const,
      },
    ],
  },
];

function statusTone(isActive: boolean): 'success' | 'warning' {
  return isActive ? 'success' : 'warning';
}

function usageLabel(value: number | null) {
  return value === null ? 'Unlimited' : `${value} left`;
}

function usagePercent(count: number, limit: number | null) {
  if (limit === null) return 100;
  if (limit === 0) return 0;
  return Math.min(100, Math.round((count / limit) * 100));
}

export default async function EmployerDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [data, usage, calendarEvents] = await Promise.all([
    getEmployerDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
    getUsageSummary(session.user.id),
    getEmployerCalendarEvents(session.user.id, 24).catch(() => []),
  ]);

  const profileItems = [
    !!data.company.industry,
    !!data.company.headquartersCity,
    !!data.company.companyWebsite,
    !!data.company.companyDescription,
  ];
  const profileScore = Math.round(
    (profileItems.filter(Boolean).length / profileItems.length) * 100
  );
  const completedProfileItems = profileItems.filter(Boolean).length;
  const recentRoleCount = data.recentJobs.length;
  const rolesWithApplicants = data.recentJobs.filter((job) => job.applicationCount > 0).length;
  const avgApplicantsPerActiveRole =
    data.stats.activeJobs > 0
      ? Math.round((data.stats.totalApplications / data.stats.activeJobs) * 10) / 10
      : 0;
  const nextDeadline = data.recentJobs
    .map((job) => job.applicationDeadline)
    .filter((deadline): deadline is string => Boolean(deadline))
    .sort((left, right) => new Date(left).getTime() - new Date(right).getTime())[0];
  const now = new Date();
  const upcomingDeadlines = data.recentJobs.filter(
    (job) => job.applicationDeadline && new Date(job.applicationDeadline) >= now
  ).length;

  return (
    <DashboardShell
      embedded
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={navItems}
      user={{ ...data.chromeUser, isPremium: usage.isPremium, userId: session.user.id }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Employer workspace"
          title={data.company.companyName}
          description={
            data.company.companyDescription ||
            'No company description added yet — go to Company Profile to write one.'
          }
          subtitle={
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {data.company.headquartersCity && (
                <span style={{ fontSize: 13, color: '#60717d', fontWeight: 500 }}>
                  <ContextIcon name="location" /> {data.company.headquartersCity}
                </span>
              )}
              {data.company.headquartersCity && data.company.industry && (
                <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: 13 }}>·</span>
              )}
              {data.company.industry && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#dfe6e9',
                    fontWeight: 600,
                  }}
                >
                  {data.company.industry}
                </span>
              )}
              {data.company.companyWebsite && (
                <Link
                  href={data.company.companyWebsite}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#edf7f3',
                    border: '1px solid #bdddd5',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#087f72',
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <Globe size={13} /> Website
                </Link>
              )}
            </div>
          }
          actions={
            <>
              <ActionLink href="/employer/jobs/new" label="Post new job" />
              <ActionLink href="/employer/jobs" label="View listings" tone="ghost" />
              <ActionLink href="/employer/ai" label="AI hiring" tone="ghost" />
            </>
          }
          aside={
            <HeroAsideCard
              contentStyle={{
                display: 'flex',
                flexDirection: 'column',
                gap: 16,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <h3
                  style={{
                    fontSize: 18,
                    fontWeight: 700,
                    color: '#f6f8f9',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: -0.3,
                  }}
                >
                  Company Snapshot
                </h3>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    gap: 4,
                    flexShrink: 0,
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <span style={{ fontSize: 11, color: '#60717d', fontWeight: 600 }}>Profile</span>
                    <span
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        color: profileScore === 100 ? '#168257' : '#a86714',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {profileScore}%
                    </span>
                  </div>
                  <div
                    style={{
                      width: 105,
                      height: 5,
                      background: 'rgba(255,255,255,0.1)',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${profileScore}%`,
                        height: '100%',
                        borderRadius: 999,
                        background:
                          profileScore === 100
                            ? 'linear-gradient(90deg, #168257, #34D399)'
                            : 'linear-gradient(90deg, #087f72, #178d80)',
                      }}
                    />
                  </div>
                </div>
              </div>

              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)' }} />

              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
                className="v2-page-grid"
              >
                {[
                  {
                    label: 'Profile fields',
                    value: `${completedProfileItems}/4`,
                    desc: 'core details complete',
                    color: '#178d80',
                  },
                  {
                    label: 'Avg per active role',
                    value: avgApplicantsPerActiveRole.toLocaleString(),
                    desc: 'applicant density',
                    color: '#a86714',
                  },
                  {
                    label: 'Roles with traction',
                    value: recentRoleCount ? `${rolesWithApplicants}/${recentRoleCount}` : '0',
                    desc: 'recent roles drawing interest',
                    color: '#168257',
                  },
                  {
                    label: 'Upcoming deadlines',
                    value: upcomingDeadlines.toLocaleString(),
                    desc: nextDeadline
                      ? `next due ${formatShortDate(nextDeadline)}`
                      : 'no deadlines set',
                    color: '#A78BFA',
                  },
                ].map((metric) => (
                  <div
                    key={metric.label}
                    style={{
                      minHeight: 86,
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: 'rgba(255,255,255,0.08)',
                      border: '1px solid rgba(255,255,255,0.12)',
                    }}
                  >
                    <div
                      style={{
                        color: metric.color,
                        fontSize: 20,
                        fontWeight: 700,
                        lineHeight: 1.05,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {metric.value}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        color: '#dfe6e9',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      {metric.label}
                    </div>
                    <div style={{ marginTop: 3, color: '#60717d', fontSize: 10, fontWeight: 600 }}>
                      {metric.desc}
                    </div>
                  </div>
                ))}
              </div>
            </HeroAsideCard>
          }
        />
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Active jobs"
              value={formatCompactNumber(data.stats.activeJobs)}
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Applications"
              value={formatCompactNumber(data.stats.totalApplications)}
              Icon={Users}
              accent="#178d80"
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(data.stats.shortlisted)}
              Icon={CheckCircle2}
              accent="#168257"
            />
            <StatCard
              label="Interviews"
              value={formatCompactNumber(data.stats.interviews)}
              Icon={Clock3}
              accent="#a86714"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hired)}
              Icon={Sparkles}
              accent="#087f72"
            />
          </div>
        </section>
        <div className="dashboard-composition">
          <DashboardSection
            id="jobs"
            title="Recent roles"
            description="Your latest job postings with live status, application volume, and deadline."
          >
            <Panel
              title="Role activity"
              description="A high-signal list of your latest jobs and how much candidate attention they are receiving."
            >
              {data.recentJobs.length > 0 ? (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                    gap: 14,
                  }}
                  className="dashboard-grid-two v2-form-grid"
                >
                  {data.recentJobs.map((job) => (
                    <div
                      key={job.id}
                      style={{
                        padding: 18,
                        borderRadius: 12,
                        border: '1px solid #dfe6e9',
                        background: '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: '#243e4a' }}>
                            {job.title}
                          </div>
                          <div style={{ marginTop: 6, display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Tag label={formatStatusLabel(job.type)} tone="neutral" />
                            <Tag label={formatStatusLabel(job.locationType)} tone="neutral" />
                            <Tag
                              label={job.isActive ? 'Active' : 'Closed'}
                              tone={statusTone(job.isActive)}
                            />
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#60717d' }}>
                            Applications
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 26,
                              fontWeight: 700,
                              color: '#087f72',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {formatCompactNumber(job.applicationCount)}
                          </div>
                        </div>
                      </div>
                      <div
                        style={{
                          marginTop: 14,
                          display: 'grid',
                          gap: 8,
                          color: '#60717d',
                          fontSize: 13,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <MapPin size={15} strokeWidth={2} />
                          {job.city || 'Location shared inside role details'}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <Clock3 size={15} strokeWidth={2} />
                          Deadline {formatShortDate(job.applicationDeadline)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No jobs posted yet"
                  description="Your role list will populate here as soon as your company creates its first opportunity."
                />
              )}
            </Panel>
          </DashboardSection>
          <DashboardSection
            id="applications"
            title="Recent applicant flow"
            description="The latest candidate records arriving under your employer account."
          >
            <Panel
              title="Incoming applications"
              description="Recent submissions with student context, fit scores, and the role they applied for."
            >
              {data.recentApplications.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.recentApplications.map((application) => (
                    <div
                      key={application.id}
                      style={{
                        padding: 18,
                        borderRadius: 12,
                        border: '1px solid #dfe6e9',
                        background: '#FFFFFF',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1.3fr) auto',
                          gap: 12,
                          alignItems: 'center',
                        }}
                        className="dashboard-inline-grid"
                      >
                        <div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                            }}
                          >
                            <div style={{ fontSize: 16, fontWeight: 700, color: '#243e4a' }}>
                              {application.studentName}
                            </div>
                            <Tag label={formatStatusLabel(application.status)} tone="info" />
                          </div>
                          <div style={{ marginTop: 6, fontSize: 13, color: '#60717d' }}>
                            {application.jobTitle}
                          </div>
                          <div
                            style={{
                              marginTop: 6,
                              display: 'flex',
                              gap: 12,
                              flexWrap: 'wrap',
                              fontSize: 13,
                              color: '#60717d',
                            }}
                          >
                            {application.university ? <span>{application.university}</span> : null}
                            {application.department ? <span>{application.department}</span> : null}
                            <span>Applied {formatShortDate(application.appliedAt)}</span>
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#60717d' }}>
                            Fit score
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 28,
                              fontWeight: 700,
                              color: '#087f72',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {typeof application.fitScore === 'number'
                              ? `${application.fitScore}%`
                              : 'Pending'}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No recent applicants"
                  description="New applications will appear here automatically as students apply to your roles."
                />
              )}
            </Panel>
          </DashboardSection>
        </div>
        <DashboardSection
          id="pipeline"
          title="Hiring pipeline"
          description="A live funnel view built from real application statuses already stored for your company."
        >
          <HiringPipeline pipeline={data.pipeline} stats={data.stats} />
        </DashboardSection>
        <DashboardSection
          id="candidates"
          title="Top candidates"
          description="A ranked shortlist driven by the strongest fit scores in your pipeline."
        >
          <Panel
            title="Best current matches"
            description="Students with the strongest available match signals in your active employer pipeline."
          >
            {data.topCandidates.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
                className="dashboard-grid-two v2-form-grid"
              >
                {data.topCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    style={{
                      padding: 18,
                      borderRadius: 12,
                      border: '1px solid #dfe6e9',
                      background: '#FFFFFF',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 700, color: '#243e4a' }}>
                          {candidate.studentName}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#60717d' }}>
                          {candidate.jobTitle}
                        </div>
                      </div>
                      <Tag label={`${candidate.fitScore ?? 0}% fit`} tone="success" />
                    </div>
                    <div
                      style={{
                        marginTop: 12,
                        display: 'flex',
                        gap: 12,
                        flexWrap: 'wrap',
                        fontSize: 13,
                        color: '#60717d',
                      }}
                    >
                      {candidate.university ? <span>{candidate.university}</span> : null}
                      {candidate.department ? <span>{candidate.department}</span> : null}
                      <span>{formatStatusLabel(candidate.status)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No scored candidates yet"
                description="Once fit scores are generated for incoming applications, stronger matches will appear here."
              />
            )}
          </Panel>
        </DashboardSection>
        <div className="dashboard-composition">
          <DashboardSection
            id="calendar"
            title="Calendar"
            description="Track interview schedules, job deadlines, and employer-hosted event dates with the same interactive monthly planner used in the student experience."
          >
            <CalendarBoard
              events={calendarEvents}
              isCalendarConnected={false}
              mode="dashboard"
              boardTitle="Hiring Calendar"
              boardSubtitle="Browse month by month, track interviews, deadlines, and employer-hosted events."
              fullCalendarHref="/employer/calendar"
              manageCalendarHref={null}
              showConnectionStatus={false}
              eventHrefTemplate="/employer/jobs/:jobId/applicants"
              emptyNextEventMessage="No upcoming hiring events yet. Post roles, publish events, or schedule interviews to fill this planner."
            />
          </DashboardSection>
          <DashboardSection
            id="ai-hiring"
            title="AI hiring & premium access"
            description="Employer AI is visible from your dashboard. Premium employers get unlimited shortlists and postings; regular employers keep monthly free limits."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
              className="dashboard-grid-three v2-form-grid"
            >
              <Panel
                title="AI applicant shortlist"
                description="Rank applicants from each job pipeline using fit scores, gaps, and student profile signals."
                action={
                  <Link
                    href="/employer/ai"
                    style={{
                      color: '#087f72',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Open AI center
                  </Link>
                }
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 14 }}>
                  <Target size={22} color="#087f72" />
                  <div>
                    <div
                      style={{
                        fontSize: 30,
                        lineHeight: 1,
                        color: '#243e4a',
                        fontWeight: 700,
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {usageLabel(usage.remaining.aiApplicantShortlist)}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, color: '#60717d', fontWeight: 700 }}>
                      {usage.limits.aiApplicantShortlist === null
                        ? `${usage.counts.aiApplicantShortlist} generated this month`
                        : `${usage.counts.aiApplicantShortlist}/${usage.limits.aiApplicantShortlist} used this month`}
                    </div>
                  </div>
                </div>
                <ProgressBar
                  value={usagePercent(
                    usage.counts.aiApplicantShortlist,
                    usage.limits.aiApplicantShortlist
                  )}
                />
              </Panel>

              <Panel
                title="Premium status"
                description={
                  usage.isPremium
                    ? 'Employer AI tools are unlocked without monthly caps.'
                    : 'Upgrade when you need unlimited AI shortlists, postings, and priority visibility.'
                }
                action={
                  <Link
                    href={usage.isPremium ? '/employer/subscription' : '/employer/premium'}
                    style={{
                      color: '#087f72',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    {usage.isPremium ? 'Billing' : 'Upgrade'}
                  </Link>
                }
              >
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <Crown size={22} color={usage.isPremium ? '#a86714' : '#60717d'} />
                    <div>
                      <div style={{ fontSize: 20, fontWeight: 700, color: '#243e4a' }}>
                        {usageLabel(usage.remaining.jobPosting)}
                      </div>
                      <div style={{ fontSize: 12, color: '#60717d', fontWeight: 700 }}>
                        Job postings this month
                      </div>
                    </div>
                  </div>
                  <ProgressBar
                    value={usagePercent(usage.counts.jobPosting, usage.limits.jobPosting)}
                    tone="success"
                  />
                </div>
              </Panel>

              <Panel
                title="Payment options"
                description="Employer Premium checkout is available through local mobile payment and cards."
                action={
                  <Link
                    href="/employer/subscription"
                    style={{
                      color: '#087f72',
                      textDecoration: 'none',
                      fontSize: 13,
                      fontWeight: 700,
                    }}
                  >
                    Billing
                  </Link>
                }
              >
                <div style={{ display: 'grid', gap: 10 }}>
                  {['bKash', 'Visa', 'Mastercard'].map((method) => (
                    <div
                      key={method}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '10px 12px',
                        borderRadius: 12,
                        background: '#f6f8f9',
                        border: '1px solid #dfe6e9',
                        fontSize: 13,
                        fontWeight: 700,
                        color: '#243e4a',
                      }}
                    >
                      <CreditCard size={15} color="#087f72" />
                      {method}
                    </div>
                  ))}
                </div>
              </Panel>
            </div>
          </DashboardSection>
        </div>
        <style>{`
          #jobs, #applications { display: flex; flex-direction: column; }
          #jobs > .dashboard-panel, #applications > .dashboard-panel { flex: 1; height: auto; }
          @media (max-width: 1100px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            #ai-hiring .dashboard-grid-three { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 900px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, minmax(0, 1fr)) !important; }
            .dashboard-grid-two, .dashboard-grid-three, .dashboard-inline-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
