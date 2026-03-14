import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  Panel,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { getEmployerDashboardData } from '@/lib/role-dashboard';
import {
  BriefcaseBusiness,
  Building2,
  CheckCircle2,
  Clock3,
  MapPin,
  Sparkles,
  Users,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
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
        label: 'Company profile',
        href: '/employer/dashboard#company',
        description: 'Keep your company story and hiring profile visible and credible.',
        icon: 'building' as const,
      },
    ],
  },
];

function statusTone(isActive: boolean): 'success' | 'warning' {
  return isActive ? 'success' : 'warning';
}

export default async function EmployerDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getEmployerDashboardData({
    userId: session.user.id,
    email: session.user.email ?? undefined,
  });

  return (
    <DashboardShell
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={navItems}
      user={data.chromeUser}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Employer workspace"
          title={`${data.company.companyName} hiring command center`}
          description={
            data.company.companyDescription ||
            'Monitor role performance, applicant quality, and hiring momentum from one premium workspace built around your live database activity.'
          }
          actions={
            <>
              <ActionLink href="#applications" label="Review applicants" />
              <ActionLink href="#jobs" label="Open roles" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Company profile"
              description="A quick view of the employer identity currently reflected in the system."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.company.industry ? <Tag label={data.company.industry} tone="info" /> : null}
                  {data.company.headquartersCity ? (
                    <Tag label={data.company.headquartersCity} tone="neutral" />
                  ) : null}
                  {data.company.companyWebsite ? (
                    <Tag label="Website added" tone="success" />
                  ) : (
                    <Tag label="Website missing" tone="warning" />
                  )}
                </div>
                {data.company.companyWebsite ? (
                  <a
                    href={data.company.companyWebsite}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      color: '#FFFFFF',
                      fontSize: 14,
                      fontWeight: 700,
                      textDecoration: 'underline',
                    }}
                  >
                    {data.company.companyWebsite}
                  </a>
                ) : null}
              </div>
            </Panel>
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
              accent="#22D3EE"
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(data.stats.shortlisted)}
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Interviews"
              value={formatCompactNumber(data.stats.interviews)}
              Icon={Clock3}
              accent="#F59E0B"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hired)}
              Icon={Sparkles}
              accent="#2563EB"
            />
          </div>
        </section>

        <DashboardSection
          id="pipeline"
          title="Hiring pipeline"
          description="A live funnel view built from real application statuses already stored for your company."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Pipeline stage counts"
              description="A simple distribution of the application volume moving through each hiring stage."
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {data.pipeline.map((stage) => (
                  <div
                    key={stage.label}
                    style={{
                      padding: 16,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
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
                      <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>
                        {stage.label}
                      </div>
                      <div
                        style={{
                          fontSize: 28,
                          fontWeight: 900,
                          color: '#2563EB',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {formatCompactNumber(stage.count)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div id="company">
              <Panel
                title="Company snapshot"
                description="Your hiring presence as it appears to candidates across the current data in the platform."
              >
                <div style={{ display: 'grid', gap: 14 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div
                      style={{
                        width: 46,
                        height: 46,
                        borderRadius: 16,
                        background: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <Building2 size={22} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                        {data.company.companyName}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                        {data.company.industry || 'Industry not set yet'}
                      </div>
                    </div>
                  </div>
                  {data.company.companyDescription ? (
                    <div style={{ fontSize: 14, lineHeight: 1.7, color: '#64748B' }}>
                      {data.company.companyDescription}
                    </div>
                  ) : (
                    <EmptyState
                      title="Company story missing"
                      description="Add a company description to make your employer profile stronger for students."
                    />
                  )}
                </div>
              </Panel>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          id="jobs"
          title="Recent roles"
          description="These cards use your actual job documents, including their live status, volume, and deadline information."
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
                className="dashboard-grid-two"
              >
                {data.recentJobs.map((job) => (
                  <div
                    key={job.id}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
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
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
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
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                          Applications
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 26,
                            fontWeight: 900,
                            color: '#2563EB',
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
                        color: '#64748B',
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
          description="A focused feed of the latest candidate records arriving under your employer account."
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
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
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
                          <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                            {application.studentName}
                          </div>
                          <Tag label={formatStatusLabel(application.status)} tone="info" />
                        </div>
                        <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>
                          {application.jobTitle}
                        </div>
                        <div
                          style={{
                            marginTop: 6,
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            fontSize: 13,
                            color: '#64748B',
                          }}
                        >
                          {application.university ? <span>{application.university}</span> : null}
                          {application.department ? <span>{application.department}</span> : null}
                          <span>Applied {formatShortDate(application.appliedAt)}</span>
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                          Fit score
                        </div>
                        <div
                          style={{
                            marginTop: 4,
                            fontSize: 28,
                            fontWeight: 900,
                            color: '#2563EB',
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

        <DashboardSection
          id="candidates"
          title="Top candidates"
          description="A ranked shortlist driven by the strongest fit scores already attached to your application records."
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
                className="dashboard-grid-two"
              >
                {data.topCandidates.map((candidate) => (
                  <div
                    key={candidate.id}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
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
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                          {candidate.studentName}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
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
                        color: '#64748B',
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

        <style>{`
          @media (max-width: 1100px) {
            .dashboard-stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 900px) {
            .dashboard-stats-grid,
            .dashboard-grid-two,
            .dashboard-inline-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
