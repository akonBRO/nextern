// src/app/dept/report/page.tsx
// Strategic Career Readiness Report — printable/exportable overview for dept head

import Link from 'next/link';
import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  ActionLink,
  Panel,
  ProgressBar,
  StatCard,
  Tag,
  formatCompactNumber,
} from '@/components/dashboard/DashboardContent';
import { getDeptDashboardData } from '@/lib/role-dashboard';
import { BriefcaseBusiness, Target, Users, FileText, Sparkles } from 'lucide-react';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

export default async function DeptReportPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getDeptDashboardData({
    userId: session.user.id,
    email: session.user.email ?? undefined,
  });

  const { readinessDistribution, skillHeatmap, industryAlignment, semesterTrend } = data;
  const benchmark = data.department.benchmark;
  const today = new Date().toLocaleDateString('en-BD', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Benchmark compliance check
  const belowBenchmark = benchmark
    ? data.stats.avgOpportunityScore < benchmark.minReadinessScore ||
      data.stats.avgCGPA < benchmark.minCGPA
    : false;

  // Top skill gaps (skills with high demand but low supply)
  const criticalGaps = industryAlignment
    .filter((item) => item.gap && item.demandPct > 30)
    .slice(0, 5);

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={data.chromeUser}
    >
      <DashboardPage>
        {/* ── Hero ── */}
        <HeroCard
          eyebrow="Strategic Report"
          title="Career Readiness Report"
          subtitle={
            <span style={{ color: '#9FB4D0', fontSize: 13 }}>
              {[data.department.advisoryDepartment, data.department.institutionName]
                .filter(Boolean)
                .join(' · ')}
            </span>
          }
          description={`Generated on ${today}. This report summarises cohort readiness, skill coverage, industry alignment, and hiring pipeline for curriculum review and accreditation documentation.`}
          actions={
            <>
              <ActionLink href="/dept/dashboard" label="← Back to Dashboard" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Report summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Dept students', value: data.stats.deptStudents, color: '#22D3EE' },
                  {
                    label: 'Avg score',
                    value: `${data.stats.avgOpportunityScore}%`,
                    color: data.stats.avgOpportunityScore >= 70 ? '#10B981' : '#F59E0B',
                  },
                  { label: 'Hired', value: data.stats.hiredStudents, color: '#10B981' },
                  {
                    label: 'Avg CGPA',
                    value: data.stats.avgCGPA ? data.stats.avgCGPA.toFixed(2) : '—',
                    color: '#A78BFA',
                  },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 10,
                      padding: '10px 12px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 20,
                        fontWeight: 900,
                        color: s.color,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ fontSize: 11, color: '#9FB4D0', marginTop: 4, fontWeight: 600 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          }
        />

        {/* ── Benchmark alert ── */}
        {benchmark && belowBenchmark && (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 16,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'flex-start',
              gap: 14,
              marginTop: 8,
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 10,
                background: '#FEE2E2',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#EF4444',
                flexShrink: 0,
              }}
            >
              ⚠️
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 800, color: '#991B1B', marginBottom: 4 }}>
                Cohort below benchmark threshold
              </div>
              <div style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.6 }}>
                {data.stats.avgOpportunityScore < benchmark.minReadinessScore && (
                  <span>
                    Average opportunity score ({data.stats.avgOpportunityScore}%) is below the
                    minimum threshold of {benchmark.minReadinessScore}%.{' '}
                  </span>
                )}
                {data.stats.avgCGPA < benchmark.minCGPA && (
                  <span>
                    Average CGPA ({data.stats.avgCGPA?.toFixed(2)}) is below the minimum of{' '}
                    {benchmark.minCGPA.toFixed(2)}.
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── Key metrics ── */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Total students"
              value={formatCompactNumber(data.stats.totalStudents)}
              Icon={Users}
            />
            <StatCard
              label="Applications submitted"
              value={formatCompactNumber(data.stats.totalApplications)}
              Icon={BriefcaseBusiness}
              accent="#22D3EE"
            />
            <StatCard
              label="Students hired"
              value={formatCompactNumber(data.stats.hiredStudents)}
              Icon={Sparkles}
              accent="#10B981"
            />
            <StatCard
              label="Active openings"
              value={formatCompactNumber(data.stats.activeOpenings)}
              Icon={Target}
              accent="#F59E0B"
            />
          </div>
        </section>

        {/* ── Section 1: Readiness overview ── */}
        <DashboardSection
          id="readiness"
          title="1. Cohort Readiness Overview"
          description="Distribution of students across readiness tiers based on opportunity scores at the time of this report."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel title="Readiness tiers" description="Percentage of students in each tier.">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {[
                  {
                    label: 'Ready',
                    sublabel: 'Score ≥ 70',
                    count: readinessDistribution.ready.count,
                    pct: readinessDistribution.ready.pct,
                    color: '#10B981',
                    bg: '#ECFDF5',
                    border: '#A7F3D0',
                  },
                  {
                    label: 'Partially Ready',
                    sublabel: 'Score 40–69',
                    count: readinessDistribution.partial.count,
                    pct: readinessDistribution.partial.pct,
                    color: '#F59E0B',
                    bg: '#FFFBEB',
                    border: '#FDE68A',
                  },
                  {
                    label: 'Not Ready',
                    sublabel: 'Score < 40',
                    count: readinessDistribution.notReady.count,
                    pct: readinessDistribution.notReady.pct,
                    color: '#EF4444',
                    bg: '#FEF2F2',
                    border: '#FECACA',
                  },
                ].map((tier) => (
                  <div key={tier.label}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span
                          style={{
                            background: tier.bg,
                            color: tier.color,
                            border: `1px solid ${tier.border}`,
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {tier.label}
                        </span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>{tier.sublabel}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontSize: 14, fontWeight: 800, color: tier.color }}>
                          {tier.pct}%
                        </span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          ({tier.count} students)
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: '#F1F5F9',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${tier.pct}%`,
                          height: '100%',
                          background: tier.color,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                ))}

                {/* Combined bar */}
                <div style={{ marginTop: 4 }}>
                  <div
                    style={{ height: 16, borderRadius: 999, overflow: 'hidden', display: 'flex' }}
                  >
                    <div
                      style={{
                        width: `${readinessDistribution.ready.pct}%`,
                        background: '#10B981',
                      }}
                    />
                    <div
                      style={{
                        width: `${readinessDistribution.partial.pct}%`,
                        background: '#F59E0B',
                      }}
                    />
                    <div
                      style={{
                        width: `${readinessDistribution.notReady.pct}%`,
                        background: '#EF4444',
                      }}
                    />
                  </div>
                </div>
              </div>
            </Panel>

            {/* Benchmark comparison */}
            <Panel
              title="Benchmark comparison"
              description={
                benchmark
                  ? `Active benchmark: ${benchmark.cohort}`
                  : 'No benchmark set for this cohort.'
              }
            >
              {benchmark ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                  {/* Readiness score vs benchmark */}
                  <div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                        Avg Opportunity Score
                      </span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color:
                              data.stats.avgOpportunityScore >= benchmark.minReadinessScore
                                ? '#10B981'
                                : '#EF4444',
                          }}
                        >
                          {data.stats.avgOpportunityScore}%
                        </span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          / min {benchmark.minReadinessScore}%
                        </span>
                      </div>
                    </div>
                    <ProgressBar
                      value={data.stats.avgOpportunityScore}
                      label=""
                      tone={
                        data.stats.avgOpportunityScore >= benchmark.minReadinessScore
                          ? 'success'
                          : 'warning'
                      }
                    />
                  </div>
                  {/* CGPA vs benchmark */}
                  <div>
                    <div
                      style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                        Avg CGPA
                      </span>
                      <div style={{ display: 'flex', gap: 10 }}>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color:
                              (data.stats.avgCGPA ?? 0) >= benchmark.minCGPA
                                ? '#10B981'
                                : '#EF4444',
                          }}
                        >
                          {data.stats.avgCGPA ? data.stats.avgCGPA.toFixed(2) : '—'}
                        </span>
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          / min {benchmark.minCGPA.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 10,
                        background: '#F1F5F9',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${Math.min(((data.stats.avgCGPA ?? 0) / 4) * 100, 100)}%`,
                          height: '100%',
                          background:
                            (data.stats.avgCGPA ?? 0) >= benchmark.minCGPA ? '#10B981' : '#EF4444',
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                  {/* Overall status */}
                  <div
                    style={{
                      background: belowBenchmark ? '#FEF2F2' : '#ECFDF5',
                      border: `1px solid ${belowBenchmark ? '#FECACA' : '#A7F3D0'}`,
                      borderRadius: 12,
                      padding: '12px 16px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: belowBenchmark ? '#991B1B' : '#065F46',
                      }}
                    >
                      {belowBenchmark ? '⚠ Below benchmark' : '✓ Meeting benchmark'}
                    </div>
                    <div
                      style={{
                        fontSize: 12,
                        color: belowBenchmark ? '#B91C1C' : '#16A34A',
                        marginTop: 4,
                      }}
                    >
                      {belowBenchmark ? 'Intervention recommended' : 'Cohort is on track'}
                    </div>
                  </div>
                </div>
              ) : (
                <EmptyState
                  title="No benchmark configured"
                  description="Set a benchmark in the dashboard to enable comparison tracking in this report."
                />
              )}
            </Panel>
          </div>
        </DashboardSection>

        {/* ── Section 2: Hiring pipeline ── */}
        <DashboardSection
          id="pipeline"
          title="2. Hiring Pipeline"
          description="Aggregate application movement across all students in the department cohort."
        >
          <Panel
            title="Application funnel"
            description="How far students progressed through the hiring process."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 14 }}
              className="dashboard-stats-grid"
            >
              {data.pipeline.map((stage) => (
                <div
                  key={stage.label}
                  style={{
                    padding: '20px',
                    borderRadius: 16,
                    border: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 32,
                      fontWeight: 900,
                      color: '#2563EB',
                      fontFamily: 'var(--font-display)',
                      lineHeight: 1,
                    }}
                  >
                    {formatCompactNumber(stage.count)}
                  </div>
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginTop: 8 }}>
                    {stage.label}
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        </DashboardSection>

        {/* ── Section 3: Skill coverage ── */}
        <DashboardSection
          id="skills"
          title="3. Departmental Skill Coverage"
          description="Most commonly held skills across department students — indicates the collective technical strength of the cohort."
        >
          <Panel title="Skill heatmap" description="Sorted by student coverage percentage.">
            {skillHeatmap.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {skillHeatmap.map((item, i) => (
                  <div key={item.skill}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        marginBottom: 5,
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div
                          style={{
                            width: 22,
                            height: 22,
                            borderRadius: 6,
                            background: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 10,
                            fontWeight: 800,
                          }}
                        >
                          {i + 1}
                        </div>
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                          {item.skill}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <span style={{ fontSize: 12, color: '#64748B' }}>
                          {item.count} students
                        </span>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: 800,
                            color:
                              item.pct >= 60 ? '#10B981' : item.pct >= 30 ? '#F59E0B' : '#94A3B8',
                          }}
                        >
                          {item.pct}%
                        </span>
                      </div>
                    </div>
                    <div
                      style={{
                        height: 8,
                        background: '#F1F5F9',
                        borderRadius: 999,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          width: `${item.pct}%`,
                          height: '100%',
                          borderRadius: 999,
                          background:
                            item.pct >= 60
                              ? 'linear-gradient(90deg, #10B981, #34D399)'
                              : item.pct >= 30
                                ? 'linear-gradient(90deg, #F59E0B, #FBBF24)'
                                : 'linear-gradient(90deg, #94A3B8, #CBD5E1)',
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No skill data available"
                description="Students need to add skills to their profiles for this section to populate."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Section 4: Industry alignment ── */}
        <DashboardSection
          id="alignment"
          title="4. Industry Demand Alignment"
          description="Gaps between what employers require and what the student cohort currently has — critical for curriculum planning."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            {/* Critical gaps */}
            <Panel
              title="Critical skill gaps"
              description="High-demand skills where student coverage is significantly below employer requirements."
              action={
                <Tag
                  label={`${criticalGaps.length} critical`}
                  tone={criticalGaps.length > 0 ? 'warning' : 'success'}
                />
              }
            >
              {criticalGaps.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {criticalGaps.map((item) => (
                    <div
                      key={item.skill}
                      style={{
                        padding: '14px 16px',
                        borderRadius: 14,
                        background: '#FEF2F2',
                        border: '1px solid #FECACA',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          marginBottom: 10,
                        }}
                      >
                        <span style={{ fontSize: 14, fontWeight: 700, color: '#991B1B' }}>
                          {item.skill}
                        </span>
                        <span
                          style={{
                            background: '#FECACA',
                            color: '#991B1B',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 700,
                          }}
                        >
                          Gap
                        </span>
                      </div>
                      <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
                        <span style={{ color: '#2563EB', fontWeight: 700 }}>
                          Student supply: {item.supplyPct}%
                        </span>
                        <span style={{ color: '#7C3AED', fontWeight: 700 }}>
                          Employer demand: {item.demandPct}%
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div
                  style={{
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                    borderRadius: 14,
                    padding: '16px',
                    textAlign: 'center',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>
                    ✓ No critical gaps detected
                  </div>
                  <div style={{ fontSize: 12, color: '#16A34A', marginTop: 4 }}>
                    Cohort skills are well aligned with employer demand.
                  </div>
                </div>
              )}
            </Panel>

            {/* Well-covered skills */}
            <Panel
              title="Well-covered skills"
              description="Skills where the cohort meets or exceeds employer demand."
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {industryAlignment.filter((item) => !item.gap).length > 0 ? (
                  industryAlignment
                    .filter((item) => !item.gap)
                    .map((item) => <Tag key={item.skill} label={item.skill} tone="success" />)
                ) : (
                  <EmptyState
                    title="No fully covered skills yet"
                    description="As students add more skills, coverage will improve."
                  />
                )}
              </div>
            </Panel>
          </div>
        </DashboardSection>

        {/* ── Section 5: Semester trend ── */}
        <DashboardSection
          id="trend"
          title="5. Semester-over-Semester Trend"
          description="Trajectory of cohort readiness and academic performance across enrolled semesters."
        >
          <Panel
            title="Readiness trajectory"
            description="Average opportunity score and CGPA by semester."
          >
            {semesterTrend.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 100px 100px 80px',
                    gap: 12,
                    padding: '8px 12px',
                  }}
                >
                  {['Semester', 'Avg Score', 'Avg CGPA', 'Students'].map((h) => (
                    <div
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {semesterTrend.map((sem, i) => (
                  <div
                    key={sem.semester}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '1fr 100px 100px 80px',
                      gap: 12,
                      padding: '14px 12px',
                      borderRadius: 12,
                      background: i % 2 === 0 ? '#F8FAFC' : '#fff',
                      border: '1px solid #E2E8F0',
                      alignItems: 'center',
                    }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {sem.semester}
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color:
                          sem.avgScore >= 70
                            ? '#10B981'
                            : sem.avgScore >= 40
                              ? '#F59E0B'
                              : '#EF4444',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {sem.avgScore}%
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: '#22D3EE',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {sem.avgCGPA.toFixed(2)}
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#64748B' }}>
                      {sem.studentCount}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No semester data yet"
                description="Students need to fill in their current semester for trend data to appear."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Section 6: Top students ── */}
        <DashboardSection
          id="top-students"
          title="6. Top Performing Students"
          description="Highest-scoring students in the department by opportunity score — strong candidates for priority internship slots."
        >
          <Panel title="Top students" description="Ranked by opportunity score.">
            {data.topStudents.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {/* Header */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '40px 1fr 100px 100px 80px',
                    gap: 12,
                    padding: '8px 12px',
                  }}
                >
                  {['#', 'Student', 'Opp. Score', 'Profile', 'CGPA'].map((h) => (
                    <div
                      key={h}
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: '#94A3B8',
                        textTransform: 'uppercase',
                        letterSpacing: 0.8,
                      }}
                    >
                      {h}
                    </div>
                  ))}
                </div>
                {data.topStudents.map((student, i) => (
                  <div
                    key={student.id}
                    style={{
                      display: 'grid',
                      gridTemplateColumns: '40px 1fr 100px 100px 80px',
                      gap: 12,
                      padding: '14px 12px',
                      borderRadius: 12,
                      background: i % 2 === 0 ? '#F8FAFC' : '#fff',
                      border: '1px solid #E2E8F0',
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: i < 3 ? 'linear-gradient(135deg, #F59E0B, #FBBF24)' : '#EFF6FF',
                        color: i < 3 ? '#fff' : '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontSize: 13,
                        fontWeight: 900,
                      }}
                    >
                      {i + 1}
                    </div>
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                        {student.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        {student.department ?? '—'}
                        {student.yearOfStudy ? ` · Year ${student.yearOfStudy}` : ''}
                      </div>
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color:
                          student.opportunityScore >= 70
                            ? '#10B981'
                            : student.opportunityScore >= 40
                              ? '#F59E0B'
                              : '#EF4444',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {student.opportunityScore}%
                    </div>
                    <div
                      style={{
                        fontSize: 16,
                        fontWeight: 900,
                        color: '#2563EB',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {student.profileCompleteness}%
                    </div>
                    <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                      {typeof student.cgpa === 'number' ? student.cgpa.toFixed(2) : '—'}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                title="No student data"
                description="Top students will appear once department records are populated."
              />
            )}
          </Panel>
        </DashboardSection>

        {/* ── Section 7: Recommendations ── */}
        <DashboardSection
          id="recommendations"
          title="7. Recommendations"
          description="Auto-generated action items based on current cohort data."
        >
          <Panel
            title="Strategic action items"
            description="Based on readiness distribution, skill gaps, and benchmark status."
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {/* Readiness recommendation */}
              {readinessDistribution.notReady.pct > 30 && (
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    background: '#FEF2F2',
                    border: '1px solid #FECACA',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#991B1B', marginBottom: 6 }}>
                    🎯 High proportion of not-ready students ({readinessDistribution.notReady.pct}%)
                  </div>
                  <div style={{ fontSize: 13, color: '#B91C1C', lineHeight: 1.6 }}>
                    Consider scheduling targeted skill-building workshops for students scoring below
                    40. Focus on profile completion and internship application activity to improve
                    readiness scores.
                  </div>
                </div>
              )}

              {/* Critical gaps recommendation */}
              {criticalGaps.length > 0 && (
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    background: '#FFFBEB',
                    border: '1px solid #FDE68A',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#92400E', marginBottom: 6 }}>
                    📚 Critical skill gaps identified ({criticalGaps.length} skills)
                  </div>
                  <div
                    style={{ fontSize: 13, color: '#92400E', lineHeight: 1.6, marginBottom: 10 }}
                  >
                    The following skills have high employer demand but low student coverage:{' '}
                    {criticalGaps.map((g) => g.skill).join(', ')}. Consider incorporating these into
                    elective coursework or organizing workshops.
                  </div>
                  <Link
                    href="/dept/events/new"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      background: '#FEF3C7',
                      color: '#92400E',
                      border: '1px solid #FDE68A',
                      padding: '7px 14px',
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 700,
                      textDecoration: 'none',
                    }}
                  >
                    📅 Post a workshop to address these gaps →
                  </Link>
                </div>
              )}

              {/* Positive note if doing well */}
              {readinessDistribution.ready.pct >= 50 && (
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    background: '#ECFDF5',
                    border: '1px solid #A7F3D0',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#065F46', marginBottom: 6 }}>
                    ✅ Strong cohort readiness ({readinessDistribution.ready.pct}% ready)
                  </div>
                  <div style={{ fontSize: 13, color: '#16A34A', lineHeight: 1.6 }}>
                    More than half the cohort meets the readiness threshold. Focus on pushing the
                    partially-ready tier ({readinessDistribution.partial.pct}%) over the line with
                    targeted coaching and internship applications.
                  </div>
                </div>
              )}

              {/* Hiring pipeline recommendation */}
              {data.stats.hiredStudents === 0 && data.stats.totalApplications > 0 && (
                <div
                  style={{
                    padding: '16px 18px',
                    borderRadius: 14,
                    background: '#F0F9FF',
                    border: '1px solid #BAE6FD',
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#0369A1', marginBottom: 6 }}>
                    💼 No hires recorded yet despite {data.stats.totalApplications} applications
                  </div>
                  <div style={{ fontSize: 13, color: '#0369A1', lineHeight: 1.6 }}>
                    Students are applying but not converting. Consider running mock interview
                    sessions and reviewing fit score data with advisors to identify where
                    applications are stalling.
                  </div>
                </div>
              )}

              {/* Default positive message */}
              {readinessDistribution.notReady.pct <= 30 &&
                criticalGaps.length === 0 &&
                !belowBenchmark && (
                  <div
                    style={{
                      padding: '16px 18px',
                      borderRadius: 14,
                      background: '#F0FDF4',
                      border: '1px solid #BBF7D0',
                    }}
                  >
                    <div
                      style={{ fontSize: 14, fontWeight: 800, color: '#14532D', marginBottom: 6 }}
                    >
                      🌟 Department is performing well overall
                    </div>
                    <div style={{ fontSize: 13, color: '#16A34A', lineHeight: 1.6 }}>
                      No critical issues detected. Continue monitoring semester trends and maintain
                      benchmark targets. Encourage students to diversify application portfolios.
                    </div>
                  </div>
                )}
            </div>
          </Panel>
        </DashboardSection>

        {/* ── Footer note ── */}
        <div
          style={{
            background: '#F8FAFC',
            border: '1px solid #E2E8F0',
            borderRadius: 16,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: '#EFF6FF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              flexShrink: 0,
            }}
          >
            <FileText size={16} />
          </div>
          <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
            <strong style={{ color: '#0F172A' }}>Strategic Career Readiness Report</strong> ·
            Generated by Nextern on {today} · Data reflects live platform records at the time of
            generation. Use browser print (Ctrl+P) to save as PDF for institutional records.
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .dashboard-stats-grid, .dashboard-grid-two { grid-template-columns: 1fr !important; }
          }
          @media print {
            header, footer { display: none !important; }
            body { background: white !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
