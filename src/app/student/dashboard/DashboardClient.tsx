'use client';

import CareerOverview from '@/components/student/CareerOverview';
import type { DashboardData } from '@/lib/student-dashboard';
import type { UpcomingCalendarEvent } from '@/lib/calendar-events';
import type { StudentAcademicReviewSummary } from '@/lib/academic-feedback';
import DashboardShell, { type DashboardNavItem } from '@/components/dashboard/DashboardShell';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import {
  DashboardPage,
  DashboardSection,
  EmptyState,
  Panel,
  StatCard,
  Tag,
  TrendLine,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
  getDaysLeftLabel,
} from '@/components/dashboard/DashboardContent';
import CalendarWidget from '@/components/calendar/CalendarWidget';
import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Award,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Gauge,
  MapPin,
  Rocket,
  Trophy,
} from 'lucide-react';

function formatCurrency(value?: number) {
  if (!value || value <= 0) return 'Negotiable';
  return new Intl.NumberFormat('en-BD', {
    style: 'currency',
    currency: 'BDT',
    maximumFractionDigits: 0,
  }).format(value);
}

function getStatusTone(status: string): 'info' | 'success' | 'warning' | 'neutral' {
  if (status === 'hired') return 'success';
  if (['shortlisted', 'under_review', 'assessment_sent', 'interview_scheduled'].includes(status)) {
    return 'info';
  }
  if (status === 'rejected' || status === 'withdrawn') return 'warning';
  return 'neutral';
}

/* ── Chart color tokens — reuse the same palette already used across the dashboard, no gradients ── */
const CHART_COLORS = {
  blue: '#087f72',
  green: '#168257',
  amber: '#a86714',
  cyan: '#178d80',
  indigo: '#6366F1',
  slate: '#60717d',
};

function ScoreTooltip({
  active,
  payload,
  label,
}: {
  active?: boolean;
  payload?: Array<{ value: number }>;
  label?: string;
}) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #dfe6e9',
        borderRadius: 12,
        padding: '8px 12px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ fontSize: 11, fontWeight: 700, color: '#60717d' }}>
        {formatShortDate(label ?? '')}
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#243e4a', marginTop: 2 }}>
        {payload[0].value} pts
      </div>
    </div>
  );
}

function PipelineTooltip({
  active,
  payload,
}: {
  active?: boolean;
  payload?: Array<{ value: number; payload: { name: string; color: string } }>;
}) {
  if (!active || !payload || !payload.length) return null;
  const item = payload[0];
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #dfe6e9',
        borderRadius: 12,
        padding: '8px 12px',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: 999,
            background: item.payload.color,
            display: 'inline-block',
          }}
        />
        <span style={{ fontSize: 12, fontWeight: 700, color: '#60717d' }}>{item.payload.name}</span>
      </div>
      <div style={{ fontSize: 15, fontWeight: 700, color: '#243e4a', marginTop: 2 }}>
        {formatCompactNumber(item.value)}
      </div>
    </div>
  );
}

interface DashboardClientProps {
  data: DashboardData;
  userId: string;
  calendarEvents: UpcomingCalendarEvent[];
  isCalendarConnected: boolean;
  initialAcademicReviews?: StudentAcademicReviewSummary[];
  previewShell?: {
    role: 'advisor' | 'departmentHead';
    roleLabel: string;
    homeHref: string;
    navItems: DashboardNavItem[];
    user: {
      name: string;
      email: string;
      image?: string;
      subtitle: string;
      unreadNotifications: number;
      unreadMessages: number;
      userId?: string;
    };
    browseHref: string;
    applicationsHref: string;
  };
}

