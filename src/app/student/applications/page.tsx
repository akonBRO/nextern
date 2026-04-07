// src/app/student/applications/page.tsx
// Student application tracker — uses DashboardShell
// Tabs: Applications | Events — Fully Responsive

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  HeroCard,
  ActionLink,
  Panel,
  StatCard,
  formatCompactNumber,
} from '@/components/dashboard/DashboardContent';
import { BriefcaseBusiness, CheckCircle2, Trophy, CalendarDays } from 'lucide-react';
import ApplicationsTabs from './ApplicationsTabs';

/* ─── Data fetcher ───────────────────────────────────────────────────────────── */
async function getApplicationsData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [student, allApplications, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid).select('name email image university department').lean(),
    Application.find({ studentId: oid })
      .populate('jobId', 'title type companyName city locationType applicationDeadline isActive')
      .sort({ appliedAt: -1 })
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  const applications = allApplications.filter((a) => !a.isEventRegistration);
  const events = allApplications.filter((a) => a.isEventRegistration);

  const withFit = applications.filter((a) => typeof a.fitScore === 'number');
  const stats = {
    totalApps: applications.length,
    totalEvents: events.length,
    shortlisted: applications.filter((a) =>
      ['shortlisted', 'under_review', 'assessment_sent', 'interview_scheduled'].includes(a.status)
    ).length,
    hired: applications.filter((a) => a.status === 'hired').length,
    avgFit: withFit.length
      ? Math.round(withFit.reduce((s, a) => s + (a.fitScore ?? 0), 0) / withFit.length)
      : 0,
  };

  const serialize = (app: (typeof allApplications)[0]) => {
    const job = app.jobId as {
      _id: string;
      title: string;
      type: string;
      companyName: string;
      city?: string;
      locationType: string;
      applicationDeadline?: Date;
    } | null;
    return {
      _id: app._id.toString(),
      status: app.status,
      coverLetter: app.coverLetter ?? null,
      resumeUrlSnapshot: app.resumeUrlSnapshot ?? null,
      appliedAt: app.appliedAt?.toISOString() ?? new Date().toISOString(),
      fitScore: app.fitScore ?? null,
      isEventRegistration: app.isEventRegistration,
      statusHistory: (app.statusHistory ?? []).map((h: { status: string; changedAt?: Date }) => ({
        status: h.status,
        changedAt: (h.changedAt as Date)?.toISOString() ?? new Date().toISOString(),
      })),
      job: job
        ? {
            _id: job._id.toString(),
            title: job.title,
            type: job.type,
            companyName: job.companyName,
            city: job.city ?? null,
            locationType: job.locationType,
            applicationDeadline: job.applicationDeadline?.toISOString() ?? null,
          }
        : null,
    };
  };

  return {
    student,
    applications: applications.map(serialize),
    events: events.map(serialize),
    stats,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

/* ─── Page ───────────────────────────────────────────────────────────────────── */
export default async function StudentApplicationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const { student, applications, events, stats, chrome } = await getApplicationsData(
    session.user.id
  );

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: student?.name ?? 'Student',
        email: student?.email ?? '',
        image: student?.image,
        subtitle:
          [student?.university, student?.department].filter(Boolean).join(' | ') ||
          'Student workspace',
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        {/* ── Hero ── */}
        <HeroCard
          eyebrow="Activity tracker"
          title="Your applications & events"
          description="Track every job application and event registration in one place. Status updates in real time as employers review your profile."
          actions={
            <>
              <ActionLink href="/student/jobs" label="Browse more jobs" />
              <ActionLink href="/student/dashboard" label="Back to dashboard" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              {/* Summary grid — 2-col on all sizes, text scales down on mobile */}
              <div className="summary-grid">
                {[
                  { label: 'Applications', value: stats.totalApps, color: '#F8FAFC' },
                  { label: 'Events', value: stats.totalEvents, color: '#22D3EE' },
                  { label: 'Shortlisted', value: stats.shortlisted, color: '#10B981' },
                  { label: 'Avg Fit', value: `${stats.avgFit}%`, color: '#F59E0B' },
                ].map((s) => (
                  <div key={s.label} className="summary-cell">
                    <div className="summary-value" style={{ color: s.color }}>
                      {s.value}
                    </div>
                    <div className="summary-label">{s.label}</div>
                  </div>
                ))}
              </div>
            </Panel>
          }
        />

        {/* ── Stat cards ── */}
        <section className="stats-section">
          <div className="stats-grid">
            <StatCard
              label="Job applications"
              value={formatCompactNumber(stats.totalApps)}
              Icon={BriefcaseBusiness}
            />
            <StatCard
              label="Events registered"
              value={formatCompactNumber(stats.totalEvents)}
              Icon={CalendarDays}
              accent="#22D3EE"
            />
            <StatCard
              label="Shortlisted"
              value={formatCompactNumber(stats.shortlisted)}
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Hired"
              value={formatCompactNumber(stats.hired)}
              Icon={Trophy}
              accent="#F59E0B"
            />
          </div>
        </section>

        {/* ── Tabbed content ── */}
        <DashboardSection
          id="activity"
          title="Activity"
          description="Switch between job applications and event registrations."
        >
          <ApplicationsTabs applications={applications} events={events} />
        </DashboardSection>

        {/* ── Responsive styles ── */}
        <style>{`
          /* Stats section spacing */
          .stats-section { margin-top: 20px; }

          /* Stats grid — 4 cols → 2 cols → 1 col */
          .stats-grid {
            display: grid;
            grid-template-columns: repeat(4, minmax(0, 1fr));
            gap: 14px;
          }

          /* Summary grid inside hero aside */
          .summary-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 10px;
          }
          .summary-cell {
            background: rgba(255,255,255,0.08);
            border-radius: 12px;
            padding: 12px 14px;
            border: 1px solid rgba(255,255,255,0.1);
          }
          .summary-value {
            font-size: 22px;
            font-weight: 900;
            font-family: var(--font-display, system-ui);
            line-height: 1;
          }
          .summary-label {
            color: #9FB4D0;
            font-size: 12px;
            margin-top: 4px;
            font-weight: 600;
          }

          /* ── Tablet (≤ 1024px): 2-col stats ── */
          @media (max-width: 1024px) {
            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
            }
          }

          /* ── Small tablet (≤ 768px) ── */
          @media (max-width: 768px) {
            .stats-section { margin-top: 16px; }
            .stats-grid { gap: 10px; }
            .summary-value { font-size: 20px; }
            .summary-cell { padding: 10px 12px; border-radius: 10px; }
          }

          /* ── Mobile (≤ 480px): 1-col stats ── */
          @media (max-width: 480px) {
            .stats-grid {
              grid-template-columns: repeat(2, minmax(0, 1fr));
              gap: 8px;
            }
            .stats-section { margin-top: 12px; }
            .summary-value { font-size: 18px; }
            .summary-label { font-size: 11px; }
            .summary-cell { padding: 9px 10px; border-radius: 9px; }
            .summary-grid { gap: 8px; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
