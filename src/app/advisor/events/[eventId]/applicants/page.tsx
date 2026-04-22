// src/app/advisor/events/[eventId]/applicants/page.tsx
// Advisor view — event detail + application summary (not a list of people)

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { User } from '@/models/User';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import mongoose from 'mongoose';
import Link from 'next/link';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  formatShortDate,
  formatStatusLabel,
  formatCompactNumber,
} from '@/components/dashboard/DashboardContent';
import { Users, MapPin, Clock, FileText, PencilLine } from 'lucide-react';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

async function getEventDetail(eventId: string, advisorId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(advisorId);
  const eid = new mongoose.Types.ObjectId(eventId);

  const [advisor, event, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid)
      .select('name email image institutionName advisoryDepartment designation')
      .lean(),
    Job.findOne({ _id: eid, employerId: oid, type: { $in: ['webinar', 'workshop'] } }).lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  if (!event) return null;

  const [appStats, regCount] = await Promise.all([
    Application.aggregate([
      { $match: { jobId: eid, isEventRegistration: false } },
      { $group: { _id: '$status', count: { $sum: 1 } } },
    ]),
    Application.countDocuments({ jobId: eid, isEventRegistration: true }),
  ]);

  const statusMap: Record<string, number> = {};
  let totalApplications = 0;
  appStats.forEach((s: { _id: string; count: number }) => {
    statusMap[s._id] = s.count;
    totalApplications += s.count;
  });

  return {
    advisor,
    event,
    totalApplications,
    regCount,
    statusMap,
    chrome: { unreadNotifications: unreadNotifs, unreadMessages: unreadMsgs },
  };
}

export default async function AdvisorEventApplicantsPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'advisor' && session.user.role !== 'dept_head') {
    redirect('/advisor/dashboard');
  }
  const isDeptHead = session.user.role === 'dept_head';
  const eventsBaseHref = isDeptHead ? '/dept/events' : '/advisor/events';

  const { eventId } = await params;
  const data = await getEventDetail(eventId, session.user.id);
  if (!data) redirect(eventsBaseHref);

  const { advisor, event, totalApplications, regCount, statusMap, chrome } = data;

  const deadline = event.applicationDeadline ? new Date(event.applicationDeadline) : null;
  const now = new Date();
  const daysLeft = deadline ? Math.ceil((deadline.getTime() - now.getTime()) / 86400000) : null;
  const isExpired = daysLeft !== null && daysLeft < 0;

  const pipelineStages = [
    { key: 'applied', label: 'Applied', color: '#2563EB', bg: '#EFF6FF', border: '#BFDBFE' },
    {
      key: 'under_review',
      label: 'Under Review',
      color: '#92400E',
      bg: '#FFFBEB',
      border: '#FDE68A',
    },
    {
      key: 'shortlisted',
      label: 'Shortlisted',
      color: '#065F46',
      bg: '#ECFDF5',
      border: '#A7F3D0',
    },
    {
      key: 'interview_scheduled',
      label: 'Interview',
      color: '#7C3AED',
      bg: '#EDE9FE',
      border: '#DDD6FE',
    },
    { key: 'hired', label: 'Hired', color: '#065F46', bg: '#DCFCE7', border: '#BBF7D0' },
    { key: 'rejected', label: 'Not Selected', color: '#991B1B', bg: '#FEF2F2', border: '#FECACA' },
  ];

  return (
    <DashboardShell
      role={isDeptHead ? 'departmentHead' : 'advisor'}
      roleLabel={isDeptHead ? 'Department dashboard' : 'Advisor dashboard'}
      homeHref={isDeptHead ? '/dept/dashboard' : '/advisor/dashboard'}
      navItems={isDeptHead ? DEPT_NAV_ITEMS : ADVISOR_NAV_ITEMS}
      user={{
        name: advisor?.name ?? (isDeptHead ? 'Department Head' : 'Advisor'),
        email: advisor?.email ?? '',
        image: advisor?.image,
        subtitle:
          [advisor?.designation, advisor?.institutionName].filter(Boolean).join(' · ') ||
          (isDeptHead ? 'Department workspace' : 'Advisor workspace'),
        unreadNotifications: chrome.unreadNotifications,
        unreadMessages: chrome.unreadMessages,
        userId: session.user.id,
      }}
    >
      <DashboardPage>
        <div style={{ maxWidth: 1100, margin: '0 auto' }}>
          {/* ── Hero banner ── */}
          <div
            style={{
              background: 'linear-gradient(145deg, #0F172A, #1E293B)',
              borderRadius: 24,
              padding: '32px 36px',
              marginBottom: 24,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: -60,
                right: -60,
                width: 220,
                height: 220,
                background: 'radial-gradient(circle, rgba(124,58,237,0.2) 0%, transparent 70%)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />

            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                justifyContent: 'space-between',
                gap: 20,
                flexWrap: 'wrap',
              }}
            >
              <div style={{ flex: 1 }}>
                {/* Badges */}
                <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                  <span
                    style={{
                      background:
                        event.type === 'webinar' ? 'rgba(3,105,161,0.3)' : 'rgba(124,58,237,0.3)',
                      color: event.type === 'webinar' ? '#BAE6FD' : '#DDD6FE',
                      border: `1px solid ${event.type === 'webinar' ? 'rgba(186,230,253,0.3)' : 'rgba(221,214,254,0.3)'}`,
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {event.type === 'webinar' ? '🌐' : '🔧'} {formatStatusLabel(event.type)}
                  </span>
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                      background: event.isActive ? 'rgba(16,185,129,0.2)' : 'rgba(148,163,184,0.2)',
                      color: event.isActive ? '#6EE7B7' : '#94A3B8',
                      border: `1px solid ${event.isActive ? 'rgba(110,231,183,0.3)' : 'rgba(148,163,184,0.2)'}`,
                      padding: '4px 12px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: event.isActive ? '#10B981' : '#94A3B8',
                        display: 'inline-block',
                      }}
                    />
                    {event.isActive ? 'Active' : 'Closed'}
                  </span>
                </div>

                {/* Title */}
                <h1
                  style={{
                    fontSize: 28,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    letterSpacing: '-0.5px',
                    margin: 0,
                    marginBottom: 10,
                  }}
                >
                  {event.title}
                </h1>

                {/* Meta */}
                <div
                  style={{
                    display: 'flex',
                    flexWrap: 'wrap',
                    gap: 16,
                    color: '#94A3B8',
                    fontSize: 13,
                  }}
                >
                  {event.city && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                      <MapPin size={13} /> {event.city} · {formatStatusLabel(event.locationType)}
                    </span>
                  )}
                  {deadline && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 5,
                        color: isExpired
                          ? '#EF4444'
                          : daysLeft !== null && daysLeft <= 3
                            ? '#F59E0B'
                            : '#94A3B8',
                        fontWeight: isExpired || (daysLeft !== null && daysLeft <= 3) ? 700 : 400,
                      }}
                    >
                      <Clock size={13} />
                      {isExpired ? 'Registration closed' : `${daysLeft}d left`}
                    </span>
                  )}
                  {event.academicSession && <span>🎓 {event.academicSession}</span>}
                </div>

                {/* Quick stats */}
                <div style={{ display: 'flex', gap: 32, marginTop: 22 }}>
                  {[
                    { label: 'Applications', value: totalApplications, color: '#22D3EE' },
                    { label: 'Registrations', value: regCount, color: '#A78BFA' },
                    {
                      label: 'Deadline',
                      value: deadline ? formatShortDate(deadline.toISOString()) : '—',
                      color: '#F8FAFC',
                    },
                    {
                      label: 'Posted',
                      value: formatShortDate(event.createdAt?.toISOString()),
                      color: '#F8FAFC',
                    },
                  ].map((s) => (
                    <div key={s.label}>
                      <div
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: s.color,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{ fontSize: 12, color: '#64748B', marginTop: 4, fontWeight: 600 }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, flexShrink: 0 }}>
                <Link
                  href={`${eventsBaseHref}/${eventId}/registrants`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: '#2563EB',
                    color: '#fff',
                    padding: '10px 20px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 700,
                    textDecoration: 'none',
                    fontFamily: 'var(--font-display)',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                  }}
                >
                  <Users size={14} /> View Registrants ({formatCompactNumber(regCount)})
                </Link>
                <Link
                  href={`${eventsBaseHref}/${eventId}/edit`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    color: '#CBD5E1',
                    padding: '10px 20px',
                    borderRadius: 12,
                    fontSize: 13,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <PencilLine size={14} /> Edit Event
                </Link>
                <Link
                  href={eventsBaseHref}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    color: '#64748B',
                    fontSize: 13,
                    textDecoration: 'none',
                    justifyContent: 'center',
                    paddingTop: 4,
                  }}
                >
                  ← Back to listings
                </Link>
              </div>
            </div>
          </div>

          {/* ── Main content + sidebar ── */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 320px',
              gap: 20,
              alignItems: 'start',
            }}
            className="event-detail-grid"
          >
            {/* Left: Description + Pipeline */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Description */}
              {event.description && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '28px 32px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: '#0F172A',
                      fontFamily: 'var(--font-display)',
                      margin: 0,
                      marginBottom: 14,
                    }}
                  >
                    Event description
                  </h2>
                  <p
                    style={{
                      color: '#475569',
                      fontSize: 14,
                      lineHeight: 1.8,
                      margin: 0,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {event.description}
                  </p>
                </div>
              )}

              {/* Application pipeline summary */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  padding: '28px 32px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    marginBottom: 20,
                  }}
                >
                  <h2
                    style={{
                      fontSize: 17,
                      fontWeight: 800,
                      color: '#0F172A',
                      fontFamily: 'var(--font-display)',
                      margin: 0,
                    }}
                  >
                    Application pipeline
                  </h2>
                  <span
                    style={{
                      background: '#EFF6FF',
                      color: '#2563EB',
                      border: '1px solid #BFDBFE',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 700,
                    }}
                  >
                    {totalApplications} total
                  </span>
                </div>

                {totalApplications === 0 ? (
                  <div
                    style={{
                      textAlign: 'center',
                      padding: '32px 0',
                      color: '#94A3B8',
                      fontSize: 14,
                    }}
                  >
                    <FileText
                      size={32}
                      style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }}
                    />
                    No applications received yet
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {pipelineStages.map((stage) => {
                      const count = statusMap[stage.key] ?? 0;
                      const pct =
                        totalApplications > 0 ? Math.round((count / totalApplications) * 100) : 0;
                      if (count === 0) return null;
                      return (
                        <div key={stage.key}>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              marginBottom: 6,
                            }}
                          >
                            <span
                              style={{
                                background: stage.bg,
                                color: stage.color,
                                border: `1px solid ${stage.border}`,
                                padding: '2px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {stage.label}
                            </span>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                              <span style={{ fontSize: 13, color: '#64748B', fontWeight: 600 }}>
                                {pct}%
                              </span>
                              <span
                                style={{
                                  fontSize: 18,
                                  fontWeight: 900,
                                  color: stage.color,
                                  fontFamily: 'var(--font-display)',
                                  lineHeight: 1,
                                  minWidth: 28,
                                  textAlign: 'right',
                                }}
                              >
                                {count}
                              </span>
                            </div>
                          </div>
                          <div
                            style={{
                              height: 7,
                              background: '#F1F5F9',
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${pct}%`,
                                height: '100%',
                                background: stage.color,
                                borderRadius: 999,
                              }}
                            />
                          </div>
                        </div>
                      );
                    })}
                    <div
                      style={{
                        marginTop: 8,
                        paddingTop: 14,
                        borderTop: '1px solid #F1F5F9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                      }}
                    >
                      <span style={{ fontSize: 13, fontWeight: 700, color: '#0F172A' }}>
                        Total applications
                      </span>
                      <span
                        style={{
                          fontSize: 22,
                          fontWeight: 900,
                          color: '#2563EB',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {totalApplications}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Sidebar */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {/* Event details */}
              <div
                style={{
                  background: '#fff',
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  padding: '24px 26px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                }}
              >
                <h3
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                    marginBottom: 18,
                  }}
                >
                  Event details
                </h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    {
                      icon: '📅',
                      label: 'DEADLINE',
                      value: deadline ? formatShortDate(deadline.toISOString()) : '—',
                    },
                    { icon: '📍', label: 'FORMAT', value: formatStatusLabel(event.locationType) },
                    event.city ? { icon: '🏙️', label: 'VENUE', value: event.city } : null,
                    event.academicSession
                      ? { icon: '🎓', label: 'SESSION', value: event.academicSession }
                      : null,
                    { icon: '📋', label: 'TYPE', value: formatStatusLabel(event.type) },
                  ]
                    .filter(Boolean)
                    .map((item) => (
                      <div
                        key={item!.label}
                        style={{ display: 'flex', flexDirection: 'column', gap: 3 }}
                      >
                        <span
                          style={{
                            fontSize: 10,
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                          }}
                        >
                          {item!.icon} {item!.label}
                        </span>
                        <span style={{ fontSize: 14, fontWeight: 600, color: '#0F172A' }}>
                          {item!.value}
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              {/* Targeting */}
              {(event.targetUniversities?.length > 0 ||
                event.targetDepartments?.length > 0 ||
                event.targetYears?.length > 0) && (
                <div
                  style={{
                    background: '#fff',
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    padding: '24px 26px',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
                  }}
                >
                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: '#0F172A',
                      fontFamily: 'var(--font-display)',
                      margin: 0,
                      marginBottom: 6,
                    }}
                  >
                    Targeting
                  </h3>
                  <p style={{ fontSize: 13, color: '#64748B', margin: '0 0 16px' }}>
                    Who this event is shown to
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    {event.targetUniversities?.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            marginBottom: 8,
                          }}
                        >
                          Universities
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {event.targetUniversities.map((u: string) => (
                            <span
                              key={u}
                              style={{
                                background: '#EFF6FF',
                                color: '#2563EB',
                                border: '1px solid #BFDBFE',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {u}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {event.targetDepartments?.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            marginBottom: 8,
                          }}
                        >
                          Departments
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                          {event.targetDepartments.map((d: string) => (
                            <span
                              key={d}
                              style={{
                                background: '#F5F3FF',
                                color: '#7C3AED',
                                border: '1px solid #DDD6FE',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              {d}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {event.targetYears?.length > 0 && (
                      <div>
                        <div
                          style={{
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            marginBottom: 8,
                          }}
                        >
                          Year of Study
                        </div>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {event.targetYears.map((y: number) => (
                            <span
                              key={y}
                              style={{
                                background: '#F8FAFC',
                                color: '#475569',
                                border: '1px solid #E2E8F0',
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 600,
                              }}
                            >
                              Year {y}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .event-detail-grid { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </DashboardPage>
    </DashboardShell>
  );
}
