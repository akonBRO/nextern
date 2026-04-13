// src/app/advisor/events/[eventId]/registrants/page.tsx
// Shows all students who registered for an advisor-posted event

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
import {
  DashboardPage,
  DashboardSection,
  EmptyState,
  HeroCard,
  ActionLink,
  Panel,
  StatCard,
  Tag,
  formatCompactNumber,
  formatShortDate,
  formatStatusLabel,
} from '@/components/dashboard/DashboardContent';
import { Users, CheckCircle2, CalendarDays, FileText } from 'lucide-react';

const navItems = [
  { label: 'Overview', href: '/advisor/dashboard', icon: 'dashboard' as const },
  {
    label: 'Events',
    icon: 'calendar' as const,
    items: [
      {
        label: 'My Events',
        href: '/advisor/events',
        description: 'View and manage your posted events.',
        icon: 'file' as const,
      },
      {
        label: 'Post Event',
        href: '/advisor/events/new',
        description: 'Publish a webinar or workshop.',
        icon: 'calendar' as const,
      },
    ],
  },
  { label: 'My Profile', href: '/advisor/profile', icon: 'users' as const },
];

async function getRegistrantsData(eventId: string, advisorId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(advisorId);
  const eid = new mongoose.Types.ObjectId(eventId);

  const [advisor, event, registrations, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select('name email image institutionName advisoryDepartment designation')
      .lean(),
    Job.findOne({ _id: eid, employerId: oid }).lean(),
    Application.find({ jobId: eid, isEventRegistration: true })
      .populate(
        'studentId',
        'name email university department yearOfStudy cgpa skills image resumeUrl'
      )
      .sort({ appliedAt: -1 })
      .lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  if (!event) return null;

  const stats = {
    total: registrations.length,
    confirmed: registrations.filter((r) => r.status === 'applied' || r.status === 'shortlisted')
      .length,
  };

  return {
    advisor,
    event,
    registrations,
    stats,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function EventRegistrantsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'advisor' && session.user.role !== 'dept_head') {
    redirect('/advisor/dashboard');
  }

  const { eventId } = await params;
  const data = await getRegistrantsData(eventId, session.user.id);
  if (!data) redirect('/advisor/events');

  const { advisor, event, registrations, stats, chrome } = data;

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={navItems}
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
        <HeroCard
          eyebrow={formatStatusLabel(event.type)}
          title={event.title}
          description={`${event.city ? `${event.city} · ` : ''}${formatStatusLabel(event.locationType)} · Deadline ${formatShortDate(event.applicationDeadline?.toISOString())}`}
          actions={
            <>
              <ActionLink href={`/advisor/events/${eventId}/edit`} label="Edit event" />
              <ActionLink href="/advisor/events" label="All events" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Registration summary"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                {[
                  { label: 'Total', value: stats.total, color: '#F8FAFC' },
                  { label: 'Confirmed', value: stats.confirmed, color: '#10B981' },
                  {
                    label: 'Status',
                    value: event.isActive ? 'Active' : 'Closed',
                    color: event.isActive ? '#22D3EE' : '#F59E0B',
                  },
                  {
                    label: 'Days left',
                    value: event.applicationDeadline
                      ? Math.max(
                          0,
                          Math.ceil(
                            (new Date(event.applicationDeadline).getTime() - new Date().getTime()) /
                              86400000
                          )
                        )
                      : '—',
                    color: '#F8FAFC',
                  },
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
                        fontSize: 20,
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

        {/* Stat cards */}
        <section style={{ marginTop: 22 }}>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 16 }}
          >
            <StatCard
              label="Total registrants"
              value={formatCompactNumber(stats.total)}
              Icon={Users}
            />
            <StatCard
              label="Confirmed"
              value={formatCompactNumber(stats.confirmed)}
              Icon={CheckCircle2}
              accent="#10B981"
            />
            <StatCard
              label="Event deadline"
              value={formatShortDate(event.applicationDeadline?.toISOString())}
              Icon={CalendarDays}
              accent="#7C3AED"
            />
          </div>
        </section>

        {/* Registrants list */}
        <DashboardSection
          id="registrants"
          title="Registered students"
          description="All students who registered for this event, sorted by registration date."
        >
          <Panel title="Registrant list" description="Student details and registration status.">
            {registrations.length === 0 ? (
              <EmptyState
                title="No registrations yet"
                description="Students will appear here as they register for this event."
              />
            ) : (
              <div style={{ display: 'grid', gap: 12 }}>
                {registrations.map((reg) => {
                  const student = reg.studentId as {
                    _id: string;
                    name: string;
                    email: string;
                    university?: string;
                    department?: string;
                    yearOfStudy?: number;
                    cgpa?: number;
                    skills?: string[];
                    image?: string;
                    resumeUrl?: string;
                  };

                  return (
                    <div
                      key={reg._id.toString()}
                      style={{
                        background: '#fff',
                        borderRadius: 16,
                        border: '1px solid #E2E8F0',
                        padding: '16px 20px',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 14,
                          flexWrap: 'wrap',
                        }}
                      >
                        {/* Avatar */}
                        <div
                          style={{
                            width: 42,
                            height: 42,
                            borderRadius: '50%',
                            background: 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 16,
                            fontWeight: 700,
                            flexShrink: 0,
                            overflow: 'hidden',
                          }}
                        >
                          {student?.image ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={student.image}
                              alt=""
                              style={{
                                width: 42,
                                height: 42,
                                borderRadius: '50%',
                                objectFit: 'cover',
                              }}
                            />
                          ) : (
                            (student?.name?.charAt(0) ?? '?')
                          )}
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 180 }}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                              marginBottom: 4,
                            }}
                          >
                            <h3
                              style={{
                                fontSize: 15,
                                fontWeight: 800,
                                color: '#0F172A',
                                margin: 0,
                                fontFamily: 'var(--font-display)',
                              }}
                            >
                              {student?.name ?? 'Unknown'}
                            </h3>
                            <Tag label="Registered" tone="success" />
                          </div>
                          <div style={{ color: '#64748B', fontSize: 13 }}>
                            {student?.university}
                            {student?.department && ` · ${student.department}`}
                            {student?.yearOfStudy && ` · Year ${student.yearOfStudy}`}
                            {student?.cgpa && (
                              <span style={{ color: '#10B981', fontWeight: 600 }}>
                                {' '}
                                · CGPA {student.cgpa}
                              </span>
                            )}
                            <span style={{ color: '#94A3B8', marginLeft: 8 }}>
                              Registered {formatShortDate(reg.appliedAt?.toISOString())}
                            </span>
                          </div>
                          {student?.skills && student.skills.length > 0 && (
                            <div
                              style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginTop: 8 }}
                            >
                              {student.skills.slice(0, 5).map((s: string) => (
                                <span
                                  key={s}
                                  style={{
                                    background: '#F1F5F9',
                                    color: '#475569',
                                    padding: '2px 8px',
                                    borderRadius: 999,
                                    fontSize: 11,
                                    fontWeight: 600,
                                  }}
                                >
                                  {s}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Action buttons */}
                        <div
                          style={{
                            display: 'flex',
                            flexDirection: 'column',
                            gap: 8,
                            flexShrink: 0,
                            alignSelf: 'center',
                          }}
                        >
                          {/* View Application */}
                          <Link
                            href={`/advisor/events/${eventId}/registrants/${student?._id}`}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              background: '#EFF6FF',
                              color: '#2563EB',
                              border: '1px solid #BFDBFE',
                              padding: '8px 14px',
                              borderRadius: 10,
                              fontSize: 12,
                              fontWeight: 700,
                              textDecoration: 'none',
                            }}
                          >
                            <FileText size={13} /> View Application
                          </Link>

                          {/* View Resume / No resume */}
                          {student?.resumeUrl ? (
                            <a
                              href={student.resumeUrl}
                              target="_blank"
                              rel="noreferrer"
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#ECFDF5',
                                color: '#065F46',
                                border: '1px solid #A7F3D0',
                                padding: '8px 14px',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              <FileText size={13} /> View Resume
                            </a>
                          ) : (
                            <div
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                background: '#F8FAFC',
                                color: '#94A3B8',
                                border: '1px solid #E2E8F0',
                                padding: '8px 14px',
                                borderRadius: 10,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              <FileText size={13} /> No resume
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Panel>
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
