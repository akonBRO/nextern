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
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { getAdvisorDashboardData } from '@/lib/role-dashboard';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ClipboardPenLine,
  Target,
  Users,
} from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/advisor/dashboard', icon: 'dashboard' as const },
  {
    label: 'Students',
    icon: 'users' as const,
    items: [
      {
        label: 'Attention queue',
        href: '/advisor/dashboard#students',
        description: 'Prioritized advisees that need immediate coaching or intervention.',
        icon: 'users' as const,
      },
      {
        label: 'Recent actions',
        href: '/advisor/dashboard#actions',
        description: 'Track the most recent advisor activity recorded in the database.',
        icon: 'file' as const,
      },
    ],
  },
  {
    label: 'Insights',
    icon: 'insights' as const,
    items: [
      {
        label: 'Upcoming interviews',
        href: '/advisor/dashboard#interviews',
        description: 'Students with approaching interviews that may need support.',
        icon: 'calendar' as const,
      },
      {
        label: 'Skill gaps',
        href: '/advisor/dashboard#skills',
        description: 'Repeated hard-skill gaps across the advisee cohort you oversee.',
        icon: 'target' as const,
      },
    ],
  },
];

export default async function AdvisorDashboard() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getAdvisorDashboardData(session.user.id);
  const roleSubtitle = [data.advisor.designation, data.advisor.institutionName]
    .filter(Boolean)
    .join(' at ');

  return (
    <DashboardShell
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={navItems}
      user={data.chromeUser}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Advisor workspace"
          title="Guide student progress with sharper signals."
          description="This dashboard keeps advisee health, intervention history, and interview readiness in one place so you can act early, not late."
          actions={
            <>
              <ActionLink href="#students" label="Review attention queue" />
              <ActionLink href="#interviews" label="Upcoming interviews" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Advising scope"
              description="Your advisory identity and institutional footprint for the current dashboard."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.advisor.institutionName ? (
                    <Tag label={data.advisor.institutionName} tone="info" />
                  ) : null}
                  {data.advisor.advisoryDepartment ? (
                    <Tag label={data.advisor.advisoryDepartment} tone="neutral" />
                  ) : null}
                  {roleSubtitle ? (
                    <Tag label={roleSubtitle} tone="success" />
                  ) : (
                    <Tag label="Advisor workspace" tone="neutral" />
                  )}
                </div>
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
              label="Advisees"
              value={formatCompactNumber(data.stats.totalAdvisees)}
              Icon={Users}
            />
            <StatCard
              label="Priority students"
              value={formatCompactNumber(data.stats.priorityStudents)}
              Icon={AlertTriangle}
              accent="#F59E0B"
            />
            <StatCard
              label="Average score"
              value={`${data.stats.avgOpportunityScore}%`}
              Icon={Target}
              accent="#22D3EE"
            />
            <StatCard
              label="Profile readiness"
              value={`${data.stats.avgProfileCompleteness}%`}
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Advisor actions"
              value={formatCompactNumber(data.stats.totalAdvisorActions)}
              Icon={ClipboardPenLine}
              accent="#2563EB"
            />
          </div>
        </section>

        <DashboardSection
          id="students"
          title="Student attention queue"
          description="Students appear here based on low score, low profile completion, or explicit priority flags captured in advisor actions."
        >
          <Panel
            title="Needs review"
            description="Prioritized advisees who are currently most likely to benefit from direct intervention."
          >
            {data.attentionStudents.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                  gap: 14,
                }}
                className="dashboard-grid-two"
              >
                {data.attentionStudents.map((student) => (
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
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 12,
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                          {student.name}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                          {[student.university, student.department].filter(Boolean).join(' | ') ||
                            'Academic info pending'}
                        </div>
                      </div>
                      <Tag
                        label={student.priorityFlagged ? 'Priority' : 'Monitor'}
                        tone={student.priorityFlagged ? 'warning' : 'info'}
                      />
                    </div>
                    <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
                      <ProgressBar
                        value={student.opportunityScore}
                        label="Opportunity score"
                        tone={student.opportunityScore < 40 ? 'warning' : 'primary'}
                      />
                      <ProgressBar
                        value={student.profileCompleteness}
                        label="Profile completeness"
                        tone={student.profileCompleteness < 60 ? 'warning' : 'success'}
                      />
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {typeof student.cgpa === 'number' ? (
                          <Tag label={`CGPA ${student.cgpa.toFixed(2)}`} tone="neutral" />
                        ) : (
                          <Tag label="CGPA not added" tone="warning" />
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No students need urgent review"
                description="Priority students will surface here once lower-readiness profiles or flags appear in your advisee set."
              />
            )}
          </Panel>
        </DashboardSection>

        <DashboardSection
          id="interviews"
          title="Upcoming interviews"
          description="Interview events are pulled from real scheduled application records so you can prepare students before they step in."
        >
          <Panel
            title="Interview watchlist"
            description="Students with interview dates still ahead of the current time."
          >
            {data.upcomingInterviews.length > 0 ? (
              <div style={{ display: 'grid', gap: 12 }}>
                {data.upcomingInterviews.map((interview) => (
                  <div
                    key={interview.id}
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
                        gridTemplateColumns: 'minmax(0, 1.2fr) auto',
                        gap: 12,
                        alignItems: 'center',
                      }}
                      className="dashboard-inline-grid"
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: '#1E293B' }}>
                          {interview.studentName}
                        </div>
                        <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                          {interview.jobTitle} at {interview.companyName}
                        </div>
                      </div>
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          color: '#2563EB',
                          fontSize: 13,
                          fontWeight: 700,
                        }}
                      >
                        <CalendarClock size={15} strokeWidth={2} />
                        {formatShortDate(interview.scheduledAt)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No upcoming interviews"
                description="Scheduled interviews will appear here as soon as students in your cohort reach that stage."
              />
            )}
          </Panel>
        </DashboardSection>

        <DashboardSection
          id="actions"
          title="Recent advisor activity"
          description="A rolling view of the intervention and planning actions already stored under your advisor account."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Logged actions"
              description="Recent plan updates, notes, exports, and priority flags."
            >
              {data.recentActions.length > 0 ? (
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.recentActions.map((action) => (
                    <div
                      key={action.id}
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
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                            {action.studentName}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                            {formatStatusLabel(action.actionType)}
                          </div>
                        </div>
                        <Tag label={formatShortDate(action.createdAt)} tone="neutral" />
                      </div>
                      {action.advisorNote ? (
                        <div
                          style={{
                            marginTop: 12,
                            fontSize: 13,
                            lineHeight: 1.65,
                            color: '#64748B',
                          }}
                        >
                          {action.advisorNote}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  title="No advisor actions recorded yet"
                  description="Once you start modifying plans or flagging students, the history will appear here."
                />
              )}
            </Panel>

            <Panel
              title="Common skill gaps"
              description="Repeated hard-skill issues across advisee applications, useful for coaching and workshop planning."
            >
              <div id="skills" style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {data.topSkillGaps.length > 0 ? (
                  data.topSkillGaps.map((gap) => <Tag key={gap} label={gap} tone="warning" />)
                ) : (
                  <EmptyState
                    title="No recurring skill gaps yet"
                    description="Detected hard-skill gaps will appear here as more application scoring data accumulates."
                  />
                )}
              </div>
            </Panel>
          </div>
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
