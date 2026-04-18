// src/components/academic/TeacherRecommendationPage.tsx
// Layout and visual polish only — all logic, components, and props unchanged

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
        {/* ── Hero ── */}
        <HeroCard
          eyebrow="Unified opportunity recommendations"
          title={
            selectedStudent
              ? `${selectedStudent.name} — guidance workspace`
              : role === 'advisor'
                ? 'Advisor opportunity workspace'
                : 'Department opportunity workspace'
          }
          subtitle={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag label={data.scopeLabel} tone="info" />
              <Tag
                label={`${data.cohortSummary.totalStudents} student${data.cohortSummary.totalStudents === 1 ? '' : 's'} in scope`}
                tone="neutral"
              />
              {selectedStudent?.currentSemester ? (
                <Tag label={selectedStudent.currentSemester} tone="success" />
              ) : null}
            </div>
          }
          description="Blend automated matching, skill-gap signals, and teacher judgment into one professional workspace. Prioritize opportunities, recommend learning actions, and keep advising decisions grounded in readiness data."
          actions={
            <>
              <ActionLink href={directoryHref} label="Open student directory" />
              <ActionLink href={insightsHref} label="Review analytics" tone="ghost" />
            </>
          }
          aside={
            selectedStudent ? (
              <Panel
                title="Selected student"
                description="Live readiness context for this session."
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <div
                      style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900, lineHeight: 1.2 }}
                    >
                      {selectedStudent.name}
                    </div>
                    <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
                      {selectedStudent.email}
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
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
                  <div
                    style={{
                      borderTop: '1px solid rgba(255,255,255,0.1)',
                      paddingTop: 14,
                      display: 'grid',
                      gap: 10,
                    }}
                  >
                    <ProgressBar
                      value={selectedStudent.opportunityScore}
                      label="Opportunity score"
                    />
                    <ProgressBar
                      value={selectedStudent.profileCompleteness}
                      label="Profile completeness"
                      tone="success"
                    />
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel
                title="No student selected"
                description="Choose a student to open the recommendation workspace."
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <div style={{ color: '#D6E4FF', fontSize: 14, lineHeight: 1.7 }}>
                  The workspace populates once a scoped student is selected from the list below.
                </div>
              </Panel>
            )
          }
        />

        {/* ── Cohort stats bar ── */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}
            className="teacher-stats-grid"
          >
            <StatCard
              label="Students in scope"
              value={String(data.cohortSummary.totalStudents)}
              hint="Current workspace scope"
              Icon={Users}
              showIcon={false}
            />
            <StatCard
              label="High attention"
              value={String(data.cohortSummary.highAttentionStudents)}
              hint="Below readiness threshold"
              Icon={ShieldAlert}
              accent="#F59E0B"
              showIcon={false}
            />
            <StatCard
              label="Avg opportunity score"
              value={`${Math.round(data.cohortSummary.averageOpportunityScore)}%`}
              hint="Average readiness"
              Icon={TrendingUp}
              accent="#10B981"
              showIcon={false}
            />
            <StatCard
              label="Avg profile completion"
              value={
                typeof data.cohortSummary.averageProfileCompleteness === 'number'
                  ? `${Math.round(data.cohortSummary.averageProfileCompleteness)}%`
                  : '—'
              }
              hint="Across scope"
              Icon={LayoutGrid}
              accent="#22C55E"
              showIcon={false}
            />
          </div>
        </section>

        {/* ── Focus management ── */}
        <DashboardSection
          title="Focus management"
          description="Select a student, review their readiness signals, and decide where intervention matters most."
        >
          {/* Student list + readiness — side by side */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px minmax(0, 1fr)',
              gap: 16,
              alignItems: 'start',
            }}
            className="teacher-focus-grid"
          >
            {/* ── Left: student picker ── */}
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
              }}
            >
              {/* Picker header */}
              <div
                style={{
                  padding: '16px 18px',
                  borderBottom: '1px solid #F1F5F9',
                  background: '#FAFBFC',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  {data.pickerLabel}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Select a student to load their workspace
                </div>
              </div>

              {/* Dashboard launcher */}
              <div style={{ padding: '14px 18px', borderBottom: '1px solid #F1F5F9' }}>
                <TeacherStudentDashboardLauncher
                  students={data.students.map((s) => ({
                    id: s.id,
                    name: s.name,
                    opportunityScore: s.opportunityScore,
                  }))}
                  defaultStudentId={data.selectedStudentId}
                  dashboardBasePath={dashboardBasePath}
                />
              </div>

              {/* Student rows */}
              <div
                style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}
              >
                {data.students.slice(0, 6).map((student) => {
                  const isSelected = student.id === data.selectedStudentId;
                  return (
                    <Link
                      key={student.id}
                      href={`${pagePath}?studentId=${student.id}`}
                      style={{
                        textDecoration: 'none',
                        borderRadius: 14,
                        border: isSelected ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                        background: isSelected ? '#EFF6FF' : '#FFFFFF',
                        padding: '12px 14px',
                        display: 'block',
                        transition: 'all 0.12s',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: 8,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              color: '#0F172A',
                              fontSize: 14,
                              fontWeight: 700,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {student.name}
                          </div>
                          <div style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>
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
                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 8 }}>
                        {student.department ? <MiniChip label={student.department} /> : null}
                        {student.currentSemester ? (
                          <MiniChip label={student.currentSemester} />
                        ) : null}
                        {typeof student.cgpa === 'number' ? (
                          <MiniChip label={`CGPA ${student.cgpa.toFixed(2)}`} />
                        ) : null}
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* ── Right: readiness detail ── */}
            {selectedStudent ? (
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                }}
              >
                {/* Card header */}
                <div
                  style={{
                    padding: '16px 22px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FAFBFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      Student readiness summary
                    </div>
                    <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                      Condensed context before deciding what to recommend
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedStudent.department ? (
                      <MiniChip label={selectedStudent.department} />
                    ) : null}
                    {selectedStudent.yearOfStudy ? (
                      <MiniChip label={`Year ${selectedStudent.yearOfStudy}`} />
                    ) : null}
                  </div>
                </div>

                <div style={{ padding: '20px 22px' }}>
                  <div
                    style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}
                    className="teacher-readiness-grid"
                  >
                    {/* Metrics column */}
                    <div style={{ display: 'grid', gap: 12 }}>
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

                    {/* Skills column */}
                    <div style={{ display: 'grid', gap: 16, alignContent: 'start' }}>
                      <div>
                        <div style={subHeadingStyle}>Top skill gaps</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          {selectedStudent.topSkillGaps.length > 0 ? (
                            selectedStudent.topSkillGaps.map((gap) => (
                              <MiniChip key={gap} label={gap} tone="warning" />
                            ))
                          ) : (
                            <MiniText text="No hard gaps recorded yet." />
                          )}
                        </div>
                      </div>
                      <div>
                        <div style={subHeadingStyle}>Current strengths</div>
                        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 8 }}>
                          {selectedStudent.skills.slice(0, 8).map((skill) => (
                            <MiniChip key={skill} label={skill} tone="success" />
                          ))}
                          {selectedStudent.skills.length === 0 ? (
                            <MiniText text="No skills saved on this profile yet." />
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#FAFBFC',
                  borderRadius: 20,
                  border: '1.5px dashed #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 280,
                }}
              >
                <EmptyState
                  title="No student context yet"
                  description="Select a student from the list to load readiness signals, skill gaps, and strengths."
                />
              </div>
            )}
          </div>
        </DashboardSection>

        {/* ── Opportunity matches ── */}
        <DashboardSection
          title="Opportunity matches"
          description="Automated fits, readiness gaps, and application context aligned to the selected student's profile."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
              gap: 16,
              alignItems: 'start',
            }}
            className="teacher-opportunity-grid"
          >
            {/* ── Automated matches ── */}
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  background: '#FAFBFC',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  Automated opportunity matches
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Unified recommendations across jobs, internships, and events
                </div>
              </div>

              <div
                style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}
              >
                {data.automatedRecommendations.length === 0 ? (
                  <EmptyState
                    title="No automated opportunities yet"
                    description="There are no scoped opportunities ready to recommend for the selected student."
                  />
                ) : (
                  data.automatedRecommendations.map((rec) => (
                    <div
                      key={rec.id}
                      style={{
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        padding: '16px 18px',
                      }}
                    >
                      {/* Rec header */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 12,
                          flexWrap: 'wrap',
                          marginBottom: 12,
                        }}
                      >
                        <div>
                          <div
                            style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 8 }}
                          >
                            <Pill label={rec.category.replace(/_/g, ' ')} tone="info" />
                            <Pill label={`${rec.fitScore}% fit`} tone="success" />
                            <Pill label={rec.priority} tone="warning" />
                          </div>
                          <div
                            style={{
                              fontSize: 16,
                              fontWeight: 800,
                              color: '#0F172A',
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {rec.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                            {rec.organizationName}
                            {rec.dateLabel ? ` · ${rec.dateLabel}` : ''}
                          </div>
                        </div>
                        {rec.href ? (
                          <Link
                            href={rec.href}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              textDecoration: 'none',
                              borderRadius: 10,
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '8px 12px',
                              fontSize: 12,
                              fontWeight: 700,
                              flexShrink: 0,
                            }}
                          >
                            View <ArrowRight size={13} />
                          </Link>
                        ) : null}
                      </div>

                      {/* Rationale */}
                      <p
                        style={{
                          margin: '0 0 12px',
                          fontSize: 13,
                          lineHeight: 1.7,
                          color: '#475569',
                        }}
                      >
                        {rec.rationale}
                      </p>

                      {/* Signal cards */}
                      <div
                        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
                        className="teacher-signal-grid"
                      >
                        <SignalCard
                          title="Matched signals"
                          tone="success"
                          items={rec.matchedSignals}
                          emptyText="No explicit matched signals captured."
                        />
                        <SignalCard
                          title="Gap signals"
                          tone="warning"
                          items={rec.missingSignals}
                          emptyText="No blocking gaps identified."
                        />
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* ── Application intelligence ── */}
            <div
              style={{
                background: '#fff',
                borderRadius: 20,
                border: '1px solid #E2E8F0',
                overflow: 'hidden',
                boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  padding: '16px 20px',
                  borderBottom: '1px solid #F1F5F9',
                  background: '#FAFBFC',
                }}
              >
                <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                  Application intelligence
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                  Tracked applications and fit analysis in the system
                </div>
              </div>

              <div
                style={{ padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}
              >
                {selectedStudent?.applicationHighlights.length ? (
                  selectedStudent.applicationHighlights.map((item) => (
                    <div
                      key={item.id}
                      style={{
                        borderRadius: 14,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        padding: '13px 15px',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 10,
                          flexWrap: 'wrap',
                          marginBottom: item.summary ? 8 : 0,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                            {item.title}
                          </div>
                          <div style={{ fontSize: 12, color: '#64748B', marginTop: 3 }}>
                            {item.companyName}
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <Pill label={formatStatusLabel(item.status)} tone="neutral" />
                          {typeof item.fitScore === 'number' ? (
                            <Pill label={`${item.fitScore}% fit`} tone="success" />
                          ) : null}
                        </div>
                      </div>
                      {item.summary ? (
                        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: '#64748B' }}>
                          {item.summary}
                        </p>
                      ) : null}
                    </div>
                  ))
                ) : (
                  <EmptyState
                    title="No application intelligence yet"
                    description="Fit summaries and status context appear once the student has tracked opportunities."
                  />
                )}
              </div>
            </div>
          </div>
        </DashboardSection>

        {/* ── Teacher review and recommendation ── */}
        <DashboardSection
          title="Teacher review and recommendation"
          description="Save structured academic reviews and job-specific recommendations directly into the student guidance record."
        >
          {selectedStudent ? (
            <div style={{ display: 'grid', gap: 14 }}>
              <CollapsibleWorkspaceCard
                title="Academic review"
                description="Capture an overall profile assessment — strengths, growth areas, and readiness."
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
            <div
              style={{
                background: '#FAFBFC',
                borderRadius: 20,
                border: '1.5px dashed #E2E8F0',
                padding: '48px 24px',
              }}
            >
              <EmptyState
                title="Choose a student first"
                description="A selected student is required before saving an academic review or job recommendation."
              />
            </div>
          )}
        </DashboardSection>

        {/* ── Cohort coaching signals ── */}
        {role === 'advisor' && (
          <DashboardSection
            title="Cohort coaching signals"
            description="Use recurring patterns across your cohort to shape coaching priorities."
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 0.85fr) minmax(0, 1.15fr)',
                gap: 16,
                alignItems: 'start',
              }}
              className="teacher-opportunity-grid"
            >
              {/* Repeated skill gaps */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FAFBFC',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    Repeated skill gaps
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Most common hard gaps across advisee activity
                  </div>
                </div>
                <div style={{ padding: '16px 18px' }}>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {data.advisorInsights?.topSkillGaps?.length ? (
                      data.advisorInsights.topSkillGaps.map((gap) => (
                        <MiniChip key={gap} label={gap} tone="warning" />
                      ))
                    ) : (
                      <MiniText text="No repeated hard-skill gaps have surfaced yet." />
                    )}
                  </div>
                </div>
              </div>

              {/* Recent advising actions */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FAFBFC',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    Recent advising actions
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Most recent interventions saved for students in your scope
                  </div>
                </div>
                <div
                  style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {data.advisorInsights?.recentActions?.length ? (
                    data.advisorInsights.recentActions.slice(0, 6).map((action) => (
                      <div
                        key={action.id}
                        style={{
                          borderRadius: 14,
                          border: '1px solid #E2E8F0',
                          background: '#FFFFFF',
                          padding: '13px 15px',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            marginBottom: 6,
                          }}
                        >
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                            {action.studentName}
                          </div>
                          <Pill label={formatStatusLabel(action.actionType)} tone="info" />
                        </div>
                        {action.advisorNote ? (
                          <p
                            style={{ margin: 0, fontSize: 12, lineHeight: 1.65, color: '#64748B' }}
                          >
                            {action.advisorNote}
                          </p>
                        ) : null}
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No advising actions yet"
                      description="Saved manual recommendations and plan changes will appear here."
                    />
                  )}
                </div>
              </div>
            </div>
          </DashboardSection>
        )}

        {/* ── Dept head insights ── */}
        {role === 'dept_head' && (
          <DashboardSection
            title="Department readiness insights"
            description="Connect recommendation work with department-wide readiness and industry-alignment trends."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
              className="teacher-opportunity-insights"
            >
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FAFBFC',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    Readiness distribution
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Department-level segmentation
                  </div>
                </div>
                <div style={{ padding: '16px 18px', display: 'grid', gap: 10 }}>
                  <InsightMetric
                    label="Ready"
                    value={`${data.departmentInsights?.readinessDistribution.ready.pct ?? 0}%`}
                    tone="success"
                  />
                  <InsightMetric
                    label="Partially ready"
                    value={`${data.departmentInsights?.readinessDistribution.partial.pct ?? 0}%`}
                    tone="warning"
                  />
                  <InsightMetric
                    label="Not ready"
                    value={`${data.departmentInsights?.readinessDistribution.notReady.pct ?? 0}%`}
                    tone="danger"
                  />
                </div>
              </div>

              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FAFBFC',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    Industry alignment
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Skills demanded by relevant openings
                  </div>
                </div>
                <div
                  style={{ padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}
                >
                  {data.departmentInsights?.industryAlignment.slice(0, 6).map((item) => (
                    <div
                      key={item.skill}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        padding: '10px 12px',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                          {item.skill}
                        </div>
                        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
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
              </div>

              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  overflow: 'hidden',
                  boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
                }}
              >
                <div
                  style={{
                    padding: '16px 20px',
                    borderBottom: '1px solid #F1F5F9',
                    background: '#FAFBFC',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    Skill heatmap
                  </div>
                  <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                    Most represented skills across the cohort
                  </div>
                </div>
                <div style={{ padding: '14px 16px' }}>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {data.departmentInsights?.skillHeatmap
                      .slice(0, 10)
                      .map((item) => (
                        <MiniChip
                          key={item.skill}
                          label={`${item.skill} · ${item.pct}%`}
                          tone="success"
                        />
                      )) ?? <MiniText text="No skill heatmap available yet." />}
                  </div>
                </div>
              </div>
            </div>
          </DashboardSection>
        )}

        <style>{`
          @media (max-width: 1180px) {
            .teacher-opportunity-grid,
            .teacher-opportunity-insights,
            .teacher-focus-grid,
            .teacher-signal-grid { grid-template-columns: 1fr !important; }
          }
          @media (max-width: 900px) {
            .teacher-stats-grid,
            .teacher-readiness-grid { grid-template-columns: 1fr 1fr !important; }
          }
          @media (max-width: 600px) {
            .teacher-stats-grid,
            .teacher-readiness-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}

// ── Sub-components — all logic identical, styling cleaned up ────────────────

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
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: '0 2px 10px rgba(15,23,42,0.05)',
        overflow: 'hidden',
      }}
    >
      <summary
        style={{
          listStyle: 'none',
          cursor: 'pointer',
          padding: '18px 22px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          background: '#FAFBFC',
          borderBottom: '1px solid transparent',
        }}
      >
        <div>
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 1.55 }}>
            {description}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 34,
            height: 34,
            borderRadius: 10,
            border: '1px solid #DBEAFE',
            background: '#EFF6FF',
            color: '#2563EB',
            flexShrink: 0,
          }}
        >
          <ChevronDown size={16} />
        </span>
      </summary>
      <div style={{ borderTop: '1px solid #E2E8F0', padding: '20px 22px', background: '#F8FAFC' }}>
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
      ? { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' }
      : { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        padding: '12px 14px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 800,
          color: palette.color,
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.length > 0 ? (
          items.map((item) => (
            <div
              key={`${title}:${item}`}
              style={{ fontSize: 12, color: '#334155', lineHeight: 1.6 }}
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
      ? { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        borderRadius: 12,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        padding: '11px 14px',
      }}
    >
      <span style={{ fontSize: 13, color: '#475569', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 18, fontWeight: 900, color: palette.color }}>{value}</span>
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
        padding: '10px 12px',
        borderRadius: 12,
        border: '1px solid #E2E8F0',
        background: '#F8FAFC',
      }}
    >
      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 700 }}>{value}</span>
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
        padding: '4px 9px',
        borderRadius: 999,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: 10,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: 0.5,
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
      ? { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 9px',
        borderRadius: 999,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: 11,
        fontWeight: 600,
      }}
    >
      {label}
    </span>
  );
}

function MiniText({ text }: { text: string }) {
  return <div style={{ fontSize: 12, lineHeight: 1.7, color: '#94A3B8' }}>{text}</div>;
}

const subHeadingStyle: React.CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};
