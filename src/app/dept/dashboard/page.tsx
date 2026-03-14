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
  ProgressBar,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
} from '@/components/dashboard/DashboardContent';
import { getDeptDashboardData } from '@/lib/role-dashboard';
import {
  BriefcaseBusiness,
  GraduationCap,
  LineChart,
  Medal,
  Sparkles,
  Target,
  Users,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/dept/dashboard', icon: 'dashboard' as const },
  {
    label: 'Cohort',
    icon: 'graduation' as const,
    items: [
      {
        label: 'Top students',
        href: '/dept/dashboard#students',
        description: 'Track the strongest students by opportunity score and profile readiness.',
        icon: 'graduation' as const,
      },
      {
        label: 'Pipeline',
        href: '/dept/dashboard#pipeline',
        description: 'See the aggregate hiring journey for your department cohort.',
        icon: 'insights' as const,
      },
    ],
  },
  {
    label: 'Opportunities',
    icon: 'briefcase' as const,
    items: [
      {
        label: 'Openings',
        href: '/dept/dashboard#openings',
        description: 'Active roles relevant to your university and advisory department.',
        icon: 'briefcase' as const,
      },
      {
        label: 'Benchmarks',
        href: '/dept/dashboard#benchmarks',
        description: 'Department-level thresholds and readiness guardrails for the cohort.',
        icon: 'target' as const,
      },
    ],
  },
];

