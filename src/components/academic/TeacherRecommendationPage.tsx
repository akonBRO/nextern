'use client';

import type { CSSProperties, ReactNode } from 'react';
import { useDeferredValue, useState } from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  LayoutGrid,
  Search,
  ShieldAlert,
  Sparkles,
  Target,
  TrendingUp,
  Users,
} from 'lucide-react';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';
import TeacherAcademicReviewComposer from '@/components/academic/TeacherAcademicReviewComposer';
import TeacherRecommendationComposer from '@/components/academic/TeacherRecommendationComposer';
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
import type {
  TeacherRecommendationWorkspaceData,
  WorkspaceLearningAction,
} from '@/lib/opportunity-recommendations';

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
  const hasStudent = Boolean(selectedStudent);
  const savedReviewCount = data.academicReviews.length;
  const savedRecommendationCount = data.manualRecommendations.length;
  const coachingPlaybook = [...data.suggestedAcademicPaths, ...data.learningActions].slice(0, 6);
  const [opportunityQuery, setOpportunityQuery] = useState('');
  const [opportunityCategory, setOpportunityCategory] = useState<'all' | string>('all');
  const [opportunityPriority, setOpportunityPriority] = useState<'all' | 'high' | 'medium' | 'low'>(
    'all'
  );
  const [studentQuery, setStudentQuery] = useState('');
  const deferredOpportunityQuery = useDeferredValue(opportunityQuery.trim().toLowerCase());
  const deferredStudentQuery = useDeferredValue(studentQuery.trim().toLowerCase());

  const opportunityCategories = getUniqueValues(
    data.automatedRecommendations.map((recommendation) =>
      recommendation.category.replace(/_/g, ' ')
    )
  );
  const opportunitySearchCues = getOpportunitySearchCues(data.automatedRecommendations).slice(0, 8);
  const filteredRecommendations = data.automatedRecommendations.filter((recommendation) => {
    const normalizedCategory = recommendation.category.replace(/_/g, ' ');
    const matchesCategory =
      opportunityCategory === 'all' || normalizedCategory === opportunityCategory;
    const matchesPriority =
      opportunityPriority === 'all' || recommendation.priority === opportunityPriority;
    const haystack = [
      recommendation.title,
      recommendation.organizationName,
      recommendation.category,
      normalizedCategory,
      recommendation.rationale,
      recommendation.dateLabel,
      ...recommendation.matchedSignals,
      ...recommendation.missingSignals,
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    const matchesQuery = !deferredOpportunityQuery || haystack.includes(deferredOpportunityQuery);

    return matchesCategory && matchesPriority && matchesQuery;
  });
  const visibleRecommendations = filteredRecommendations.slice(
    0,
    deferredOpportunityQuery ? 24 : 12
  );
  const filteredStudents = data.students.filter((student) => {
    const haystack = [
      student.name,
      student.email,
      student.department,
      student.currentSemester,
      student.studentId,
      typeof student.cgpa === 'number' ? `cgpa ${student.cgpa.toFixed(2)}` : '',
      typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : '',
    ]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return !deferredStudentQuery || haystack.includes(deferredStudentQuery);
  });
  const visibleStudentOptions = filteredStudents
    .filter((student) => student.id !== data.selectedStudentId)
    .slice(0, 8);

  const workflowSteps = [
    {
      title: 'Select student',
      description: hasStudent
        ? `${selectedStudent?.name ?? 'Selected student'} is loaded into the workspace.`
        : 'Choose a student from the scoped list to unlock the workspace.',
      meta: `${data.cohortSummary.totalStudents} in scope`,
      Icon: Users,
      tone: 'info' as const,
      active: hasStudent,
    },
    {
      title: 'Review signals',
      description: hasStudent
        ? `${data.automatedRecommendations.length} matches and ${
            selectedStudent?.applicationHighlights.length ?? 0
          } tracked applications are ready to review.`
        : 'Readiness, gaps, and application context appear after selection.',
      meta: hasStudent
        ? `${selectedStudent?.topSkillGaps.length ?? 0} gap${
            (selectedStudent?.topSkillGaps.length ?? 0) === 1 ? '' : 's'
          } flagged`
        : 'Awaiting context',
      Icon: Target,
      tone: 'warning' as const,
      active: hasStudent,
    },
    {
      title: 'Take action',
      description: hasStudent
        ? 'Save academic reviews and job recommendations in one place.'
        : 'The action workspace opens once a student is selected.',
      meta: `${savedReviewCount} reviews, ${savedRecommendationCount} recommendations`,
      Icon: Sparkles,
      tone: 'success' as const,
      active: hasStudent,
    },
  ];

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
          eyebrow="Teacher guidance workspace"
          title={
            selectedStudent
              ? `${selectedStudent.name} guidance workspace`
              : role === 'advisor'
                ? 'Advisor recommendation workspace'
                : 'Department recommendation workspace'
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
              {selectedStudent?.yearOfStudy ? (
                <Tag label={`Year ${selectedStudent.yearOfStudy}`} tone="warning" />
              ) : null}
            </div>
          }
          description="Move through a clean advising flow: pick a student, review readiness evidence, then record formal academic guidance and job recommendations with full context on one page."
          actions={
            <>
              <ActionLink href={directoryHref} label="Open student directory" />
              <ActionLink href={insightsHref} label="Review analytics" tone="ghost" />
            </>
          }
          aside={
            selectedStudent ? (
              <Panel
                title="Current focus"
                description="High-signal context for the active student."
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <div style={{ display: 'grid', gap: 14 }}>
                  <div>
                    <div
                      style={{ color: '#FFFFFF', fontSize: 20, fontWeight: 900, lineHeight: 1.15 }}
                    >
                      {selectedStudent.name}
                    </div>
                    <div style={{ color: '#CBD5E1', fontSize: 12, marginTop: 4 }}>
                      {selectedStudent.email}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {selectedStudent.department ? (
                      <Pill label={selectedStudent.department} tone="infoOnDark" />
                    ) : null}
                    {selectedStudent.studentId ? (
                      <Pill label={`ID ${selectedStudent.studentId}`} tone="neutralOnDark" />
                    ) : null}
                    <Pill
                      label={`${data.automatedRecommendations.length} opportunity match${
                        data.automatedRecommendations.length === 1 ? '' : 'es'
                      }`}
                      tone="successOnDark"
                    />
                  </div>

                  <div className="teacher-hero-metrics" style={{ display: 'grid', gap: 10 }}>
                    <HeroMetric
                      label="Opportunity score"
                      value={`${selectedStudent.opportunityScore}%`}
                    />
                    <HeroMetric
                      label="Profile complete"
                      value={`${selectedStudent.profileCompleteness}%`}
                    />
                    <HeroMetric label="Saved reviews" value={String(savedReviewCount)} />
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel
                title="Start with a selection"
                description="This page becomes far more useful after a student is chosen."
                style={{
                  background: 'rgba(255,255,255,0.12)',
                  border: '1px solid rgba(255,255,255,0.16)',
                }}
              >
                <div style={{ color: '#D6E4FF', fontSize: 14, lineHeight: 1.7 }}>
                  Choose a student from the focus list below to load readiness signals, saved
                  guidance, and recommendation actions.
                </div>
              </Panel>
            )
          }
        />

        <section style={{ marginTop: 18 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: 14,
            }}
            className="teacher-workflow-grid"
          >
            {workflowSteps.map((step, index) => (
              <WorkflowStepCard
                key={step.title}
                step={index + 1}
                title={step.title}
                description={step.description}
                meta={step.meta}
                Icon={step.Icon}
                tone={step.tone}
                active={step.active}
              />
            ))}
          </div>
        </section>

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
                  : '-'
              }
              hint="Across current scope"
              Icon={LayoutGrid}
              accent="#22C55E"
              showIcon={false}
            />
          </div>
        </section>

        <DashboardSection
          title="Select and assess"
          description="Start with the right student, then review the most important readiness signals before you recommend next steps."
          action={
            selectedStudent ? (
              <Pill label={`Working on ${selectedStudent.name}`} tone="info" />
            ) : undefined
          }
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '320px minmax(0, 1fr)',
              gap: 16,
              alignItems: 'start',
            }}
            className="teacher-focus-grid"
          >
            <SurfaceCard
              title={data.pickerLabel}
              description="Choose a student to load their full guidance workspace."
              bodyPadding="0"
            >
              <div
                style={{
                  padding: '14px 18px',
                  borderBottom: '1px solid #F1F5F9',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={subHeadingStyle}>Search students</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderRadius: 14,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      padding: '0 14px',
                    }}
                  >
                    <Search size={16} color="#64748B" />
                    <input
                      value={studentQuery}
                      onChange={(event) => setStudentQuery(event.target.value)}
                      placeholder="Search by name, department, or CGPA"
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        padding: '12px 0',
                        fontSize: 14,
                        color: '#0F172A',
                        background: 'transparent',
                      }}
                    />
                  </div>
                </label>
              </div>

              <details
                style={{
                  background: '#FCFDFE',
                }}
              >
                <summary
                  style={{
                    listStyle: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 14,
                    padding: '14px 18px',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                      Workspace selection
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: '#64748B' }}>
                      {filteredStudents.length === 0
                        ? 'No students match the current search.'
                        : `Search, review, and switch between ${filteredStudents.length} matching student${
                            filteredStudents.length === 1 ? '' : 's'
                          } here.`}
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <MiniChip
                      label={`${Math.min(visibleStudentOptions.length, 8)} shown`}
                      tone={filteredStudents.length > 0 ? 'success' : 'neutral'}
                    />
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 34,
                        height: 34,
                        borderRadius: 12,
                        border: '1px solid #DBEAFE',
                        background: '#EFF6FF',
                        color: '#2563EB',
                      }}
                    >
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </summary>

                <div
                  style={{
                    padding: '12px 12px 14px',
                    display: 'grid',
                    gap: 12,
                    maxHeight: 520,
                    overflowY: 'auto',
                  }}
                >
                  {selectedStudent ? (
                    <div
                      style={{
                        borderRadius: 18,
                        border: '1.5px solid #93C5FD',
                        background: 'linear-gradient(135deg, #EFF6FF, #F8FBFF)',
                        padding: '14px',
                        boxShadow: '0 10px 24px rgba(37,99,235,0.08)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          justifyContent: 'space-between',
                          gap: 10,
                        }}
                      >
                        <div style={{ minWidth: 0 }}>
                          <div
                            style={{
                              color: '#0F172A',
                              fontSize: 15,
                              fontWeight: 800,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {selectedStudent.name}
                          </div>
                          <div
                            style={{
                              color: '#94A3B8',
                              fontSize: 11,
                              marginTop: 4,
                              overflow: 'hidden',
                              textOverflow: 'ellipsis',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {selectedStudent.email}
                          </div>
                        </div>
                        <Pill
                          label={`${selectedStudent.opportunityScore}%`}
                          tone={
                            data.students.find((student) => student.id === selectedStudent.id)
                              ?.attentionLevel === 'high'
                              ? 'warning'
                              : data.students.find((student) => student.id === selectedStudent.id)
                                    ?.attentionLevel === 'medium'
                                ? 'neutral'
                                : 'success'
                          }
                        />
                      </div>

                      <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
                        {selectedStudent.department ? (
                          <MiniChip label={selectedStudent.department} />
                        ) : null}
                        {selectedStudent.currentSemester ? (
                          <MiniChip label={selectedStudent.currentSemester} />
                        ) : null}
                        {typeof selectedStudent.cgpa === 'number' ? (
                          <MiniChip label={`CGPA ${selectedStudent.cgpa.toFixed(2)}`} />
                        ) : null}
                      </div>

                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: 'minmax(0, 1fr) auto',
                          gap: 10,
                          marginTop: 12,
                        }}
                        className="teacher-student-actions"
                      >
                        <Link
                          href={`${dashboardBasePath}/${selectedStudent.id}/dashboard`}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 14,
                            border: 'none',
                            background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                            color: '#FFFFFF',
                            padding: '12px 16px',
                            fontSize: 14,
                            fontWeight: 800,
                            textDecoration: 'none',
                          }}
                        >
                          Open student dashboard
                        </Link>
                        <Link
                          href={directoryHref}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            borderRadius: 14,
                            border: '1px solid #BFDBFE',
                            background: '#FFFFFF',
                            color: '#1D4ED8',
                            padding: '12px 14px',
                            fontSize: 13,
                            fontWeight: 800,
                            textDecoration: 'none',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          Open directory
                        </Link>
                      </div>
                    </div>
                  ) : null}

                  {visibleStudentOptions.length > 0 ? (
                    visibleStudentOptions.map((student) => {
                      const isSelected = student.id === data.selectedStudentId;
                      return (
                        <Link
                          key={student.id}
                          href={`${pagePath}?studentId=${student.id}`}
                          style={{
                            textDecoration: 'none',
                            borderRadius: 16,
                            border: isSelected ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                            background: isSelected
                              ? 'linear-gradient(135deg, #EFF6FF, #F8FBFF)'
                              : '#FFFFFF',
                            padding: '13px 14px',
                            display: 'block',
                            transition: 'all 0.12s ease',
                            boxShadow: isSelected ? '0 10px 24px rgba(37,99,235,0.08)' : 'none',
                          }}
                        >
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'flex-start',
                              justifyContent: 'space-between',
                              gap: 10,
                            }}
                          >
                            <div style={{ minWidth: 0 }}>
                              <div
                                style={{
                                  color: '#0F172A',
                                  fontSize: 14,
                                  fontWeight: 800,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {student.name}
                              </div>
                              <div
                                style={{
                                  color: '#94A3B8',
                                  fontSize: 11,
                                  marginTop: 3,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
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

                          <div style={{ display: 'flex', gap: 5, flexWrap: 'wrap', marginTop: 10 }}>
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
                    })
                  ) : data.students.length > 0 ? (
                    <div style={{ padding: '18px 10px' }}>
                      <EmptyState
                        title={selectedStudent ? 'No other students found' : 'No students found'}
                        description={
                          selectedStudent
                            ? 'Try a different student name, department, or CGPA search to switch focus.'
                            : 'Try a different student name, department, or CGPA search.'
                        }
                      />
                    </div>
                  ) : (
                    <div style={{ padding: '24px 12px' }}>
                      <EmptyState
                        title="No students in scope"
                        description="Students will appear here after they match your institution and department scope."
                      />
                    </div>
                  )}
                </div>
              </details>
            </SurfaceCard>

            {selectedStudent ? (
              <div style={{ display: 'grid', gap: 16 }}>
                <SurfaceCard
                  title="Student snapshot"
                  description="A concise profile summary for faster recommendation decisions."
                  action={
                    <Link
                      href={`${dashboardBasePath}/${selectedStudent.id}/dashboard`}
                      style={secondaryLinkStyle}
                    >
                      Open dashboard <ArrowRight size={14} />
                    </Link>
                  }
                >
                  <div style={{ display: 'grid', gap: 18 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 14,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: 22,
                            fontWeight: 900,
                            color: '#0F172A',
                            fontFamily: 'var(--font-display)',
                            letterSpacing: '-0.03em',
                          }}
                        >
                          {selectedStudent.name}
                        </div>
                        <div style={{ marginTop: 5, fontSize: 13, color: '#64748B' }}>
                          {selectedStudent.email}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                        {selectedStudent.department ? (
                          <MiniChip label={selectedStudent.department} tone="success" />
                        ) : null}
                        {selectedStudent.yearOfStudy ? (
                          <MiniChip label={`Year ${selectedStudent.yearOfStudy}`} />
                        ) : null}
                        {selectedStudent.studentId ? (
                          <MiniChip label={`ID ${selectedStudent.studentId}`} />
                        ) : null}
                      </div>
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
                        gap: 12,
                      }}
                      className="teacher-metric-strip"
                    >
                      <SnapshotMetric
                        label="Opportunity"
                        value={`${selectedStudent.opportunityScore}%`}
                        tone="info"
                      />
                      <SnapshotMetric
                        label="Profile"
                        value={`${selectedStudent.profileCompleteness}%`}
                        tone="success"
                      />
                      <SnapshotMetric
                        label="CGPA"
                        value={
                          typeof selectedStudent.cgpa === 'number'
                            ? selectedStudent.cgpa.toFixed(2)
                            : 'Not set'
                        }
                        tone="neutral"
                      />
                      <SnapshotMetric
                        label="Guidance saved"
                        value={`${savedReviewCount + savedRecommendationCount}`}
                        tone="warning"
                      />
                    </div>

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
                        gap: 16,
                      }}
                      className="teacher-readiness-grid"
                    >
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
                        {selectedStudent.department ? (
                          <MetricLine label="Department" value={selectedStudent.department} />
                        ) : null}
                        {selectedStudent.currentSemester ? (
                          <MetricLine
                            label="Current semester"
                            value={selectedStudent.currentSemester}
                          />
                        ) : null}
                      </div>

                      <div
                        style={{
                          borderRadius: 18,
                          border: '1px solid #E2E8F0',
                          background:
                            'linear-gradient(180deg, rgba(248,250,252,0.9), rgba(255,255,255,1))',
                          padding: 16,
                        }}
                      >
                        <div style={subHeadingStyle}>Recommendation posture</div>
                        <p
                          style={{
                            margin: '10px 0 0',
                            fontSize: 14,
                            lineHeight: 1.7,
                            color: '#475569',
                          }}
                        >
                          {selectedStudent.opportunityScore >= 75
                            ? 'This student is positioned for active placement conversations. Focus on specific opportunities and stronger employer-facing justification.'
                            : selectedStudent.opportunityScore >= 50
                              ? 'This student is developing well. Balance targeted opportunity matching with practical growth steps to improve readiness.'
                              : 'This student needs higher-touch support. Use the evidence below to prioritize the most important gaps before pushing high-stakes recommendations.'}
                        </p>
                      </div>
                    </div>
                  </div>
                </SurfaceCard>

                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(0, 0.82fr) minmax(0, 1.18fr)',
                    gap: 16,
                  }}
                  className="teacher-snapshot-grid"
                >
                  <div style={{ display: 'grid', gap: 16 }}>
                    <SurfaceCard
                      title="Current strengths"
                      description="Profile assets worth reinforcing in recommendations."
                      bodyPadding="18px"
                    >
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {selectedStudent.skills.length > 0 ? (
                          selectedStudent.skills
                            .slice(0, 8)
                            .map((skill) => <MiniChip key={skill} label={skill} tone="success" />)
                        ) : (
                          <MiniText text="No skills saved on this profile yet." />
                        )}
                      </div>
                    </SurfaceCard>

                    <SurfaceCard
                      title="Top skill gaps"
                      description="Signals currently holding this student back."
                      bodyPadding="18px"
                    >
                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                        {selectedStudent.topSkillGaps.length > 0 ? (
                          selectedStudent.topSkillGaps.map((gap) => (
                            <MiniChip key={gap} label={gap} tone="warning" />
                          ))
                        ) : (
                          <MiniText text="No hard gaps recorded yet." />
                        )}
                      </div>
                    </SurfaceCard>
                  </div>

                  <SurfaceCard
                    title="Recommended coaching direction"
                    description="High-value themes derived from the workspace data."
                    bodyPadding="20px"
                  >
                    <div style={{ display: 'grid', gap: 12 }}>
                      {coachingPlaybook.length > 0 ? (
                        coachingPlaybook
                          .slice(0, 3)
                          .map((item) => (
                            <CoachingPlayCard key={`${item.category}:${item.title}`} item={item} />
                          ))
                      ) : (
                        <MiniText text="Coaching cues will appear as student signals accumulate." />
                      )}
                    </div>
                  </SurfaceCard>
                </div>
              </div>
            ) : (
              <div
                style={{
                  background: '#FAFBFC',
                  borderRadius: 24,
                  border: '1.5px dashed #D9E2EC',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minHeight: 360,
                }}
              >
                <EmptyState
                  title="No student context yet"
                  description="Select a student from the list to load readiness signals, saved guidance, and recommended next steps."
                />
              </div>
            )}
          </div>
        </DashboardSection>

        <DashboardSection
          title="Opportunity search"
          description="Search the recommendation pool by company, position, skills, and other fit cues without expanding a long scrolling feed."
          action={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Pill
                label={`${filteredRecommendations.length} result${filteredRecommendations.length === 1 ? '' : 's'}`}
                tone="success"
              />
              <Pill
                label={`${data.automatedRecommendations.length} total matches`}
                tone="neutral"
              />
            </div>
          }
        >
          <SurfaceCard
            title="Search recommendation pool"
            description="Filter by company, role title, category, skills, rationale, and other recommendation signals."
          >
            <div style={{ display: 'grid', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'minmax(0, 1.4fr) minmax(180px, 0.4fr) minmax(180px, 0.4fr)',
                  gap: 12,
                }}
                className="teacher-search-grid"
              >
                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={subHeadingStyle}>Search opportunities</span>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      borderRadius: 16,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      padding: '0 14px',
                      boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.7)',
                    }}
                  >
                    <Search size={17} color="#64748B" />
                    <input
                      value={opportunityQuery}
                      onChange={(event) => setOpportunityQuery(event.target.value)}
                      placeholder="Search by company, position, skill, rationale, deadline, or fit cue"
                      style={{
                        width: '100%',
                        border: 'none',
                        outline: 'none',
                        padding: '13px 0',
                        fontSize: 14,
                        color: '#0F172A',
                        background: 'transparent',
                      }}
                    />
                  </div>
                </label>

                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={subHeadingStyle}>Category</span>
                  <select
                    value={opportunityCategory}
                    onChange={(event) => setOpportunityCategory(event.target.value)}
                    style={searchSelectStyle}
                  >
                    <option value="all">All categories</option>
                    {opportunityCategories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                  </select>
                </label>

                <label style={{ display: 'grid', gap: 8 }}>
                  <span style={subHeadingStyle}>Priority</span>
                  <select
                    value={opportunityPriority}
                    onChange={(event) =>
                      setOpportunityPriority(
                        event.target.value as 'all' | 'high' | 'medium' | 'low'
                      )
                    }
                    style={searchSelectStyle}
                  >
                    <option value="all">All priorities</option>
                    <option value="high">High priority</option>
                    <option value="medium">Medium priority</option>
                    <option value="low">Low priority</option>
                  </select>
                </label>
              </div>

              {opportunitySearchCues.length > 0 ? (
                <div style={{ display: 'grid', gap: 10 }}>
                  <div style={subHeadingStyle}>Quick search cues</div>
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {opportunitySearchCues.map((cue) => (
                      <button
                        key={cue}
                        type="button"
                        onClick={() => setOpportunityQuery(cue)}
                        style={{
                          borderRadius: 999,
                          border: '1px solid #DBEAFE',
                          background: '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '7px 12px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        {cue}
                      </button>
                    ))}
                  </div>
                </div>
              ) : null}

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                  padding: '14px 16px',
                  borderRadius: 16,
                  border: '1px solid #E2E8F0',
                  background: 'linear-gradient(180deg, #FBFDFF, #F8FAFC)',
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
                    Search results ready
                  </div>
                  <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: '#64748B' }}>
                    {filteredRecommendations.length === 0
                      ? 'No opportunities match the current search and filters.'
                      : `${filteredRecommendations.length} opportunities match the current search.`}
                  </div>
                </div>
                {(opportunityQuery ||
                  opportunityCategory !== 'all' ||
                  opportunityPriority !== 'all') && (
                  <button
                    type="button"
                    onClick={() => {
                      setOpportunityQuery('');
                      setOpportunityCategory('all');
                      setOpportunityPriority('all');
                    }}
                    style={{
                      borderRadius: 12,
                      border: '1px solid #CBD5E1',
                      background: '#FFFFFF',
                      color: '#334155',
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>

              <details
                style={{
                  borderRadius: 18,
                  border: '1px solid #D9E2EC',
                  background: '#FFFFFF',
                  overflow: 'hidden',
                  boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
                }}
              >
                <summary
                  style={{
                    listStyle: 'none',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 16,
                    padding: '16px 18px',
                    background: 'linear-gradient(180deg, #FCFDFF, #F8FAFC)',
                  }}
                >
                  <div>
                    <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                      Job view list
                    </div>
                    <div style={{ marginTop: 4, fontSize: 12, lineHeight: 1.6, color: '#64748B' }}>
                      Expand only when you want to browse the matching opportunities.
                    </div>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <MiniChip
                      label={`${visibleRecommendations.length} shown`}
                      tone={visibleRecommendations.length > 0 ? 'success' : 'neutral'}
                    />
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 36,
                        height: 36,
                        borderRadius: 12,
                        border: '1px solid #DBEAFE',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDown size={16} />
                    </span>
                  </div>
                </summary>

                <div
                  style={{
                    borderTop: '1px solid #E2E8F0',
                    padding: '16px 16px 18px',
                    background: '#F8FAFC',
                  }}
                >
                  <div
                    style={{
                      display: 'grid',
                      gap: 12,
                      maxHeight: 820,
                      overflowY: 'auto',
                      paddingRight: 4,
                    }}
                  >
                    {visibleRecommendations.length > 0 ? (
                      visibleRecommendations.map((rec) => (
                        <div
                          key={rec.id}
                          style={{
                            borderRadius: 18,
                            border: '1px solid #E2E8F0',
                            background: '#FFFFFF',
                            padding: '16px 18px',
                            boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
                          }}
                        >
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
                                style={{
                                  display: 'flex',
                                  gap: 6,
                                  flexWrap: 'wrap',
                                  marginBottom: 8,
                                }}
                              >
                                <Pill label={rec.category.replace(/_/g, ' ')} tone="info" />
                                <Pill label={`${rec.fitScore}% fit`} tone="success" />
                                <Pill label={rec.priority} tone="warning" />
                              </div>
                              <div
                                style={{
                                  fontSize: 17,
                                  fontWeight: 800,
                                  color: '#0F172A',
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                {rec.title}
                              </div>
                              <div style={{ fontSize: 12, color: '#64748B', marginTop: 4 }}>
                                {rec.organizationName}
                                {rec.dateLabel ? ` - ${rec.dateLabel}` : ''}
                              </div>
                            </div>

                            {rec.href ? (
                              <Link href={rec.href} style={secondaryLinkStyle}>
                                View match <ArrowRight size={14} />
                              </Link>
                            ) : null}
                          </div>

                          <p
                            style={{
                              margin: '0 0 14px',
                              fontSize: 13,
                              lineHeight: 1.7,
                              color: '#475569',
                            }}
                          >
                            {rec.rationale}
                          </p>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr 1fr',
                              gap: 10,
                            }}
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
                    ) : (
                      <EmptyState
                        title="No matching opportunities"
                        description="Try a different company name, position title, category, skill, or priority filter."
                      />
                    )}
                  </div>

                  {filteredRecommendations.length > visibleRecommendations.length ? (
                    <div
                      style={{
                        marginTop: 12,
                        borderRadius: 14,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        padding: '12px 14px',
                        fontSize: 12,
                        lineHeight: 1.6,
                        color: '#64748B',
                      }}
                    >
                      Refine the search to narrow further.{' '}
                      {filteredRecommendations.length - visibleRecommendations.length} more
                      opportunities are available beyond the visible set.
                    </div>
                  ) : null}
                </div>
              </details>
            </div>
          </SurfaceCard>
        </DashboardSection>

        <DashboardSection
          title="Guidance actions"
          description="Capture formal profile feedback and job-specific recommendations in a dedicated action area."
          action={
            selectedStudent ? (
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Pill label={`${savedReviewCount} academic reviews`} tone="info" />
                <Pill label={`${savedRecommendationCount} job recommendations`} tone="warning" />
              </div>
            ) : undefined
          }
        >
          {selectedStudent ? (
            <div style={{ display: 'grid', gap: 16 }}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 14,
                }}
                className="teacher-action-highlights"
              >
                <ActionHighlightCard
                  title="Academic review"
                  description="Save structured strengths, growth areas, and readiness comments."
                  meta={`${savedReviewCount} saved`}
                  Icon={BookOpen}
                  tone="info"
                />
                <ActionHighlightCard
                  title="Job recommendation"
                  description="Recommend a platform job with fit context and rationale."
                  meta={`${savedRecommendationCount} saved`}
                  Icon={Sparkles}
                  tone="success"
                />
                <ActionHighlightCard
                  title="Student dashboard preview"
                  description="Open the student-facing dashboard to verify how guidance appears."
                  meta="Preview available"
                  Icon={CheckCircle2}
                  tone="warning"
                />
              </div>

              <CollapsibleWorkspaceCard
                title="Academic review"
                description="Capture an overall profile assessment with clear strengths, growth areas, and readiness context."
                badge={`${savedReviewCount} saved`}
                open
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
                badge={`${savedRecommendationCount} saved`}
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
                borderRadius: 24,
                border: '1.5px dashed #D9E2EC',
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

        {role === 'advisor' && (
          <DashboardSection
            title="Cohort coaching signals"
            description="Use recurring patterns across your advisees to guide where coaching time matters most."
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
              <SurfaceCard
                title="Repeated skill gaps"
                description="Most common hard-skill gaps across advisee activity."
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
              </SurfaceCard>

              <SurfaceCard
                title="Recent advising actions"
                description="Most recent manual interventions saved for students in your scope."
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
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
                      description="Saved recommendations and plan changes will appear here."
                    />
                  )}
                </div>
              </SurfaceCard>
            </div>
          </DashboardSection>
        )}

        {role === 'dept_head' && (
          <DashboardSection
            title="Department readiness insights"
            description="Connect individual recommendations with department-wide readiness and industry alignment."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
              className="teacher-opportunity-insights"
            >
              <SurfaceCard
                title="Readiness distribution"
                description="Department-level readiness segmentation."
              >
                <div style={{ display: 'grid', gap: 10 }}>
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
              </SurfaceCard>

              <SurfaceCard
                title="Industry alignment"
                description="Skills currently demanded by relevant openings."
              >
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {data.departmentInsights?.industryAlignment?.length ? (
                    data.departmentInsights.industryAlignment.slice(0, 6).map((item) => (
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
                            Demand {item.demandPct}% - Supply {item.supplyPct}%
                          </div>
                        </div>
                        <Pill
                          label={item.gap ? 'Gap' : 'Balanced'}
                          tone={item.gap ? 'warning' : 'success'}
                        />
                      </div>
                    ))
                  ) : (
                    <MiniText text="No alignment data available yet." />
                  )}
                </div>
              </SurfaceCard>

              <SurfaceCard
                title="Skill heatmap"
                description="Most represented skills across the cohort."
              >
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.departmentInsights?.skillHeatmap?.length ? (
                    data.departmentInsights.skillHeatmap
                      .slice(0, 10)
                      .map((item) => (
                        <MiniChip
                          key={item.skill}
                          label={`${item.skill} - ${item.pct}%`}
                          tone="success"
                        />
                      ))
                  ) : (
                    <MiniText text="No skill heatmap available yet." />
                  )}
                </div>
              </SurfaceCard>
            </div>
          </DashboardSection>
        )}

        <style>{`
          @media (max-width: 1180px) {
            .teacher-opportunity-grid,
            .teacher-opportunity-insights,
            .teacher-focus-grid,
            .teacher-signal-grid,
            .teacher-workflow-grid,
            .teacher-snapshot-grid,
            .teacher-action-highlights,
            .teacher-search-grid {
              grid-template-columns: 1fr !important;
            }
          }

          @media (max-width: 980px) {
            .teacher-stats-grid,
            .teacher-metric-strip,
            .teacher-readiness-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 720px) {
            .teacher-stats-grid,
            .teacher-metric-strip,
            .teacher-readiness-grid,
            .teacher-hero-metrics,
            .teacher-student-actions {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}

function WorkflowStepCard({
  step,
  title,
  description,
  meta,
  Icon,
  tone,
  active,
}: {
  step: number;
  title: string;
  description: string;
  meta: string;
  Icon: typeof Users;
  tone: 'info' | 'warning' | 'success';
  active: boolean;
}) {
  const palette =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };

  return (
    <div
      style={{
        borderRadius: 22,
        border: active ? `1px solid ${palette.border}` : '1px solid #E2E8F0',
        background: active
          ? `linear-gradient(180deg, ${palette.bg}, #FFFFFF)`
          : 'linear-gradient(180deg, #FFFFFF, #F8FAFC)',
        padding: 18,
        boxShadow: active ? '0 16px 28px rgba(15,23,42,0.06)' : '0 8px 18px rgba(15,23,42,0.04)',
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
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 44,
            height: 44,
            borderRadius: 14,
            background: palette.bg,
            border: `1px solid ${palette.border}`,
            color: palette.color,
          }}
        >
          <Icon size={20} />
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 800,
            color: active ? palette.color : '#94A3B8',
            textTransform: 'uppercase',
            letterSpacing: 0.8,
          }}
        >
          Step {step}
        </span>
      </div>

      <div style={{ marginTop: 14, fontSize: 17, fontWeight: 800, color: '#0F172A' }}>{title}</div>
      <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.7, color: '#64748B' }}>
        {description}
      </p>
      <div style={{ marginTop: 14 }}>
        <MiniChip
          label={meta}
          tone={tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'neutral'}
        />
      </div>
    </div>
  );
}

