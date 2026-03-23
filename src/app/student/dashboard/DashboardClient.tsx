'use client';

import type { DashboardData } from '@/lib/student-dashboard';
import DashboardShell from '@/components/dashboard/DashboardShell';
import Link from 'next/link';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
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
  TrendLine,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
  getDaysLeftLabel,
} from '@/components/dashboard/DashboardContent';
import {
  Award,
  BriefcaseBusiness,
  CalendarClock,
  CheckCircle2,
  Clock3,
  Gauge,
  MapPin,
  Rocket,
  Target,
  Trophy,
  UserRound,
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

const navItems = [
  { label: 'Overview', href: '/student/dashboard', icon: 'dashboard' as const },
  { label: 'Browse Jobs', href: '/student/jobs', icon: 'briefcase' as const },
  {
    label: 'Career',
    icon: 'file' as const,
    items: [
      {
        label: 'Applications',
        href: '/student/applications',
        description: 'Review your active application pipeline and latest submissions.',
        icon: 'file' as const,
      },
      {
        label: 'Recommended roles',
        href: '/student/jobs',
        description: 'See the best current matches based on your skills and profile.',
        icon: 'sparkles' as const,
      },
      {
        label: 'Deadlines',
        href: '/student/applications',
        description: 'Stay ahead of closing application windows.',
        icon: 'calendar' as const,
      },
    ],
  },
  {
    label: 'Growth',
    icon: 'insights' as const,
    items: [
      {
        label: 'Score trend',
        href: '/student/dashboard#score',
        description: 'Track how your opportunity score has changed over time.',
        icon: 'insights' as const,
      },
      {
        label: 'Skill gaps',
        href: '/student/dashboard#skills',
        description: 'Focus on the skills that impact your readiness.',
        icon: 'target' as const,
      },
      {
        label: 'Badges',
        href: '/student/dashboard#badges',
        description: 'Review the badges and milestones you have earned.',
        icon: 'shield' as const,
      },
    ],
  },
];

export default function DashboardClient({ data }: { data: DashboardData }) {
  const profileSubtitle = [data.profile.university, data.profile.department]
    .filter(Boolean)
    .join(' | ');

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: data.profile.name,
        email: data.profile.email,
        image: data.profile.image,
        subtitle: profileSubtitle || 'Student workspace',
        unreadNotifications: data.profile.unreadNotifications,
        unreadMessages: data.profile.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Student workspace"
          title={data.profile.name}
          subtitle={
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px 10px',
                marginTop: 4,
                alignItems: 'center',
              }}
            >
              {data.profile.city && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 13,
                    color: 'rgba(255,255,255,0.75)',
                    fontWeight: 500,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z" />
                    <circle cx="12" cy="10" r="3" />
                  </svg>
                  {data.profile.city}
                </span>
              )}
              {data.profile.city && (data.profile.university || data.profile.department) && (
                <span style={{ color: 'rgba(255,255,255,0.25)', fontSize: 13 }}>·</span>
              )}
              {data.profile.university && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#E2E8F0',
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
                    <path d="M6 12v5c3 3 9 3 12 0v-5" />
                  </svg>
                  {data.profile.university}
                </span>
              )}
              {data.profile.department && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#E2E8F0',
                    fontWeight: 600,
                  }}
                >
                  {data.profile.department}
                </span>
              )}
              {(data.profile.isGraduated || data.profile.yearOfStudy) && (
                <span
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: 'rgba(255,255,255,0.12)',
                    border: '1px solid rgba(255,255,255,0.18)',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#E2E8F0',
                    fontWeight: 600,
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="18" height="18" x="3" y="4" rx="2" ry="2" />
                    <line x1="16" x2="16" y1="2" y2="6" />
                    <line x1="8" x2="8" y1="2" y2="6" />
                    <line x1="3" x2="21" y1="10" y2="10" />
                  </svg>
                  {data.profile.isGraduated ? 'Graduated' : `Year ${data.profile.yearOfStudy}`}
                </span>
              )}
              {data.profile.email && (
                <Link
                  href={`mailto:${data.profile.email}`}
                  title={data.profile.email}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#EFF6FF',
                    border: '1px solid #BFDBFE',
                    borderRadius: 999,
                    padding: '5px 14px',
                    fontSize: 13,
                    color: '#2563EB',
                    fontWeight: 700,
                    textDecoration: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <svg
                    width="13"
                    height="13"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                  Email Address
                </Link>
              )}
            </div>
          }
          description={data.profile.bio || 'No bio added yet — go to My Profile to write one.'}
          actions={
            <>
              <ActionLink href="/student/jobs" label="Browse Jobs" />
              <ActionLink href="/student/applications" label="My Applications" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Profile pulse"
              description="A live summary of how complete and competitive your profile looks right now."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <Tag label={`${data.profile.opportunityScore} opportunity score`} tone="info" />
                  <Tag label={`${data.profile.profileCompleteness}% complete`} tone="success" />
                  {typeof data.stats.leaderboardRank === 'number' ? (
                    <Tag label={`Rank #${data.stats.leaderboardRank}`} tone="warning" />
                  ) : null}
                </div>
                <ProgressBar
                  value={data.profile.profileCompleteness}
                  label="Profile completeness"
                />
                <ProgressBar
                  value={data.profile.opportunityScore}
                  label="Opportunity readiness"
                  tone="success"
                />
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  {data.profile.skills.length > 0 ? (
                    data.profile.skills
                      .slice(0, 6)
                      .map((skill) => <Tag key={skill} label={skill} tone="neutral" />)
                  ) : (
                    <Tag label="Add skills to improve matching" tone="warning" />
                  )}
                </div>
              </div>
            </Panel>
          }
        />

        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 16 }}
            className="dashboard-stats-grid"
          >
            <StatCard
              label="Applications sent"
              value={formatCompactNumber(data.stats.totalApplications)}
              hint="Dynamic count from your current application records."
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(data.stats.shortlisted)}
              hint="Includes reviewed, shortlisted, and interview-stage opportunities."
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(data.stats.hired)}
              hint="Confirmed placements that reached hired status."
              Icon={Trophy}
              accent="#F59E0B"
            />
            <StatCard
              label="Average fit score"
              value={`${data.stats.avgFitScore}%`}
              hint="Calculated from applications where fit scoring has already been generated."
              Icon={Gauge}
              accent="#22D3EE"
            />
          </div>
        </section>

        <DashboardSection
          id="score"
          title="Readiness and score"
          description="A cleaner view of how your profile strength is evolving, alongside time-sensitive actions you should not miss."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1.35fr 0.95fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Opportunity score trend"
              description="Recent score movements based on profile changes, achievements, and application activity."
              action={<Tag label={`${data.stats.totalBadges} badges earned`} tone="info" />}
            >
              <TrendLine values={data.scoreHistory.map((point) => point.score)} />
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                  gap: 12,
                  marginTop: 18,
                }}
                className="dashboard-mini-grid"
              >
                {data.scoreHistory.slice(-3).map((point) => (
                  <div
                    key={`${point.date}-${point.reason}`}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                  >
                    <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                      {formatShortDate(point.date)}
                    </div>
                    <div
                      style={{
                        marginTop: 8,
                        fontSize: 24,
                        fontWeight: 900,
                        color: '#1E293B',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {point.score}
                    </div>
                    <div
                      style={{
                        marginTop: 4,
                        fontSize: 12,
                        color: point.delta >= 0 ? '#10B981' : '#F59E0B',
                        fontWeight: 700,
                      }}
                    >
                      {point.delta >= 0 ? '+' : ''}
                      {point.delta} points
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, lineHeight: 1.55, color: '#64748B' }}>
                      {point.reason}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>

            <div id="deadlines">
              <Panel
                title="Priority deadlines"
                description="Roles you already engaged with that need attention soon."
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
                        style={{
                          padding: 16,
                          borderRadius: 18,
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
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
                            <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                              {deadline.jobTitle}
                            </div>
                            <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
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
                            color: '#64748B',
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
            </div>
          </div>
        </DashboardSection>

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
                            color: '#64748B',
                            fontSize: 13,
                          }}
                        >
                          <span>{application.companyName}</span>
                          {application.industry ? <span>{application.industry}</span> : null}
                          <span>Applied {formatShortDate(application.appliedAt)}</span>
                        </div>
                      </div>
                      <div style={{ display: 'grid', gap: 6, justifyItems: 'end' }}>
                        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B' }}>
                          Fit score
                        </div>
                        <div
                          style={{
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
                title="No applications yet"
                description="Once you apply to jobs or internships, your live pipeline will show up here."
              />
            )}
          </Panel>
        </DashboardSection>

        <DashboardSection
          id="recommended"
          title="Recommended opportunities"
          description="Suggestions below are based on active jobs that still match your current department, skills, and profile direction."
        >
          {data.recommendedJobs.length > 0 ? (
            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
              className="dashboard-card-grid"
            >
              {data.recommendedJobs.map((job) => (
                <Panel
                  key={job._id}
                  title={job.title}
                  description={job.companyName}
                  action={<Tag label={`${job.fitScore ?? 0}% match`} tone="info" />}
                >
                  <div style={{ display: 'grid', gap: 12 }}>
                    <div
                      style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                    >
                      <Tag label={formatStatusLabel(job.type)} tone="neutral" />
                      <Tag label={formatStatusLabel(job.locationType)} tone="neutral" />
                      {job.city ? <Tag label={job.city} tone="neutral" /> : null}
                    </div>
                    <div style={{ display: 'grid', gap: 8, color: '#64748B', fontSize: 13 }}>
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
                        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                          Compensation
                        </div>
                        <div
                          style={{ marginTop: 4, fontSize: 15, color: '#1E293B', fontWeight: 800 }}
                        >
                          {formatCurrency(job.stipendBDT)}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>
                          Applications
                        </div>
                        <div
                          style={{ marginTop: 4, fontSize: 15, color: '#1E293B', fontWeight: 800 }}
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

        <DashboardSection
          id="skills"
          title="Skills and credentials"
          description="This combines badge activity with the hard and soft gaps detected across your existing applications."
        >
          <div
            style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            className="dashboard-grid-two"
          >
            <Panel
              title="Skill gap summary"
              description="Live insight into the competencies that most often hold your applications back."
            >
              <div style={{ display: 'grid', gap: 18 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                    gap: 12,
                  }}
                  className="dashboard-mini-grid"
                >
                  <StatCard
                    label="Hard gaps"
                    value={formatCompactNumber(data.skillGapSummary.totalHardGaps)}
                    Icon={Target}
                    accent="#F59E0B"
                  />
                  <StatCard
                    label="Soft gaps"
                    value={formatCompactNumber(data.skillGapSummary.totalSoftGaps)}
                    Icon={UserRound}
                    accent="#22D3EE"
                  />
                  <StatCard
                    label="Closed gaps"
                    value={formatCompactNumber(data.skillGapSummary.closedGapsCount)}
                    Icon={CheckCircle2}
                    accent="#10B981"
                  />
                </div>
                <div>
                  <div
                    style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}
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
                    style={{ fontSize: 13, fontWeight: 700, color: '#1E293B', marginBottom: 10 }}
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
                      style={{
                        padding: 16,
                        borderRadius: 18,
                        background: '#F8FAFC',
                        border: '1px solid #E2E8F0',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: 14,
                            background: '#EFF6FF',
                            color: '#2563EB',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Award size={20} strokeWidth={2} />
                        </div>
                        <div>
                          <div style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>
                            {badge.badgeName}
                          </div>
                          <div style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>
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

        <style>{`
          @media (max-width: 1180px) {
            .dashboard-card-grid {
              grid-template-columns: 1fr 1fr !important;
            }
          }

          @media (max-width: 960px) {
            .dashboard-stats-grid,
            .dashboard-grid-two,
            .dashboard-card-grid,
            .dashboard-mini-grid,
            .dashboard-inline-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