export default async function DeptDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getDeptDashboardData({
    userId: session.user.id,
    email: session.user.email ?? undefined,
  });
  const benchmark = data.department.benchmark;

  return (
    <DashboardShell
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={navItems}
      user={data.chromeUser}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Department workspace"
          title="Shape outcomes across the whole cohort."
          description="This dashboard gives department leadership a clear view of student readiness, role access, and benchmark health using only live database metrics."
          actions={
            <>
              <ActionLink href="#students" label="View top students" />
              <ActionLink href="#openings" label="Relevant openings" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Department scope"
              description="The institution and cohort rules that currently define this workspace."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.department.institutionName ? (
                    <Tag label={data.department.institutionName} tone="info" />
                  ) : null}
                  {data.department.advisoryDepartment ? (
                    <Tag label={data.department.advisoryDepartment} tone="neutral" />
                  ) : null}
                  {benchmark ? (
                    <Tag label={benchmark.cohort} tone="success" />
                  ) : (
                    <Tag label="Benchmark not set" tone="warning" />
                  )}
                </div>
              </div>
            </Panel>
          }
        />

        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Students"
              value={formatCompactNumber(data.stats.totalStudents)}
              Icon={Users}
            />
            <StatCard
              label="Openings"
              value={formatCompactNumber(data.stats.activeOpenings)}
              Icon={BriefcaseBusiness}
              accent="#22D3EE"
            />
            <StatCard
              label="Applications"
              value={formatCompactNumber(data.stats.totalApplications)}
              Icon={LineChart}
              accent="#2563EB"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hiredStudents)}
              Icon={Sparkles}
              accent="#10B981"
            />
            <StatCard
              label="Avg score"
              value={`${data.stats.avgOpportunityScore}%`}
              Icon={Target}
              accent="#F59E0B"
            />
            <StatCard
              label="Avg CGPA"
              value={data.stats.avgCGPA ? data.stats.avgCGPA.toFixed(2) : '0.00'}
              Icon={GraduationCap}
              accent="#10B981"
            />
          </div>
        </section>

        <DashboardSection
          id="benchmarks"
          title="Benchmark posture"
          description="These cards show the current departmental thresholds used to assess whether the cohort is on track."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <div id="pipeline">
              <Panel
                title="Hiring pipeline"
                description="Aggregate movement across your department cohort's application journey."
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
            </div>

            <Panel
              title="Benchmark thresholds"
              description="The active cohort baseline for readiness, fit, and academic strength."
            >
              {benchmark ? (
                <div style={{ display: 'grid', gap: 16 }}>
                  <ProgressBar
                    value={benchmark.minReadinessScore}
                    label="Minimum readiness score"
                  />
                  <ProgressBar
                    value={benchmark.minFitScore}
                    label="Minimum fit score"
                    tone="warning"
                  />
                  <div>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 12,
                        marginBottom: 8,
                      }}
                    >
                      <span style={{ fontSize: 13, color: '#1E293B', fontWeight: 700 }}>
                        Minimum CGPA
                      </span>
                      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                        {benchmark.minCGPA.toFixed(2)}
                      </span>
                    </div>
                    <div
                      style={{
                        height: 10,
                        borderRadius: 999,
                        background: '#E2E8F0',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min((benchmark.minCGPA / 4) * 100, 100)}%`,
                          height: '100%',
                          borderRadius: 999,
                          background: 'linear-gradient(90deg, #10B981, #22D3EE)',
                        }}
                      />
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No active benchmark"
                  description="Set a department benchmark to compare cohort health against your desired threshold."
                />
              )}
            </Panel>
          </div>
        </DashboardSection>

        <DashboardSection
          id="students"
          title="Top students"
          description="This ranking uses real student readiness and academic data from the department cohort under your scope."
        >
          <Panel
            title="Leaders in the cohort"
            description="Top-performing students by opportunity score, profile completion, and academic consistency."
          >
            {data.topStudents.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
                className="dashboard-grid-two"
              >
                {data.topStudents.map((student) => (
                  <div
                    key={student.id}
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
                          {student.name}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                          {typeof student.cgpa === 'number'
                            ? `CGPA ${student.cgpa.toFixed(2)}`
                            : 'CGPA pending'}
                        </div>
                      </div>
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          background: '#EFF6FF',
                          color: '#2563EB',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Medal size={20} strokeWidth={2} />
                      </div>
                    </div>
                    <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                      <ProgressBar value={student.opportunityScore} label="Opportunity score" />
                      <ProgressBar
                        value={student.profileCompleteness}
                        label="Profile completeness"
                        tone="success"
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No student data yet"
                description="Top students will appear once your department has student records matching this scope."
              />
            )}
          </Panel>
        </DashboardSection>

        <DashboardSection
          id="openings"
          title="Relevant openings"
          description="Only active jobs aligned with your institution and department targeting appear here."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Upcoming openings"
              description="Open roles sorted by closing date so the department can push timely outreach."
            >
              {data.upcomingOpenings.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.upcomingOpenings.map((opening) => (
                    <div
                      key={opening.id}
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
                            {opening.title}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                            {opening.companyName}
                          </div>
                        </div>
                        <Tag label={opening.type} tone="neutral" />
                      </div>
                      <div
                        style={{
                          marginTop: 12,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                          fontSize: 13,
                          color: '#64748B',
                        }}
                      >
                        <span>Applications {formatCompactNumber(opening.applicationCount)}</span>
                        <span>Deadline {formatShortDate(opening.deadline)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No matching openings"
                  description="Relevant active roles will appear once employers post jobs targeting this department."
                />
              )}
            </Panel>

            <Panel
              title="Skill snapshot"
              description="A live list of repeated skill themes already present in the department cohort profiles."
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.skillSnapshot.length > 0 ? (
                  data.skillSnapshot.map((skill) => <Tag key={skill} label={skill} tone="info" />)
                ) : (
                  <EmptyState
                    title="No skill snapshot yet"
                    description="Once students populate skill data, recurring themes will appear here."
                  />
                )}
              </div>
            </Panel>
          </div>
        </DashboardSection>

        <style>{`
          @media (max-width: 1200px) {
            .dashboard-stats-grid {
              grid-template-columns: repeat(3, minmax(0, 1fr)) !important;
            }
          }

          @media (max-width: 900px) {
            .dashboard-stats-grid,
            .dashboard-grid-two {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