function SurfaceCard({
  title,
  description,
  action,
  children,
  footer,
  bodyPadding = '18px 20px',
}: {
  title: string;
  description: string;
  action?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  bodyPadding?: string;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 22,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 16px 30px rgba(15,23,42,0.05)',
      }}
    >
      <div
        style={{
          padding: '16px 20px',
          borderBottom: '1px solid #F1F5F9',
          background: 'linear-gradient(180deg, #FBFDFF, #F8FAFC)',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div>
          <div style={{ fontSize: 14, fontWeight: 800, color: '#0F172A' }}>{title}</div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 3, lineHeight: 1.6 }}>
            {description}
          </div>
        </div>
        {action ? <div>{action}</div> : null}
      </div>
      <div style={{ padding: bodyPadding }}>{children}</div>
      {footer}
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '10px 12px',
        borderRadius: 14,
        border: '1px solid rgba(255,255,255,0.12)',
        background: 'rgba(255,255,255,0.08)',
      }}
    >
      <span style={{ fontSize: 12, color: '#CBD5E1', fontWeight: 600 }}>{label}</span>
      <span style={{ fontSize: 14, color: '#FFFFFF', fontWeight: 800 }}>{value}</span>
    </div>
  );
}

function SnapshotMetric({
  label,
  value,
  tone,
}: {
  label: string;
  value: string;
  tone: 'info' | 'success' | 'warning' | 'neutral';
}) {
  const palette =
    tone === 'info'
      ? { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' }
      : tone === 'success'
        ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
        : tone === 'warning'
          ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
          : { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' };

  return (
    <div
      style={{
        borderRadius: 16,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        padding: '14px 15px',
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#64748B',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </div>
      <div style={{ marginTop: 8, fontSize: 20, fontWeight: 900, color: palette.color }}>
        {value}
      </div>
    </div>
  );
}

function ActionHighlightCard({
  title,
  description,
  meta,
  Icon,
  tone,
}: {
  title: string;
  description: string;
  meta: string;
  Icon: typeof BookOpen;
  tone: 'info' | 'success' | 'warning';
}) {
  const palette =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };

  return (
    <div
      style={{
        borderRadius: 18,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        padding: 18,
        boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
      }}
    >
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: 14,
          background: palette.bg,
          border: `1px solid ${palette.border}`,
          color: palette.color,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ marginTop: 14, fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{title}</div>
      <p style={{ margin: '8px 0 0', fontSize: 13, lineHeight: 1.7, color: '#64748B' }}>
        {description}
      </p>
      <div style={{ marginTop: 12 }}>
        <MiniChip
          label={meta}
          tone={tone === 'warning' ? 'warning' : tone === 'success' ? 'success' : 'neutral'}
        />
      </div>
    </div>
  );
}

function CoachingPlayCard({
  item,
  compact = false,
}: {
  item: WorkspaceLearningAction;
  compact?: boolean;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        padding: compact ? '12px 13px' : '14px 15px',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 10,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <Pill label={item.category.replace(/_/g, ' ')} tone="info" />
          <Pill
            label={item.priority}
            tone={
              item.priority === 'high'
                ? 'warning'
                : item.priority === 'medium'
                  ? 'neutral'
                  : 'success'
            }
          />
        </div>
      </div>
      <div style={{ marginTop: 10, fontSize: 14, fontWeight: 800, color: '#0F172A' }}>
        {item.title}
      </div>
      <p
        style={{
          margin: '8px 0 0',
          fontSize: 12,
          lineHeight: 1.7,
          color: '#64748B',
        }}
      >
        {item.description}
      </p>
      {item.focus.length > 0 ? (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 10 }}>
          {item.focus.map((focus) => (
            <MiniChip key={`${item.title}:${focus}`} label={focus} />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function CollapsibleWorkspaceCard({
  title,
  description,
  badge,
  children,
  open = false,
}: {
  title: string;
  description: string;
  badge?: string;
  children: ReactNode;
  open?: boolean;
}) {
  return (
    <details
      open={open}
      style={{
        borderRadius: 22,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        boxShadow: '0 16px 30px rgba(15,23,42,0.05)',
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
          background: 'linear-gradient(180deg, #FBFDFF, #F8FAFC)',
        }}
      >
        <div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <div style={{ fontSize: 16, fontWeight: 800, color: '#0F172A' }}>{title}</div>
            {badge ? <MiniChip label={badge} tone="success" /> : null}
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 4, lineHeight: 1.55 }}>
            {description}
          </div>
        </div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 36,
            height: 36,
            borderRadius: 12,
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
        borderRadius: 16,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        padding: '13px 14px',
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

function getUniqueValues(values: string[]) {
  return [...new Set(values.filter(Boolean))];
}

function getOpportunitySearchCues(
  data: TeacherRecommendationWorkspaceData['automatedRecommendations']
) {
  const cues = [
    ...data.map((recommendation) => recommendation.organizationName),
    ...data.map((recommendation) => recommendation.title),
    ...data.flatMap((recommendation) => recommendation.matchedSignals.slice(0, 2)),
    ...data.flatMap((recommendation) => recommendation.missingSignals.slice(0, 1)),
  ];

  return getUniqueValues(cues).slice(0, 16);
}

const subHeadingStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  color: '#94A3B8',
  textTransform: 'uppercase',
  letterSpacing: 0.8,
};

const secondaryLinkStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 6,
  textDecoration: 'none',
  borderRadius: 12,
  border: '1px solid #BFDBFE',
  background: '#EFF6FF',
  color: '#1D4ED8',
  padding: '8px 12px',
  fontSize: 12,
  fontWeight: 700,
};

const searchSelectStyle: CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  borderRadius: 16,
  border: '1px solid #CBD5E1',
  padding: '13px 14px',
  fontSize: 14,
  color: '#0F172A',
  background: '#FFFFFF',
  outline: 'none',
};