export default function DashboardClient({
  data,
  userId,
  calendarEvents,
  isCalendarConnected,
  initialAcademicReviews,
  previewShell,
}: DashboardClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasTriggeredCalendarSync = useRef(false);
  const [academicReviews, setAcademicReviews] = useState<StudentAcademicReviewSummary[]>(
    initialAcademicReviews ?? []
  );
  const profileSubtitle = [data.profile.university, data.profile.department]
    .filter(Boolean)
    .join(' | ');
  const shellRole = previewShell?.role ?? 'student';
  const shellRoleLabel = previewShell?.roleLabel ?? 'Student dashboard';
  const shellHomeHref = previewShell?.homeHref ?? '/student/dashboard';
  const shellNavItems = previewShell?.navItems ?? STUDENT_NAV_ITEMS;
  const shellUser = previewShell?.user ?? {
    name: data.profile.name,
    email: data.profile.email,
    image: data.profile.image,
    subtitle: profileSubtitle || 'Student workspace',
    userId,
    unreadNotifications: data.profile.unreadNotifications,
    unreadMessages: data.profile.unreadMessages,
  };
  const browseHref = previewShell?.browseHref ?? '/student/jobs';
  const applicationsHref = previewShell?.applicationsHref ?? '/student/applications';

  useEffect(() => {
    if (!isCalendarConnected) return;
    if (searchParams.get('calendar') !== 'connected') return;
    if (hasTriggeredCalendarSync.current) return;

    hasTriggeredCalendarSync.current = true;
    let isActive = true;

    void (async () => {
      try {
        await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resync: true }),
        });
      } catch (error) {
        console.error('[CALENDAR AUTO-SYNC ERROR]', error);
      } finally {
        if (!isActive) return;
        router.replace('/student/dashboard#calendar');
        router.refresh();
      }
    })();

    return () => {
      isActive = false;
    };
  }, [isCalendarConnected, router, searchParams]);

  useEffect(() => {
    if (previewShell || initialAcademicReviews) return;

    let isActive = true;

    void (async () => {
      try {
        const res = await fetch('/api/student/academic-feedback');
        const feedback = (await res.json()) as { reviews?: StudentAcademicReviewSummary[] };
        if (!isActive) return;
        setAcademicReviews(feedback.reviews ?? []);
      } catch (error) {
        console.error('[STUDENT DASHBOARD REVIEWS ERROR]', error);
      }
    })();

    return () => {
      isActive = false;
    };
  }, [initialAcademicReviews, previewShell]);

  /* ── Presentation-only derived chart data — no new fetches, purely reshaping props already in `data` ── */

  const skillGapChartData = useMemo(
    () => [
      { name: 'Hard gaps', value: data.skillGapSummary.totalHardGaps, color: CHART_COLORS.amber },
      { name: 'Soft gaps', value: data.skillGapSummary.totalSoftGaps, color: CHART_COLORS.cyan },
      { name: 'Closed', value: data.skillGapSummary.closedGapsCount, color: CHART_COLORS.green },
    ],
    [
      data.skillGapSummary.totalHardGaps,
      data.skillGapSummary.totalSoftGaps,
      data.skillGapSummary.closedGapsCount,
    ]
  );
  const skillGapTotal = skillGapChartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <DashboardShell
      embedded
      role={shellRole}
      roleLabel={shellRoleLabel}
      homeHref={shellHomeHref}
      navItems={shellNavItems}
      user={shellUser}
    >
      <DashboardPage>
        <CareerOverview
          data={data}
          browseHref={browseHref}
          applicationsHref={applicationsHref}
          preview={Boolean(previewShell)}
        />
        <section className="career-stats" aria-label="Application overview">
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Applications sent"
              value={formatCompactNumber(data.stats.totalApplications)}
              hint="In your recent application history."
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(data.stats.shortlisted)}
              hint="In review, shortlisted, or interviewing."
              Icon={CheckCircle2}
              accent="#168257"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hired)}
              hint="Confirmed hiring outcomes."
              Icon={Trophy}
              accent="#a86714"
            />
            <StatCard
              label="Average fit score"
              value={`${data.stats.avgFitScore}%`}
              hint="Across your scored applications."
              Icon={Gauge}
              accent="#178d80"
            />
          </div>
        </section>
        <div className="dashboard-fade-in" style={{ animationDelay: '240ms' }}>
          <DashboardSection
            id="recommended"
            title="Recommended opportunities"
            description="Suggestions below are based on active jobs that still match your current department, skills, and profile direction."
          >
            {data.recommendedJobs.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 16,
                }}
                className="dashboard-card-grid v2-form-grid"
              >
                {data.recommendedJobs.map((job) => (
                  <div key={job._id} className="dashboard-hover-card" style={{ borderRadius: 22 }}>
                    <Panel
                      title={job.title}
                      description={job.companyName}
                      action={<Tag label={`${job.fitScore ?? 0}% match`} tone="info" />}
                    >
                      <div style={{ display: 'grid', gap: 12 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <Tag label={formatStatusLabel(job.type)} tone="neutral" />
                          <Tag label={formatStatusLabel(job.locationType)} tone="neutral" />
                          {job.city ? <Tag label={job.city} tone="neutral" /> : null}
                        </div>
                        <div style={{ display: 'grid', gap: 8, color: '#60717d', fontSize: 13 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <MapPin size={15} strokeWidth={2} />
                            {job.city || 'Location shared on application review'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Rocket size={15} strokeWidth={2} />
                            {job.whyRecommended || 'Matches your profile'}
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <Clock3 size={15} strokeWidth={2} />
                            Deadline {formatShortDate(job.applicationDeadline)}
                          </div>
                        </div>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 12,
                            paddingTop: 6,
                          }}
                        >
                          <div>
                            <div style={{ fontSize: 12, color: '#60717d', fontWeight: 700 }}>
                              Compensation
                            </div>
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 15,
                                color: '#243e4a',
                                fontWeight: 700,
                              }}
                            >
                              {formatCurrency(job.stipendBDT)}
                            </div>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ fontSize: 12, color: '#60717d', fontWeight: 700 }}>
                              Applications
                            </div>
                            <div
                              style={{
                                marginTop: 4,
                                fontSize: 15,
                                color: '#243e4a',
                                fontWeight: 700,
                              }}
                            >
                              {formatCompactNumber(job.applicationCount)}
                            </div>
                          </div>
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {job.requiredSkills.length > 0 ? (
                            job.requiredSkills.map((skill) => (
                              <Tag key={skill} label={skill} tone="neutral" />
                            ))
                          ) : (
                            <Tag label="General match" tone="neutral" />
                          )}
                        </div>
                      </div>
                    </Panel>
                  </div>
                ))}
              </div>
            ) : (
              <Panel
                title="No fresh matches yet"
                description="As new roles enter the database or your profile improves, this section will update automatically."
              >
                <EmptyState
                  title="Your recommendations are catching up"
                  description="Complete more profile details or add skills to unlock stronger matches."
                />
              </Panel>
            )}
          </DashboardSection>
        </div>
        <div className="dashboard-composition">
          <div className="dashboard-fade-in" style={{ animationDelay: '200ms' }}>
            <DashboardSection
              id="applications"
              title="Recent application activity"
              description="Everything here is coming from your latest application records, so the state stays aligned with the database."
            >
              <Panel
                title="Latest submissions"
                description="Recent applications, their current pipeline stage, and the fit score already computed for each role."
              >
                {data.recentApplications.length > 0 ? (
                  <div style={{ display: 'grid', gap: 12 }}>
                    {data.recentApplications.map((application) => (
                      <div
                        key={application._id}
                        className="dashboard-hover-card"
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
                                {application.jobTitle}
                              </div>
                              <Tag
                                label={formatStatusLabel(application.status)}
                                tone={getStatusTone(application.status)}
                              />
                            </div>
                            <div
                              style={{
                                marginTop: 6,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 14,
                                flexWrap: 'wrap',
                                color: '#60717d',
                                fontSize: 13,
                              }}
                            >
                              <span>{application.companyName}</span>
                              {application.industry ? <span>{application.industry}</span> : null}
                              <span>Applied {formatShortDate(application.appliedAt)}</span>
                            </div>
                          </div>
                          <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                            <div style={{ fontSize: 12, fontWeight: 700, color: '#60717d' }}>
                              Fit score
                            </div>
                            <div
                              style={{
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
                    title="No applications yet"
                    description="Once you apply to jobs or internships, your live pipeline will show up here."
                  />
                )}
              </Panel>
            </DashboardSection>
          </div>
          <div className="dashboard-fade-in" style={{ animationDelay: '160ms' }}>
            <DashboardSection
              id="deadlines"
              title="Priority deadlines"
              description="Roles you already engaged with that need attention soon."
            >
              <Panel
                title="Upcoming deadlines"
                action={
                  <Tag
                    label={`${data.deadlines.length} active`}
                    tone={data.deadlines.length > 0 ? 'warning' : 'neutral'}
                  />
                }
              >
                <div style={{ display: 'grid', gap: 12 }}>
                  {data.deadlines.length > 0 ? (
                    data.deadlines.map((deadline) => (
                      <div
                        key={deadline._id}
                        className="dashboard-hover-card"
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          background: `${CHART_COLORS.amber}0C`,
                          border: `1px solid ${CHART_COLORS.amber}30`,
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
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#243e4a' }}>
                              {deadline.jobTitle}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 13, color: '#60717d' }}>
                              {deadline.companyName}
                            </div>
                          </div>
                          <Tag
                            label={getDaysLeftLabel(deadline.daysLeft)}
                            tone={deadline.daysLeft <= 2 ? 'warning' : 'info'}
                          />
                        </div>
                        <div
                          style={{
                            marginTop: 12,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            color: '#60717d',
                            fontSize: 13,
                          }}
                        >
                          <CalendarClock size={15} strokeWidth={2} />
                          Deadline: {formatShortDate(deadline.deadline)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="Nothing urgent right now"
                      description="Upcoming deadlines will appear here once you apply to active opportunities."
                    />
                  )}
                </div>
              </Panel>
            </DashboardSection>
          </div>
        </div>
        <div className="dashboard-fade-in" style={{ animationDelay: '120ms' }}>
          <DashboardSection
            id="score"
            title="Readiness and schedule"
            description="Track your score movement, then scroll straight into a month-view planner for deadlines and interviews."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 16 }}
              className="dashboard-grid-two"
            >
              <Panel
                title="Opportunity score trend"
                description="Recent score movements based on profile changes, achievements, and application activity."
                action={<Tag label={`${data.stats.totalBadges} badges earned`} tone="info" />}
              >
                {data.scoreHistory.length > 0 ? (
                  <div style={{ width: '100%', height: 168 }}>
                    <ResponsiveContainer
                      width="100%"
                      height="100%"
                      initialDimension={{ width: 600, height: 280 }}
                    >
                      <AreaChart
                        data={data.scoreHistory}
                        margin={{ top: 8, right: 8, left: -24, bottom: 0 }}
                      >
                        <CartesianGrid vertical={false} stroke="#EEF2F7" />
                        <XAxis
                          dataKey="date"
                          tickFormatter={(value: string) => formatShortDate(value)}
                          tick={{ fill: '#60717d', fontSize: 11 }}
                          tickLine={false}
                          axisLine={{ stroke: '#dfe6e9' }}
                          minTickGap={24}
                        />
                        <YAxis
                          tick={{ fill: '#60717d', fontSize: 11 }}
                          tickLine={false}
                          axisLine={false}
                          width={36}
                        />
                        <Tooltip content={<ScoreTooltip />} />
                        <Area
                          type="monotone"
                          dataKey="score"
                          stroke="#087f72"
                          strokeWidth={2.5}
                          fill="#087f72"
                          fillOpacity={0.1}
                          dot={{ r: 3, stroke: '#087f72', strokeWidth: 2, fill: '#FFFFFF' }}
                          activeDot={{ r: 5 }}
                          animationDuration={900}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                ) : (
                  <TrendLine values={data.scoreHistory.map((point) => point.score)} />
                )}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 12,
                    marginTop: 18,
                  }}
                  className="dashboard-mini-grid v2-form-grid"
                >
                  {data.scoreHistory.slice(-3).map((point) => (
                    <div
                      key={`${point.date}-${point.reason}`}
                      className="dashboard-hover-card"
                      style={{
                        padding: 14,
                        borderRadius: 12,
                        background: `${CHART_COLORS.cyan}0C`,
                        border: `1px solid ${CHART_COLORS.cyan}30`,
                      }}
                    >
                      <div style={{ fontSize: 12, color: '#60717d', fontWeight: 700 }}>
                        {formatShortDate(point.date)}
                      </div>
                      <div
                        style={{
                          marginTop: 8,
                          fontSize: 24,
                          fontWeight: 700,
                          color: '#243e4a',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {point.score}
                      </div>
                      <div
                        style={{
                          marginTop: 4,
                          fontSize: 12,
                          color: point.delta >= 0 ? '#168257' : '#a86714',
                          fontWeight: 700,
                        }}
                      >
                        {point.delta >= 0 ? '+' : ''}
                        {point.delta} points
                      </div>
                      <div
                        style={{ marginTop: 6, fontSize: 12, lineHeight: 1.55, color: '#60717d' }}
                      >
                        {point.reason}
                      </div>
                    </div>
                  ))}
                </div>
              </Panel>

              {/* ── CalendarWidget lives here ── */}
              <div id="calendar">
                <CalendarWidget events={calendarEvents} isCalendarConnected={isCalendarConnected} />
              </div>
            </div>
          </DashboardSection>
        </div>
        <div className="dashboard-fade-in" style={{ animationDelay: '280ms' }}>
          <DashboardSection
            id="skills"
            title="Skills and credentials"
            description="This combines badge activity with the hard and soft gaps detected across your existing applications."
          >
            <div
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
              className="dashboard-grid-two v2-page-grid"
            >
              <Panel
                title="Skill gap summary"
                description="Live insight into the competencies that most often hold your applications back."
              >
                <div style={{ display: 'grid', gap: 18 }}>
                  {/* ── Donut chart is the primary view now — bigger, with a bold, highlighted total ── */}
                  {skillGapTotal > 0 ? (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 24,
                      }}
                      className="dashboard-donut-row"
                    >
                      <div style={{ position: 'relative', width: 176, height: 176, flexShrink: 0 }}>
                        <ResponsiveContainer
                          width="100%"
                          height="100%"
                          initialDimension={{ width: 600, height: 280 }}
                        >
                          <PieChart>
                            <Pie
                              data={skillGapChartData}
                              dataKey="value"
                              nameKey="name"
                              innerRadius={58}
                              outerRadius={86}
                              paddingAngle={3}
                              stroke="none"
                              animationDuration={700}
                            >
                              {skillGapChartData.map((entry) => (
                                <Cell key={entry.name} fill={entry.color} />
                              ))}
                            </Pie>
                            <Tooltip content={<PipelineTooltip />} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div
                          style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center',
                            pointerEvents: 'none',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 40,
                              fontWeight: 700,
                              color: '#243e4a',
                              lineHeight: 1,
                              fontFamily: 'var(--font-display)',
                            }}
                          >
                            {skillGapTotal}
                          </div>
                          <div
                            style={{
                              marginTop: 4,
                              fontSize: 11,
                              color: '#60717d',
                              fontWeight: 700,
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                            }}
                          >
                            total gaps
                          </div>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 12, flex: 1, minWidth: 0 }}>
                        {skillGapChartData.map((entry) => (
                          <div
                            key={entry.name}
                            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                          >
                            <span
                              style={{
                                width: 10,
                                height: 10,
                                borderRadius: 999,
                                background: entry.color,
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{ fontSize: 13, color: '#60717d', flex: 1, fontWeight: 600 }}
                            >
                              {entry.name}
                            </span>
                            <span style={{ fontSize: 15, fontWeight: 700, color: '#243e4a' }}>
                              {entry.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      title="No skill gaps recorded"
                      description="Once applications generate hard- or soft-skill feedback, they'll be charted here."
                    />
                  )}

                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: '#243e4a', marginBottom: 10 }}
                    >
                      Most common hard-skill gaps
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {data.skillGapSummary.topHardGaps.length > 0 ? (
                        data.skillGapSummary.topHardGaps.map((item) => (
                          <Tag key={item} label={item} tone="warning" />
                        ))
                      ) : (
                        <Tag label="No hard gaps detected" tone="success" />
                      )}
                    </div>
                  </div>
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: '#243e4a', marginBottom: 10 }}
                    >
                      Most common soft-skill gaps
                    </div>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {data.skillGapSummary.topSoftGaps.length > 0 ? (
                        data.skillGapSummary.topSoftGaps.map((item) => (
                          <Tag key={item} label={item} tone="info" />
                        ))
                      ) : (
                        <Tag label="No soft gaps detected" tone="success" />
                      )}
                    </div>
                  </div>
                </div>
              </Panel>

              <Panel
                title="Recent badges"
                description="Recognition already awarded to your profile and ready to support future ranking and trust signals."
              >
                <div id="badges" style={{ display: 'grid', gap: 12 }}>
                  {data.recentBadges.length > 0 ? (
                    data.recentBadges.map((badge) => (
                      <div
                        key={`${badge.badgeSlug}-${badge.awardedAt}`}
                        className="dashboard-hover-card"
                        style={{
                          padding: 16,
                          borderRadius: 12,
                          background: `${CHART_COLORS.indigo}0C`,
                          border: `1px solid ${CHART_COLORS.indigo}30`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <div
                            style={{
                              width: 42,
                              height: 42,
                              borderRadius: 14,
                              background: '#edf7f3',
                              color: '#087f72',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Award size={20} strokeWidth={2} />
                          </div>
                          <div>
                            <div style={{ fontSize: 15, fontWeight: 700, color: '#243e4a' }}>
                              {badge.badgeName}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 12, color: '#60717d' }}>
                              Awarded {formatShortDate(badge.awardedAt)}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <EmptyState
                      title="No badges awarded yet"
                      description="Badges will appear here once profile and activity milestones are completed."
                    />
                  )}
                </div>
              </Panel>
            </div>
          </DashboardSection>
        </div>
        <div className="dashboard-fade-in" style={{ animationDelay: '80ms' }}>
          <DashboardSection
            id="reviews"
            title="Academic reviews"
            description="Open this section to read the profile reviews your advisor or department head has saved for you."
          >
            <details
              style={{
                borderRadius: 12,
                border: '1px solid #D9E2EC',
                background: '#FFFFFF',
                boxShadow: 'var(--shadow-card)',
                overflow: 'hidden',
              }}
            >
              <summary
                style={{
                  listStyle: 'none',
                  cursor: 'pointer',
                  padding: '20px 22px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 16,
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: '#edf7f3',
                      border: '1px solid #bdddd5',
                      color: '#087f72',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    <FileText size={20} strokeWidth={2} />
                  </div>
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 700,
                        color: '#243e4a',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      View saved academic reviews
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#60717d' }}>
                      {academicReviews.length > 0
                        ? `${academicReviews.length} review${academicReviews.length === 1 ? '' : 's'} available`
                        : 'No academic reviews have been added yet'}
                    </div>
                  </div>
                </div>
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 38,
                    height: 38,
                    borderRadius: 14,
                    border: '1px solid #dbefea',
                    background: '#edf7f3',
                    color: '#087f72',
                    flexShrink: 0,
                  }}
                >
                  <ChevronDown size={18} />
                </span>
              </summary>

              <div
                style={{
                  borderTop: '1px solid #dfe6e9',
                  padding: 22,
                  background: '#f6f8f9',
                }}
              >
                {academicReviews.length > 0 ? (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {academicReviews.map((review) => {
                      const tone =
                        review.readinessLevel === 'ready'
                          ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
                          : review.readinessLevel === 'priority_support'
                            ? { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' }
                            : { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };

                      return (
                        <div
                          key={review.id}
                          className="dashboard-hover-card"
                          style={{
                            borderRadius: 12,
                            border: '1px solid #dfe6e9',
                            background: '#FFFFFF',
                            padding: 18,
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
                              <div
                                style={{
                                  fontSize: 17,
                                  fontWeight: 700,
                                  color: '#243e4a',
                                  fontFamily: 'var(--font-display)',
                                }}
                              >
                                {review.headline}
                              </div>
                              <div style={{ marginTop: 6, fontSize: 13, color: '#60717d' }}>
                                {review.reviewer.name}
                                {review.reviewer.designation
                                  ? ` · ${review.reviewer.designation}`
                                  : ''}
                                {review.reviewer.institution
                                  ? ` · ${review.reviewer.institution}`
                                  : ''}
                              </div>
                            </div>
                            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                              <Tag
                                label={review.readinessLevel.replace(/_/g, ' ')}
                                tone={
                                  review.readinessLevel === 'ready'
                                    ? 'success'
                                    : review.readinessLevel === 'priority_support'
                                      ? 'warning'
                                      : 'info'
                                }
                              />
                              {typeof review.profileScore === 'number' ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    padding: '6px 10px',
                                    borderRadius: 999,
                                    background: tone.bg,
                                    border: `1px solid ${tone.border}`,
                                    color: tone.color,
                                    fontSize: 12,
                                    fontWeight: 700,
                                  }}
                                >
                                  Profile {review.profileScore}%
                                </span>
                              ) : null}
                            </div>
                          </div>

                          <p
                            style={{
                              margin: '12px 0 0',
                              fontSize: 14,
                              lineHeight: 1.7,
                              color: '#475569',
                            }}
                          >
                            {review.summary}
                          </p>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                              gap: 12,
                              marginTop: 14,
                            }}
                            className="dashboard-review-grid v2-form-grid"
                          >
                            <div
                              style={{
                                borderRadius: 12,
                                border: '1px solid #A7F3D0',
                                background: '#ECFDF5',
                                padding: 14,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#166534',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.8,
                                }}
                              >
                                Strengths
                              </div>
                              <div
                                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}
                              >
                                {review.strengths.length > 0 ? (
                                  review.strengths.map((item) => (
                                    <Tag
                                      key={`${review.id}:${item}:strength`}
                                      label={item}
                                      tone="success"
                                    />
                                  ))
                                ) : (
                                  <span style={{ fontSize: 13, color: '#60717d' }}>
                                    No strengths listed.
                                  </span>
                                )}
                              </div>
                            </div>

                            <div
                              style={{
                                borderRadius: 12,
                                border: '1px solid #FDE68A',
                                background: '#FFFBEB',
                                padding: 14,
                              }}
                            >
                              <div
                                style={{
                                  fontSize: 12,
                                  fontWeight: 700,
                                  color: '#92400E',
                                  textTransform: 'uppercase',
                                  letterSpacing: 0.8,
                                }}
                              >
                                Growth areas
                              </div>
                              <div
                                style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}
                              >
                                {review.growthAreas.length > 0 ? (
                                  review.growthAreas.map((item) => (
                                    <Tag
                                      key={`${review.id}:${item}:gap`}
                                      label={item}
                                      tone="warning"
                                    />
                                  ))
                                ) : (
                                  <span style={{ fontSize: 13, color: '#60717d' }}>
                                    No growth areas listed.
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div style={{ marginTop: 12, fontSize: 12, color: '#60717d' }}>
                            Added {formatShortDate(review.createdAt)}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <EmptyState
                    title="No reviews yet"
                    description="When your advisor or department head saves a profile review, it will appear here."
                  />
                )}
              </div>
            </details>
          </DashboardSection>
        </div>
        <style>{`
          @keyframes dashboardFadeInUp {
            from {
              opacity: 0;
              transform: translateY(14px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .dashboard-fade-in {
            animation: dashboardFadeInUp 520ms cubic-bezier(0.16, 1, 0.3, 1) both;
          }

          .dashboard-hover-card {
            transition: transform 220ms ease, box-shadow 220ms ease, border-color 220ms ease;
          }
          .dashboard-hover-card:hover {
            transform: translateY(-2px);
            box-shadow: 0 14px 28px rgba(37, 99, 235, 0.10);
            border-color: #CBD5E1;
          }

          @media (prefers-reduced-motion: reduce) {
            .dashboard-fade-in,
            .dashboard-hover-card {
              animation: none !important;
              transition: none !important;
            }
          }

          @media (max-width: 1180px) {
            .dashboard-card-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }
          @media (max-width: 960px) {
            .dashboard-stats-grid,
            .dashboard-mini-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr)) !important;
            }
            .dashboard-grid-two,
            .dashboard-card-grid,
            .dashboard-inline-grid,
            .dashboard-review-grid {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 560px) {
            .dashboard-card-grid,
            .dashboard-stats-grid,
            .dashboard-mini-grid {
              grid-template-columns: 1fr !important;
            }
            .dashboard-donut-row {
              flex-direction: column;
              align-items: flex-start !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
