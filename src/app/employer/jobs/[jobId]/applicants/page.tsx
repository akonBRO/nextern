// src/app/employer/jobs/[jobId]/applicants/page.tsx
// Employer applicant pipeline for a specific job — uses DashboardShell

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  HeroCard,
  ActionLink,
  Panel,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { Users, CheckCircle2, Clock3, Trophy } from 'lucide-react';
import ApplicantActions from './ApplicantActions';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
];

async function getApplicantsData(jobId: string, employerId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(employerId);
  const jid = new mongoose.Types.ObjectId(jobId);

  const [employer, job, rawApplications, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid).select('name email image companyName').lean(),
    Job.findOne({ _id: jid, employerId: oid }).lean(),
    Application.find({ jobId: jid, employerId: oid, isEventRegistration: false })
      .populate(
        'studentId',
        'name email university department cgpa skills opportunityScore resumeUrl image yearOfStudy'
      )
      .sort({ fitScore: -1, appliedAt: -1 })
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  if (!job) return null;

  const applications = rawApplications;

  const stats = {
    total: applications.length,
    shortlisted: applications.filter((a) => ['shortlisted', 'under_review'].includes(a.status))
      .length,
    interviews: applications.filter((a) => a.status === 'interview_scheduled').length,
    hired: applications.filter((a) => a.status === 'hired').length,
  };

  const universityBreakdown: Record<
    string,
    {
      total: number;
      shortlisted: number;
      hired: number;
      avgFit: number;
      fitScores: number[];
    }
  > = {};

  if (job.isBatchHiring) {
    (job.batchUniversities ?? []).forEach((uni: string) => {
      universityBreakdown[uni] = { total: 0, shortlisted: 0, hired: 0, avgFit: 0, fitScores: [] };
    });

    applications.forEach((app) => {
      const student = app.studentId as { university?: string };
      const uni = student?.university;
      if (!uni) return;
      if (!universityBreakdown[uni]) {
        universityBreakdown[uni] = { total: 0, shortlisted: 0, hired: 0, avgFit: 0, fitScores: [] };
      }
      universityBreakdown[uni].total += 1;
      if (
        ['shortlisted', 'under_review', 'assessment_sent', 'interview_scheduled'].includes(
          app.status
        )
      ) {
        universityBreakdown[uni].shortlisted += 1;
      }
      if (app.status === 'hired') universityBreakdown[uni].hired += 1;
      if (typeof app.fitScore === 'number') universityBreakdown[uni].fitScores.push(app.fitScore);
    });

    Object.keys(universityBreakdown).forEach((uni) => {
      const scores = universityBreakdown[uni].fitScores;
      universityBreakdown[uni].avgFit = scores.length
        ? Math.round(scores.reduce((s, v) => s + v, 0) / scores.length)
        : 0;
    });
  }

  const universityStats = Object.entries(universityBreakdown)
    .map(([university, data]) => ({ university, ...data }))
    .sort((a, b) => b.total - a.total);

  return {
    employer,
    job,
    applications,
    stats,
    universityStats,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function ApplicantsPage({ params }: { params: Promise<{ jobId: string }> }) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const { jobId } = await params;
  const data = await getApplicantsData(jobId, session.user.id);
  if (!data) redirect('/employer/jobs');

  const { employer, job, stats, universityStats, chrome } = data;

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={navItems}
      user={{
        name: employer?.name ?? 'Employer',
        email: employer?.email ?? '',
        image: employer?.image,
        subtitle: employer?.companyName ?? 'Employer workspace',
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Applicant pipeline"
          title={job.title}
          description={`${job.companyName} · ${job.city ? `${job.city} · ` : ''}${formatStatusLabel(job.locationType)} · Deadline ${formatShortDate(job.applicationDeadline?.toISOString())}`}
          actions={
            <>
              <ActionLink href={`/employer/jobs/${jobId}/edit`} label="Edit listing" />
              <ActionLink href="/employer/jobs" label="All listings" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Pipeline summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total', value: stats.total, color: '#F8FAFC' },
                  { label: 'Shortlisted', value: stats.shortlisted, color: '#22D3EE' },
                  { label: 'Interviews', value: stats.interviews, color: '#F59E0B' },
                  { label: 'Hired', value: stats.hired, color: '#10B981' },
                ].map((s) => (
                  <div
                    key={s.label}
                    style={{
                      background: 'rgba(255,255,255,0.08)',
                      borderRadius: 12,
                      padding: '12px 14px',
                      border: '1px solid rgba(255,255,255,0.1)',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 24,
                        fontWeight: 900,
                        color: s.color,
                        fontFamily: 'var(--font-display)',
                        lineHeight: 1,
                      }}
                    >
                      {s.value}
                    </div>
                    <div style={{ color: '#9FB4D0', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
                      {s.label}
                    </div>
                  </div>
                ))}
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
              label="Total applicants"
              value={formatCompactNumber(stats.total)}
              Icon={Users}
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(stats.shortlisted)}
              Icon={CheckCircle2}
              accent="#22D3EE"
            />
            <StatCard
              label="Interviews scheduled"
              value={formatCompactNumber(stats.interviews)}
              Icon={Clock3}
              accent="#F59E0B"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(stats.hired)}
              Icon={Trophy}
              accent="#10B981"
            />
          </div>
        </section>

        {job.isBatchHiring && universityStats.length > 0 && (
          <DashboardSection
            id="university-breakdown"
            title="University-wise breakdown"
            description="Applicant distribution across all batch universities for this role."
          >
            <Panel
              title="Batch hiring analytics"
              description="Tracks how many students applied from each targeted university."
              action={
                <Tag label={`${job.batchUniversities?.length ?? 0} universities`} tone="info" />
              }
            >
              <div style={{ display: 'grid', gap: 12 }}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 90px 70px 80px',
                    gap: 12,
                    padding: '8px 14px',
                  }}
                >
                  {['University', 'Total', 'Shortlisted', 'Hired', 'Avg Fit'].map((h) => (
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

                {universityStats.map((row, i) => {
                  const pct = stats.total > 0 ? Math.round((row.total / stats.total) * 100) : 0;
                  return (
                    <div
                      key={row.university}
                      style={{
                        background: i % 2 === 0 ? '#F8FAFC' : '#fff',
                        borderRadius: 12,
                        border: '1px solid #E2E8F0',
                        padding: '14px',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          display: 'grid',
                          gridTemplateColumns: '1fr 80px 90px 70px 80px',
                          gap: 12,
                          alignItems: 'center',
                          marginBottom: row.total > 0 ? 10 : 0,
                        }}
                      >
                        <div>
                          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A' }}>
                            {row.university}
                          </div>
                          <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 2 }}>
                            {pct}% of total
                          </div>
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: '#2563EB',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {row.total}
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: '#22D3EE',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {row.shortlisted}
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color: '#10B981',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {row.hired}
                        </div>
                        <div
                          style={{
                            fontSize: 20,
                            fontWeight: 900,
                            color:
                              row.avgFit >= 70
                                ? '#10B981'
                                : row.avgFit >= 40
                                  ? '#F59E0B'
                                  : '#94A3B8',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {row.avgFit > 0 ? `${row.avgFit}%` : '—'}
                        </div>
                      </div>
                      {row.total > 0 && (
                        <div
                          style={{
                            height: 5,
                            background: '#E2E8F0',
                            borderRadius: 999,
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              width: `${pct}%`,
                              height: '100%',
                              background: 'linear-gradient(90deg, #2563EB, #22D3EE)',
                              borderRadius: 999,
                            }}
                          />
                        </div>
                      )}
                      {row.total === 0 && (
                        <div style={{ fontSize: 12, color: '#94A3B8', fontStyle: 'italic' }}>
                          No applicants yet from this university
                        </div>
                      )}
                    </div>
                  );
                })}

                <div
                  style={{
                    background: '#0F172A',
                    borderRadius: 12,
                    padding: '14px 16px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    flexWrap: 'wrap',
                    gap: 12,
                  }}
                >
                  <div style={{ color: '#94A3B8', fontSize: 13, fontWeight: 600 }}>
                    Total across all universities
                  </div>
                  <div style={{ display: 'flex', gap: 24 }}>
                    {[
                      { label: 'Applied', value: stats.total, color: '#2563EB' },
                      { label: 'Shortlisted', value: stats.shortlisted, color: '#22D3EE' },
                      { label: 'Hired', value: stats.hired, color: '#10B981' },
                    ].map((s) => (
                      <div key={s.label} style={{ textAlign: 'center' }}>
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
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>
                          {s.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Panel>
          </DashboardSection>
        )}

        <style>{`
          @media (max-width: 960px) {
            .dashboard-stats-grid { grid-template-columns: repeat(2, 1fr) !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
