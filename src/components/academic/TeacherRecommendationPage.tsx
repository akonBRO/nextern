import Link from 'next/link';
import { ArrowRight, ChevronDown, LayoutGrid, ShieldAlert, TrendingUp, Users } from 'lucide-react';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import TeacherAcademicReviewComposer from '@/components/academic/TeacherAcademicReviewComposer';
import TeacherRecommendationComposer from '@/components/academic/TeacherRecommendationComposer';
import TeacherStudentDashboardLauncher from '@/components/academic/TeacherStudentDashboardLauncher';
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
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import type { TeacherRecommendationWorkspaceData } from '@/lib/opportunity-recommendations';

type Props = {
  role: 'advisor' | 'dept_head';
  shellRole: 'advisor' | 'departmentHead';
  roleLabel: string;
  homeHref: string;
  pagePath: string;
  directoryHref: string;
  insightsHref: string;
  dashboardBasePath: string;
  navItems: DashboardNavItem[];
  data: TeacherRecommendationWorkspaceData;
};

export default function TeacherRecommendationPage({
  role,
  shellRole,
  roleLabel,
  homeHref,
  pagePath,
  directoryHref,
  insightsHref,
  dashboardBasePath,
  navItems,
  data,
}: Props) {
  const selectedStudent = data.selectedStudent;

  return (
    <DashboardShell
      role={shellRole}
      roleLabel={roleLabel}
      homeHref={homeHref}
      navItems={navItems}
      user={data.chromeUser}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Unified opportunity recommendations"
          title={
            selectedStudent
              ? `${selectedStudent.name} guidance workspace`
              : role === 'advisor'
                ? 'Advisor opportunity guidance workspace'
                : 'Department opportunity guidance workspace'
          }
          subtitle={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag label={data.scopeLabel} tone="info" />
              <Tag
                label={`${data.cohortSummary.totalStudents} student${data.cohortSummary.totalStudents === 1 ? '' : 's'} in view`}
                tone="neutral"
              />
              {selectedStudent?.currentSemester ? (
                <Tag label={selectedStudent.currentSemester} tone="success" />
              ) : null}
            </div>
          }
          description="Blend automated matching, skill-gap signals, and teacher judgment into one professional workspace. Use this page to prioritize opportunities, recommend learning actions, and keep advising decisions grounded in readiness data."
          actions={
            <>
              <ActionLink href={directoryHref} label="Open student directory" />
              <ActionLink href={insightsHref} label="Review analytics" tone="ghost" />
            </>
          }
          aside={
            selectedStudent ? (
              <Panel
                title="Selected student snapshot"
                description="Live readiness and focus context for the current recommendation session."
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <div style={{ display: 'grid', gap: 12 }}>
                  <div style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900 }}>
                    {selectedStudent.name}
                  </div>
                  <div style={{ color: '#D6E4FF', fontSize: 13, lineHeight: 1.7 }}>
                    {selectedStudent.email}
                  </div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {selectedStudent.department ? (
                      <Pill label={selectedStudent.department} tone="infoOnDark" />
                    ) : null}
                    {selectedStudent.yearOfStudy ? (
                      <Pill label={`Year ${selectedStudent.yearOfStudy}`} tone="successOnDark" />
                    ) : null}
                    {selectedStudent.studentId ? (
                      <Pill label={`ID ${selectedStudent.studentId}`} tone="neutralOnDark" />
                    ) : null}
                  </div>
                  <ProgressBar value={selectedStudent.opportunityScore} label="Opportunity score" />
                  <ProgressBar
                    value={selectedStudent.profileCompleteness}
                    label="Profile completeness"
                    tone="success"
                  />
                </div>
              </Panel>
            ) : (
              <Panel
                title="No student selected"
                description="Choose a student from the focus list to open recommendations."
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <div style={{ color: '#D6E4FF', fontSize: 14, lineHeight: 1.7 }}>
                  The workspace will populate once a scoped student is available.
                </div>
              </Panel>
            )
          }
        />

        <DashboardSection
          title="Focus management"
          description="Choose a student, review readiness, and decide where intervention or prioritization matters most."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(280px, 0.9fr) minmax(0, 1.1fr)',
              gap: 18,
            }}
            className="teacher-opportunity-grid"
          >
            <Panel
              title={data.pickerLabel}
              description="Open a scoped student's dashboard preview from here."
            >
              <TeacherStudentDashboardLauncher
                students={data.students.map((student) => ({
                  id: student.id,
                  name: student.name,
                  opportunityScore: student.opportunityScore,
                }))}
                defaultStudentId={data.selectedStudentId}
                dashboardBasePath={dashboardBasePath}
              />

              <div style={{ display: 'grid', gap: 12, marginTop: 18 }}>
                {data.students.slice(0, 6).map((student) => (
                  <Link
                    key={student.id}
                    href={`${pagePath}?studentId=${student.id}`}
                    style={{
                      textDecoration: 'none',
                      borderRadius: 18,
                      border:
                        student.id === data.selectedStudentId
                          ? '1px solid #93C5FD'
                          : '1px solid #E2E8F0',
                      background: student.id === data.selectedStudentId ? '#EFF6FF' : '#FFFFFF',
                      padding: 14,
                      display: 'grid',
                      gap: 8,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ color: '#0F172A', fontSize: 15, fontWeight: 800 }}>
                          {student.name}
                        </div>
                        <div style={{ color: '#64748B', fontSize: 12, marginTop: 4 }}>
                          {student.email}
                        </div>
                      </div>
                      <Pill
                        label={`${student.opportunityScore}%`}
                        tone={
                          student.attentionLevel === 'high'
                            ? 'warning'
                            : student.attentionLevel === 'medium'
                              ? 'neutral'
                              : 'success'
                        }
                      />
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {student.department ? <MiniChip label={student.department} /> : null}
                      {student.currentSemester ? (
                        <MiniChip label={student.currentSemester} />
                      ) : null}
                      {typeof student.cgpa === 'number' ? (
                        <MiniChip label={`CGPA ${student.cgpa.toFixed(2)}`} />
                      ) : null}
                    </div>
                  </Link>
                ))}
              </div>
            </Panel>

            <div style={{ display: 'grid', gap: 18 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                  gap: 16,
                }}
                className="teacher-opportunity-stats"
              >
                <StatCard
                  label="Students In Scope"
                  value={String(data.cohortSummary.totalStudents)}
                  hint="Current teacher workspace scope"
                  Icon={Users}
                  showIcon={false}
                />
                <StatCard
                  label="High Attention"
                  value={String(data.cohortSummary.highAttentionStudents)}
                  hint="Students below readiness threshold"
                  Icon={ShieldAlert}
                  accent="#F59E0B"
                  showIcon={false}
                />
                <StatCard
                  label="Avg Score"
                  value={`${Math.round(data.cohortSummary.averageOpportunityScore)}%`}
                  hint="Average opportunity readiness"
                  Icon={TrendingUp}
                  accent="#10B981"
                  showIcon={false}
                />
                <StatCard
                  label="Avg Profile"
                  value={
                    typeof data.cohortSummary.averageProfileCompleteness === 'number'
                      ? `${Math.round(data.cohortSummary.averageProfileCompleteness)}%`
                      : '—'
                  }
                  hint="Profile completeness across scope"
                  Icon={LayoutGrid}
                  accent="#22C55E"
                  showIcon={false}
                />
              </div>

              {selectedStudent ? (
                <Panel
                  title="Student readiness summary"
                  description="Condensed context before deciding what to recommend."
                >
                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 18,
                    }}
                    className="teacher-opportunity-details"
                  >
                    <div style={{ display: 'grid', gap: 14 }}>
                      <ProgressBar
                        value={selectedStudent.opportunityScore}
                        label="Opportunity score"
                      />
                      <ProgressBar
                        value={selectedStudent.profileCompleteness}
                        label="Profile completeness"
                        tone="success"
                      />
                      {selectedStudent.cgpa ? (
                        <MetricLine label="CGPA" value={selectedStudent.cgpa.toFixed(2)} />
                      ) : null}
                      {selectedStudent.department ? (
                        <MetricLine label="Department" value={selectedStudent.department} />
                      ) : null}
                    </div>

                    <div style={{ display: 'grid', gap: 12 }}>
                      <div>
                        <div style={subHeadingStyle}>Top skill gaps</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {selectedStudent.topSkillGaps.length > 0 ? (
                            selectedStudent.topSkillGaps.map((gap) => (
                              <MiniChip key={gap} label={gap} />
                            ))
                          ) : (
                            <MiniText text="No hard gaps recorded yet. Use upcoming opportunities to guide the next recommendation." />
                          )}
                        </div>
                      </div>

                      <div>
                        <div style={subHeadingStyle}>Current strengths</div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          {selectedStudent.skills.slice(0, 8).map((skill) => (
                            <MiniChip key={skill} label={skill} tone="success" />
                          ))}
                          {selectedStudent.skills.length === 0 ? (
                            <MiniText text="No skills saved on the student profile yet." />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </Panel>
              ) : (
                <EmptyState
                  title="No student context yet"
                  description="A selected student unlocks automated opportunities, gap analysis, and manual recommendation controls."
                />
              )}
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Opportunity matches"
          description="Automated fits, readiness gaps, and application context aligned to the selected student's profile."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.1fr) minmax(0, 0.9fr)',
              gap: 18,
            }}
            className="teacher-opportunity-grid"
          >
            <Panel
              title="Automated opportunity matches"
              description="Unified recommendations across jobs, internships, and events using student profile data and opportunity requirements."
            >
              {data.automatedRecommendations.length === 0 ? (
                <EmptyState
                  title="No automated opportunities yet"
                  description="There are no scoped opportunities ready to recommend for the selected student right now."
                />
              ) : (
                <div style={{ display: 'grid', gap: 14 }}>
                  {data.automatedRecommendations.map((recommendation) => (
                    <div
                      key={recommendation.id}
                      style={{
                        borderRadius: 20,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        padding: 16,
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                        }}
                      >
                        <div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Pill label={recommendation.category.replace(/_/g, ' ')} tone="info" />
                            <Pill label={`${recommendation.fitScore}% fit`} tone="success" />
                            <Pill label={recommendation.priority} tone="warning" />
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 18,
                              fontWeight: 800,
                              color: '#0F172A',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {recommendation.title}
                          </div>
                          <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>
                            {recommendation.organizationName}
                            {recommendation.dateLabel ? ` · ${recommendation.dateLabel}` : ''}
                          </div>
                        </div>

                        {recommendation.href ? (
                          <Link
                            href={recommendation.href}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              textDecoration: 'none',
                              borderRadius: 14,
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '10px 12px',
                              fontSize: 13,
                              fontWeight: 800,
                            }}
                          >
                            View
                            <ArrowRight size={14} />
                          </Link>
                        ) : null}
                      </div>

                      <p
                        style={{
                          margin: '12px 0 0',
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: '#475569',
                        }}
                      >
                        {recommendation.rationale}
                      </p>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                          gap: 12,
                          marginTop: 14,
                        }}
                        className="teacher-opportunity-details"
                      >
                        <SignalCard
                          title="Matched signals"
                          tone="success"
                          items={recommendation.matchedSignals}
                          emptyText="No explicit matched signals were captured."
                        />
                        <SignalCard
                          title="Gap signals"
                          tone="warning"
                          items={recommendation.missingSignals}
                          emptyText="No blocking gaps identified."
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Panel>

            <div style={{ display: 'grid', gap: 18 }}>
              <Panel
                title="Application intelligence"
                description="Recent tracked applications and existing fit analysis already stored in the system."
              >
                {selectedStudent?.applicationHighlights.length ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {selectedStudent.applicationHighlights.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          borderRadius: 18,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          padding: 14,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            flexWrap: 'wrap',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                              {item.title}
                            </div>
                            <div style={{ marginTop: 5, fontSize: 12, color: '#64748B' }}>
                              {item.companyName}
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Pill label={formatStatusLabel(item.status)} tone="neutral" />
                            {typeof item.fitScore === 'number' ? (
                              <Pill label={`${item.fitScore}% fit`} tone="success" />
                            ) : null}
                          </div>
                        </div>
                        {item.summary ? (
                          <p
                            style={{
                              margin: '10px 0 0',
                              fontSize: 13,
                              lineHeight: 1.7,
                              color: '#475569',
                            }}
                          >
                            {item.summary}
                          </p>
                        ) : null}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyState
                    title="No application intelligence yet"
                    description="Fit summaries and application status context will appear here once the student has tracked opportunities."
                  />
                )}
              </Panel>
            </div>
          </div>
        </DashboardSection>

        <DashboardSection
          title="Teacher review and recommendation"
          description="Save structured academic reviews and job-specific recommendations directly into the student guidance record."
        >
          {selectedStudent ? (
            <div style={{ display: 'grid', gap: 18 }}>
              <CollapsibleWorkspaceCard
                title="Academic review"
                description="Capture an overall profile assessment for the student, including strengths, growth areas, and readiness."
              >
                <TeacherAcademicReviewComposer
                  studentId={selectedStudent.id}
                  role={role}
                  reviews={data.academicReviews}
                />
              </CollapsibleWorkspaceCard>

              <CollapsibleWorkspaceCard
                title="Job recommendation"
                description="Recommend the student for a specific internship, part-time, or full-time role from the platform."
              >
                <TeacherRecommendationComposer
                  studentId={selectedStudent.id}
                  role={role}
                  recommendations={data.manualRecommendations}
                  jobOptions={data.jobRecommendationOptions}
                />
              </CollapsibleWorkspaceCard>
            </div>
          ) : (
            <EmptyState
              title="Choose a student first"
              description="A selected student is required before saving an academic review or job recommendation."
            />
          )}
        </DashboardSection>

        {role === 'advisor' && (
          <DashboardSection
            title={role === 'advisor' ? 'Cohort coaching signals' : 'Department readiness insights'}
            description={
              role === 'advisor'
                ? 'Use recurring patterns across your cohort to shape coaching priorities.'
                : 'Connect recommendation work with department-wide readiness and industry-alignment trends.'
            }
          >
            {role === 'advisor' ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 0.9fr) minmax(0, 1.1fr)',
                  gap: 18,
                }}
                className="teacher-opportunity-grid"
              >
                <Panel
                  title="Repeated skill gaps"
                  description="Most common hard gaps appearing across advisee activity."
                >
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.advisorInsights?.topSkillGaps?.length ? (
                      data.advisorInsights.topSkillGaps.map((gap) => (
                        <MiniChip key={gap} label={gap} tone="warning" />
                      ))
                    ) : (
                      <MiniText text="No repeated hard-skill gaps have surfaced yet." />
                    )}
                  </div>
                </Panel>

                <Panel
                  title="Recent advising actions"
                  description="The most recent interventions saved for students in your scope."
                >
                  {data.advisorInsights?.recentActions?.length ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                      {data.advisorInsights.recentActions.slice(0, 6).map((action) => (
                        <div
                          key={action.id}
                          style={{
                            borderRadius: 18,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            padding: 14,
                          }}
                        >
                          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                            <Pill label={formatStatusLabel(action.actionType)} tone="info" />
                          </div>
                          <div
                            style={{
                              marginTop: 10,
                              fontSize: 15,
                              fontWeight: 800,
                              color: '#0F172A',
                            }}
                          >
                            {action.studentName}
                          </div>
                          {action.advisorNote ? (
                            <p
                              style={{
                                margin: '8px 0 0',
                                fontSize: 13,
                                lineHeight: 1.7,
                                color: '#475569',
                              }}
                            >
                              {action.advisorNote}
                            </p>
                          ) : null}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <EmptyState
                      title="No advising actions yet"
                      description="Saved manual recommendations and plan changes will appear here."
                    />
                  )}
                </Panel>
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 18,
                }}
                className="teacher-opportunity-insights"
              >
                <Panel
                  title="Readiness distribution"
                  description="Department-level readiness segmentation for intervention planning."
                >
                  <div style={{ display: 'grid', gap: 12 }}>
                    <InsightMetric
                      label="Ready"
                      value={`${data.departmentInsights?.readinessDistribution.ready.pct ?? 0}%`}
                      tone="success"
                    />
                    <InsightMetric
                      label="Partial"
                      value={`${data.departmentInsights?.readinessDistribution.partial.pct ?? 0}%`}
                      tone="warning"
                    />
                    <InsightMetric
                      label="Not ready"
                      value={`${data.departmentInsights?.readinessDistribution.notReady.pct ?? 0}%`}
                      tone="danger"
                    />
                  </div>
                </Panel>

                <Panel
                  title="Industry alignment"
                  description="Skills that are demanded most strongly by relevant openings."
                >
                  <div style={{ display: 'grid', gap: 10 }}>
                    {data.departmentInsights?.industryAlignment.slice(0, 6).map((item) => (
                      <div
                        key={item.skill}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 10,
                          borderRadius: 14,
                          border: '1px solid #E2E8F0',
                          padding: '10px 12px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                            {item.skill}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>
                            Demand {item.demandPct}% · Supply {item.supplyPct}%
                          </div>
                        </div>
                        <Pill
                          label={item.gap ? 'Gap' : 'Balanced'}
                          tone={item.gap ? 'warning' : 'success'}
                        />
                      </div>
                    )) ?? <MiniText text="No alignment data available yet." />}
                  </div>
                </Panel>

                <Panel
                  title="Skill heatmap snapshot"
                  description="Most represented skills across the department cohort."
                >
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.departmentInsights?.skillHeatmap
                      .slice(0, 10)
                      .map((item) => (
                        <MiniChip
                          key={item.skill}
                          label={`${item.skill} · ${item.pct}%`}
                          tone="success"
                        />
                      )) ?? <MiniText text="No department skill heatmap available yet." />}
                  </div>
                </Panel>
              </div>
            )}
          </DashboardSection>
        )}

        <style>{`
          @media (max-width: 1120px) {
            .teacher-opportunity-grid,
            .teacher-opportunity-insights,
            .teacher-opportunity-stats,
            .teacher-opportunity-details {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}

function ActionList({
  actions,
}: {
  actions: Array<{
    category: string;
    title: string;
    description: string;
    focus: string[];
    priority: 'high' | 'medium' | 'low';
  }>;
}) {
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {actions.map((action, index) => (
        <div
          key={`${action.title}-${index}`}
          style={{
            borderRadius: 18,
            border: '1px solid #E2E8F0',
            background: '#FFFFFF',
            padding: 14,
          }}
        >
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Pill label={action.category.replace(/_/g, ' ')} tone="info" />
            <Pill label={action.priority} tone="warning" />
          </div>
          <div
            style={{
              marginTop: 10,
              fontSize: 15,
              fontWeight: 800,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
            }}
          >
            {action.title}
          </div>
          <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.7, color: '#475569' }}>
            {action.description}
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
            {action.focus.length > 0 ? (
              action.focus.map((item) => <MiniChip key={`${action.title}:${item}`} label={item} />)
            ) : (
              <MiniText text="No explicit focus skills were attached to this action yet." />
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

function CollapsibleWorkspaceCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <details
      style={{
        borderRadius: 24,
        border: '1px solid #D9E2EC',
        background: '#FFFFFF',
        boxShadow: '0 18px 34px rgba(15,23,42,0.06)',
        overflow: 'hidden',
      }}
    >
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          padding: '22px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
        }}
      >
        <div style={{ display: 'grid', gap: 8 }}>
          <div
            style={{
              fontSize: 22,
              fontWeight: 900,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
            }}
          >
            {title}
          </div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: '#64748B' }}>{description}</div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 14,
            border: '1px solid #DBEAFE',
            background: '#EFF6FF',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <ChevronDown size={18} />
        </span>
      </summary>

      <div
        style={{
          borderTop: '1px solid #E2E8F0',
          padding: 22,
          background: '#F8FAFC',
        }}
      >
        {children}
      </div>
    </details>
  );
}

function SignalCard({
  title,
  tone,
  items,
  emptyText,
}: {
  title: string;
  tone: 'success' | 'warning';
  items: string[];
  emptyText: string;
}) {
  const palette =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };

  return (
    <div
      style={{
        borderRadius: 18,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: palette.color,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'grid', gap: 8, marginTop: 12 }}>
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${title}:${item}`}
              style={{ fontSize: 13, color: '#334155', lineHeight: 1.6 }}
            >
              {item}
            </div>
          ))
        ) : (
          <MiniText text={emptyText} />
        )}
      </div>
    </div>
  );
}

function InsightMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'success' | 'warning' | 'danger';
}) {
  const palette =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        padding: 14,
      }}
    >
      <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>{label}</div>
      <div style={{ marginTop: 6, fontSize: 20, fontWeight: 900, color: palette.color }}>
        {value}
      </div>
    </div>
  );
}

function MetricLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '12px 14px',
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        background: '#F8FAFC',
      }}
    >
      <span style={{ fontSize: 13, color: '#475569', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#0F172A', fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function Pill({
  label,
  tone,
}: {
  label: string;
  tone:
    | 'info'
    | 'success'
    | 'warning'
    | 'neutral'
    | 'infoOnDark'
    | 'successOnDark'
    | 'neutralOnDark';
}) {
  const palette = {
    info: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
    success: { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' },
    warning: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
    neutral: { bg: '#F8FAFC', border: '#E2E8F0', color: '#475569' },
    infoOnDark: {
      bg: 'rgba(255,255,255,0.12)',
      border: 'rgba(191,219,254,0.38)',
      color: '#DCEBFF',
    },
    successOnDark: {
      bg: 'rgba(16,185,129,0.16)',
      border: 'rgba(167,243,208,0.38)',
      color: '#D1FAE5',
    },
    neutralOnDark: {
      bg: 'rgba(255,255,255,0.08)',
      border: 'rgba(255,255,255,0.18)',
      color: '#E2E8F0',
    },
  }[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 999,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: 11,
        fontWeight: 800,
        textTransform: 'uppercase',
      }}
    >
      {label}
    </span>
  );
}

function MiniChip({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'warning' | 'success';
}) {
  const palette =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '6px 10px',
        borderRadius: 999,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function MiniText({ text }: { text: string }) {
  return <div style={{ fontSize: 13, lineHeight: 1.7, color: '#64748B' }}>{text}</div>;
}

const subHeadingStyle: React.CSSProperties = {
  fontSize: 12,
  fontWeight: 800,
  color: '#475569',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};
