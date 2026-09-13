import ContextIcon from '@/components/ui/ContextIcon';
// src/app/advisor/events/page.tsx
// Advisor's posted events — view, manage, close

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import Link from 'next/link';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';
import {
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  ActionLink,
  Panel,
  StatCard,
  formatCompactNumber,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { CalendarDays, Users, Clock, FileText } from 'lucide-react';
import CloseJobButton from '@/app/employer/jobs/CloseJobButton';
import PaginatedCollection from '@/components/ui/PaginatedCollection';

const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  webinar: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  workshop: { bg: '#e0f0eb', color: '#087f72', border: '#bdddd5' },
};

async function getEventsData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [advisor, events, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select('name email image institutionName advisoryDepartment designation')
      .lean(),
    Job.find({ employerId: oid, type: { $in: ['webinar', 'workshop'] } })
      .sort({ createdAt: -1 })
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  // Get registration counts per event
  const eventIds = events.map((e) => e._id);
  const regCounts = eventIds.length
    ? await Application.aggregate([
        { $match: { jobId: { $in: eventIds }, isEventRegistration: true } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
      ])
    : [];

  const regMap = new Map(
    regCounts.map((r: { _id: mongoose.Types.ObjectId; count: number }) => [
      r._id.toString(),
      r.count,
    ])
  );

  // Get application counts per event (non-event registrations)
  const appCounts = eventIds.length
    ? await Application.aggregate([
        { $match: { jobId: { $in: eventIds }, isEventRegistration: false } },
        { $group: { _id: '$jobId', count: { $sum: 1 } } },
      ])
    : [];

  const appMap = new Map(
    appCounts.map((a: { _id: mongoose.Types.ObjectId; count: number }) => [
      a._id.toString(),
      a.count,
    ])
  );

  const stats = {
    total: events.length,
    active: events.filter((e) => e.isActive).length,
    closed: events.filter((e) => !e.isActive).length,
    totalRegistrations: regCounts.reduce((s: number, r: { count: number }) => s + r.count, 0),
  };

  return {
    advisor,
    events: events.map((e) => ({
      _id: e._id.toString(),
      title: e.title,
      type: e.type,
      locationType: e.locationType,
      city: e.city,
      isActive: e.isActive,
      applicationDeadline: e.applicationDeadline,
      targetUniversities: e.targetUniversities ?? [],
      targetDepartments: e.targetDepartments ?? [],
      academicSession: e.academicSession,
      viewCount: e.viewCount ?? 0,
      registrationCount: regMap.get(e._id.toString()) ?? 0,
      applicationCount: appMap.get(e._id.toString()) ?? 0,
    })),
    stats,
    chrome: {
      unreadNotifications: unreadNotifs,
      unreadMessages: unreadMsgs,
    },
  };
}

export default async function AdvisorEventsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'advisor' && session.user.role !== 'dept_head') {
    redirect('/advisor/dashboard');
  }

  const { advisor, events, stats, chrome } = await getEventsData(session.user.id);

  return (
    <DashboardShell
      embedded
      role="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={ADVISOR_NAV_ITEMS}
      user={{
        name: advisor?.name ?? 'Advisor',
        email: advisor?.email ?? '',
        image: advisor?.image,
        subtitle:
          [advisor?.designation, advisor?.institutionName].filter(Boolean).join(' · ') ||
          'Advisor workspace',
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
        userId: session.user.id,
      }}
    >
      <DashboardPage>
        {/* ── Hero ── */}
        <HeroCard
          eyebrow="My events"
          title="Webinars & Workshops"
          description="All the academic events you have published for students. Track registrations, manage status, and post new events from here."
          actions={
            <>
              <ActionLink href="/advisor/events/new" label="Post New Event" />
            </>
          }
          aside={
            <Panel
              title="Event summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div
                style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}
                className="v2-page-grid"
              >
                {[
                  { label: 'Total Events', value: stats.total, color: '#f6f8f9' },
                  { label: 'Active', value: stats.active, color: '#168257' },
                  { label: 'Registrations', value: stats.totalRegistrations, color: '#178d80' },
                  { label: 'Closed', value: stats.closed, color: '#a86714' },
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
                        fontSize: 22,
                        fontWeight: 700,
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

        {/* ── Stat cards ── */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
            className="v2-form-grid"
          >
            <StatCard
              label="Total events"
              value={formatCompactNumber(stats.total)}
              Icon={CalendarDays}
              accent="#087f72"
            />
            <StatCard
              label="Active events"
              value={formatCompactNumber(stats.active)}
              Icon={Clock}
              accent="#168257"
            />
            <StatCard
              label="Total registrations"
              value={formatCompactNumber(stats.totalRegistrations)}
              Icon={Users}
              accent="#178d80"
            />
          </div>
        </section>

        {/* ── Events list ── */}
        <DashboardSection
          id="events"
          title="All events"
          description="Your complete list of posted webinars and workshops. Click View Registrants to see who signed up."
        >
          {events.length === 0 ? (
            <Panel title="No events posted yet" description="">
              <EmptyState
                title="Start publishing events"
                description="Post your first webinar or workshop to help students build skills and stay engaged with academic opportunities."
              />
            </Panel>
          ) : (
            <PaginatedCollection
              itemLabel="events"
              style={{ display: 'flex', flexDirection: 'column', gap: 14 }}
            >
              {events.map((event) => {
                const typeStyle = TYPE_COLORS[event.type] ?? TYPE_COLORS['webinar'];
                const deadline = event.applicationDeadline
                  ? new Date(event.applicationDeadline)
                  : null;
                const now = deadline ? new Date() : null;
                const daysLeft =
                  deadline && now
                    ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000)
                    : null;
                const isExpired = daysLeft !== null && daysLeft < 0;
                const isUrgent = daysLeft !== null && daysLeft <= 3 && daysLeft >= 0;

                return (
                  <div
                    className="nx-surface"
                    key={event._id}
                    style={{
                      background: '#fff',
                      borderRadius: 12,
                      border: `1px solid ${isUrgent ? '#FDE68A' : '#dfe6e9'}`,
                      padding: '20px 24px',
                      boxShadow: isUrgent
                        ? '0 0 0 3px rgba(245,158,11,0.08)'
                        : '0 2px 8px rgba(0,0,0,0.04)',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 16,
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* ── Left ── */}
                      <div style={{ flex: 1, minWidth: 200 }}>
                        {/* Badges row */}
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            marginBottom: 10,
                          }}
                        >
                          <span
                            style={{
                              background: typeStyle.bg,
                              color: typeStyle.color,
                              border: `1px solid ${typeStyle.border}`,
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            {event.type === 'webinar' ? (
                              <ContextIcon name="globe" />
                            ) : (
                              <ContextIcon name="tool" />
                            )}{' '}
                            {formatStatusLabel(event.type)}
                          </span>

                          <span
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 5,
                              background: event.isActive ? '#ECFDF5' : '#f6f8f9',
                              color: event.isActive ? '#065F46' : '#60717d',
                              border: `1px solid ${event.isActive ? '#A7F3D0' : '#dfe6e9'}`,
                              padding: '3px 10px',
                              borderRadius: 999,
                              fontSize: 11,
                              fontWeight: 700,
                            }}
                          >
                            <span
                              style={{
                                width: 6,
                                height: 6,
                                borderRadius: '50%',
                                background: event.isActive ? '#168257' : '#60717d',
                                display: 'inline-block',
                              }}
                            />
                            {event.isActive ? 'Active' : 'Closed'}
                          </span>

                          {isUrgent && (
                            <span
                              style={{
                                background: '#FFFBEB',
                                color: '#92400E',
                                border: '1px solid #FDE68A',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 11,
                                fontWeight: 700,
                              }}
                            >
                              <ContextIcon name="zap" /> Closing soon
                            </span>
                          )}
                        </div>

                        {/* Title */}
                        <h3
                          style={{
                            fontSize: 17,
                            fontWeight: 700,
                            color: '#182c39',
                            fontFamily: 'var(--font-display)',
                            margin: 0,
                            marginBottom: 8,
                          }}
                        >
                          {event.title}
                        </h3>

                        {/* Meta */}
                        <div
                          style={{
                            display: 'flex',
                            flexWrap: 'wrap',
                            gap: 14,
                            color: '#60717d',
                            fontSize: 13,
                          }}
                        >
                          {event.city && (
                            <span>
                              <ContextIcon name="location" /> {event.city} ·{' '}
                              {formatStatusLabel(event.locationType)}
                            </span>
                          )}
                          {!event.city && (
                            <span>
                              <ContextIcon name="location" />{' '}
                              {formatStatusLabel(event.locationType)}
                            </span>
                          )}
                          {deadline && (
                            <span
                              style={{
                                color: isUrgent ? '#a86714' : isExpired ? '#EF4444' : '#60717d',
                                fontWeight: isUrgent || isExpired ? 700 : 400,
                              }}
                            >
                              <ContextIcon name="calendar" />{' '}
                              {isExpired
                                ? 'Registration closed'
                                : isUrgent
                                  ? `${daysLeft}d left — Urgent`
                                  : `${daysLeft}d left`}
                            </span>
                          )}
                          {event.academicSession && (
                            <span>
                              <ContextIcon name="graduation" /> {event.academicSession}
                            </span>
                          )}
                        </div>

                        {/* Targeting chips */}
                        {(event.targetDepartments.length > 0 ||
                          event.targetUniversities.length > 0) && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 10 }}>
                            {event.targetDepartments.slice(0, 3).map((d: string) => (
                              <span
                                key={d}
                                style={{
                                  background: '#f6f8f9',
                                  color: '#475569',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {d}
                              </span>
                            ))}
                            {event.targetUniversities.slice(0, 2).map((u: string) => (
                              <span
                                key={u}
                                style={{
                                  background: '#edf7f3',
                                  color: '#087f72',
                                  padding: '2px 8px',
                                  borderRadius: 999,
                                  fontSize: 11,
                                  fontWeight: 600,
                                }}
                              >
                                {u}
                              </span>
                            ))}
                            {event.targetDepartments.length > 3 && (
                              <span style={{ color: '#60717d', fontSize: 11, padding: '2px 4px' }}>
                                +{event.targetDepartments.length - 3} more
                              </span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* ── Right — registration count ── */}
                      <div style={{ textAlign: 'center', flexShrink: 0 }}>
                        <div
                          style={{
                            fontSize: 32,
                            fontWeight: 700,
                            color: '#087f72',
                            fontFamily: 'var(--font-display)',
                            lineHeight: 1,
                          }}
                        >
                          {formatCompactNumber(event.registrationCount)}
                        </div>
                        <div
                          style={{ fontSize: 11, color: '#60717d', marginTop: 4, fontWeight: 600 }}
                        >
                          Registrations
                        </div>
                      </div>
                    </div>

                    {/* ── Action buttons ── */}
                    <div
                      style={{
                        display: 'flex',
                        gap: 10,
                        marginTop: 16,
                        paddingTop: 14,
                        borderTop: '1px solid #f6f8f9',
                        flexWrap: 'wrap',
                      }}
                    >
                      {/* View Registrants */}
                      <Link
                        href={`/advisor/events/${event._id}/registrants`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#182c39',
                          color: '#fff',
                          padding: '8px 16px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        <Users size={13} /> View Registrants
                      </Link>

                      {/* ── View Applications ── */}
                      <Link
                        href={`/advisor/events/${event._id}/applicants`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#edf7f3',
                          color: '#087f72',
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid #bdddd5',
                        }}
                      >
                        <FileText size={13} /> View Applications
                        {event.applicationCount > 0 && (
                          <span
                            style={{
                              background: '#087f72',
                              color: '#fff',
                              borderRadius: 999,
                              padding: '1px 7px',
                              fontSize: 11,
                              fontWeight: 700,
                              marginLeft: 2,
                            }}
                          >
                            {event.applicationCount}
                          </span>
                        )}
                      </Link>

                      {/* Edit */}
                      <Link
                        href={`/advisor/events/${event._id}/edit`}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 6,
                          background: '#e0f0eb',
                          color: '#087f72',
                          padding: '8px 14px',
                          borderRadius: 10,
                          fontSize: 12,
                          fontWeight: 600,
                          textDecoration: 'none',
                          border: '1px solid #bdddd5',
                        }}
                      >
                        Edit
                      </Link>

                      {/* Close listing — only if active */}
                      {event.isActive && <CloseJobButton jobId={event._id} />}
                    </div>
                  </div>
                );
              })}
            </PaginatedCollection>
          )}
        </DashboardSection>

        <style>{`
          @media (max-width: 960px) {
            .dashboard-stats-grid {
              grid-template-columns: repeat(2, 1fr) !important;
            }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
