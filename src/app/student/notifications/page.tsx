'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  Bell,
  Briefcase,
  CalendarClock,
  CalendarDays,
  CheckCheck,
  ExternalLink,
  Filter,
  Loader2,
  MessageSquare,
  Sparkles,
  Star,
  TrendingUp,
  Zap,
} from 'lucide-react';

const C = {
  blue: '#2563EB',
  teal: '#0D9488',
  violet: '#7C3AED',
  amber: '#D97706',
  sky: '#0EA5E9',
  emerald: '#059669',
  indigo: '#6366F1',
  dark: '#0F172A',
  indigo2: '#1E293B',
  bg: '#F1F5F9',
  white: '#FFFFFF',
  border: '#E2E8F0',
  text: '#0F172A',
  gray: '#64748B',
  light: '#94A3B8',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
};

type Notif = {
  _id: string;
  type: string;
  title: string;
  body: string;
  link?: string;
  isRead: boolean;
  createdAt: string;
  meta?: Record<string, unknown>;
};

const TYPE_CONFIG: Record<
  string,
  {
    icon: React.ReactNode;
    color: string;
    bg: string;
    border: string;
    label: string;
  }
> = {
  status_update: {
    icon: <Briefcase size={16} />,
    color: C.blue,
    bg: C.blueBg,
    border: C.blueBorder,
    label: 'Status update',
  },
  deadline_reminder: {
    icon: <CalendarDays size={16} />,
    color: C.amber,
    bg: '#FFFBEB',
    border: '#FDE68A',
    label: 'Deadline',
  },
  badge_earned: {
    icon: <Sparkles size={16} />,
    color: C.violet,
    bg: '#F5F3FF',
    border: '#DDD6FE',
    label: 'Badge',
  },
  job_match: {
    icon: <Zap size={16} />,
    color: C.teal,
    bg: '#F0FDFA',
    border: '#99F6E4',
    label: 'Job match',
  },
  advisor_note: {
    icon: <Star size={16} />,
    color: C.sky,
    bg: '#F0F9FF',
    border: '#BAE6FD',
    label: 'Advisor note',
  },
  interview_scheduled: {
    icon: <CalendarClock size={16} />,
    color: C.emerald,
    bg: '#ECFDF5',
    border: '#A7F3D0',
    label: 'Interview',
  },
  score_update: {
    icon: <TrendingUp size={16} />,
    color: C.indigo,
    bg: '#EEF2FF',
    border: '#C7D2FE',
    label: 'Score',
  },
  message_received: {
    icon: <MessageSquare size={16} />,
    color: C.gray,
    bg: '#F8FAFC',
    border: '#E2E8F0',
    label: 'Message',
  },
};

const FILTER_TYPES = [
  { value: 'all', label: 'All', icon: <Bell size={13} /> },
  { value: 'status_update', label: 'Status', icon: <Briefcase size={13} /> },
  { value: 'deadline_reminder', label: 'Deadlines', icon: <CalendarDays size={13} /> },
  { value: 'job_match', label: 'Matches', icon: <Zap size={13} /> },
  { value: 'advisor_note', label: 'Advisor', icon: <Star size={13} /> },
  { value: 'interview_scheduled', label: 'Interviews', icon: <CalendarClock size={13} /> },
];

function typeConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: <AlertCircle size={16} />,
      color: C.gray,
      bg: '#F8FAFC',
      border: '#E2E8F0',
      label: 'Notification',
    }
  );
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return fmtDate(iso);
}

function buildMetaChips(notif: Notif) {
  const meta = notif.meta ?? {};
  const chips: string[] = [];
  const daysLeft = typeof meta.daysLeft === 'number' ? meta.daysLeft : null;
  const fitScore = typeof meta.fitScore === 'number' ? meta.fitScore : null;
  const requestStatus = typeof meta.requestStatus === 'string' ? meta.requestStatus : null;
  const companyName = typeof meta.companyName === 'string' ? meta.companyName : null;
  const jobTitle = typeof meta.jobTitle === 'string' ? meta.jobTitle : null;

  if (daysLeft !== null) {
    chips.push(daysLeft <= 0 ? 'Today' : `${daysLeft} days left`);
  }
  if (fitScore !== null) {
    chips.push(`Fit score ${fitScore}%`);
  }
  if (requestStatus) {
    chips.push(requestStatus.replace('_', ' '));
  }
  if (companyName) {
    chips.push(companyName);
  }
  if (!companyName && jobTitle) {
    chips.push(jobTitle);
  }

  return chips.slice(0, 4);
}

export default function StudentNotificationsPage() {
  const [notifications, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(0);
  const [loading, setLoading] = useState(true);
  const [markingAll, setMarkingAll] = useState(false);
  const [filter, setFilter] = useState<'all' | string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  const fetchNotifs = useCallback(
    async (pg = 1) => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          page: String(pg),
          limit: '20',
        });
        if (showUnreadOnly) params.set('unread', 'true');
        if (filter !== 'all') params.set('type', filter);
        const res = await fetch(`/api/notifications?${params}`);
        const data = await res.json();
        setNotifs(data.notifications ?? []);
        setUnread(data.unreadCount ?? 0);
        setTotalPages(data.pagination?.pages ?? 1);
        setPage(data.pagination?.page ?? pg);
      } finally {
        setLoading(false);
      }
    },
    [filter, showUnreadOnly]
  );

  useEffect(() => {
    fetchNotifs(page);
  }, [page, fetchNotifs]);

  useEffect(() => {
    function handleFocus() {
      void fetchNotifs(page);
    }
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [fetchNotifs, page]);

  useEffect(() => {
    setPage(1);
  }, [filter, showUnreadOnly]);

  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    setMarkingAll(true);
    try {
      await fetch('/api/notifications', { method: 'PATCH' });
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } finally {
      setMarkingAll(false);
    }
  }

  const summary = useMemo(() => {
    const actionRequired = notifications.filter(
      (notif) =>
        !notif.isRead &&
        [
          'deadline_reminder',
          'interview_scheduled',
          'status_update',
          'recommendation_request',
        ].includes(notif.type)
    ).length;
    const upcomingDeadlines = notifications.filter(
      (notif) => notif.type === 'deadline_reminder'
    ).length;
    const freshMatches = notifications.filter((notif) => {
      if (notif.type !== 'job_match') return false;
      return Date.now() - new Date(notif.createdAt).getTime() <= 7 * 86400000;
    }).length;
    return { actionRequired, upcomingDeadlines, freshMatches };
  }, [notifications]);

  const priorityItems = useMemo(
    () => [...notifications].sort((a, b) => Number(a.isRead) - Number(b.isRead)).slice(0, 5),
    [notifications]
  );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      <div
        style={{
          background:
            'linear-gradient(145deg, rgba(15,23,42,1), rgba(30,41,59,0.98) 60%, rgba(37,99,235,0.92))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 1180, margin: '0 auto', padding: '22px 24px 28px' }}>
          <Link
            href="/student/dashboard"
            style={{ color: '#94A3B8', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
          >
            Back to dashboard
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
              marginTop: 18,
            }}
          >
            <div style={{ maxWidth: 760 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div
                  style={{
                    width: 52,
                    height: 52,
                    borderRadius: 16,
                    background: 'linear-gradient(135deg, #2563EB, #0D9488)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#FFFFFF',
                    boxShadow: '0 14px 30px rgba(37,99,235,0.28)',
                  }}
                >
                  <Bell size={22} />
                </div>
                <div>
                  <h1
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: '#F8FAFC',
                      fontFamily: 'var(--font-display)',
                      letterSpacing: '-0.03em',
                      margin: 0,
                    }}
                  >
                    Notification center
                  </h1>
                  <div style={{ marginTop: 6, fontSize: 14, color: '#9FB4D0', lineHeight: 1.7 }}>
                    Follow deadlines, employer updates, new matches, advisor notes, and interview
                    activity from one clean workspace.
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 14px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.12)',
                  background: 'rgba(255,255,255,0.08)',
                  color: '#E2E8F0',
                  fontSize: 13,
                  fontWeight: 700,
                }}
              >
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: '50%',
                    background: unread > 0 ? '#EF4444' : '#22C55E',
                  }}
                />
                {unread} unread
              </div>
              <button
                onClick={markAllRead}
                disabled={markingAll || unread === 0}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '10px 16px',
                  borderRadius: 14,
                  border: '1px solid rgba(255,255,255,0.16)',
                  background: unread === 0 ? 'rgba(255,255,255,0.05)' : 'rgba(255,255,255,0.12)',
                  color: unread === 0 ? '#64748B' : '#F8FAFC',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: unread === 0 ? 'not-allowed' : 'pointer',
                }}
              >
                <CheckCheck size={14} />
                {markingAll ? 'Marking...' : 'Mark all read'}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 1180, margin: '0 auto', padding: '28px 24px 48px' }}>
        <section
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: 16,
            marginBottom: 18,
          }}
        >
          {[
            {
              label: 'Unread now',
              value: unread,
              detail: 'Everything that still needs your attention',
              color: '#2563EB',
              bg: '#EFF6FF',
              border: '#BFDBFE',
              icon: <Bell size={18} />,
            },
            {
              label: 'Action required',
              value: summary.actionRequired,
              detail: 'Deadlines, interviews, and status changes that deserve a response',
              color: '#D97706',
              bg: '#FFFBEB',
              border: '#FDE68A',
              icon: <AlertCircle size={18} />,
            },
            {
              label: 'Deadline alerts',
              value: summary.upcomingDeadlines,
              detail: 'Application and event reminders already in your feed',
              color: '#0D9488',
              bg: '#F0FDFA',
              border: '#99F6E4',
              icon: <CalendarDays size={18} />,
            },
            {
              label: 'Fresh matches',
              value: summary.freshMatches,
              detail: 'New job matches delivered during the last 7 days',
              color: '#7C3AED',
              bg: '#F5F3FF',
              border: '#DDD6FE',
              icon: <Zap size={18} />,
            },
          ].map((card) => (
            <div
              key={card.label}
              style={{
                background: C.white,
                borderRadius: 18,
                border: `1px solid ${card.border}`,
                padding: '18px 18px 16px',
                boxShadow: '0 10px 24px rgba(15,23,42,0.05)',
              }}
            >
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: 12,
                  background: card.bg,
                  border: `1px solid ${card.border}`,
                  color: card.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                }}
              >
                {card.icon}
              </div>
              <div style={{ fontSize: 12, fontWeight: 700, color: C.gray }}>{card.label}</div>
              <div
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  lineHeight: 1.1,
                  color: C.text,
                  marginTop: 8,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {card.value}
              </div>
              <div style={{ marginTop: 6, fontSize: 13, color: C.gray, lineHeight: 1.65 }}>
                {card.detail}
              </div>
            </div>
          ))}
        </section>

        <div
          className="student-notif-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: 'minmax(0, 1.55fr) minmax(280px, 0.85fr)',
            gap: 18,
            alignItems: 'start',
          }}
        >
          <div>
            <div
              style={{
                background: C.white,
                borderRadius: 18,
                border: `1px solid ${C.border}`,
                padding: '14px 16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 12,
                flexWrap: 'wrap',
                marginBottom: 16,
                boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
              }}
            >
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {FILTER_TYPES.map((item) => (
                  <button
                    key={item.value}
                    onClick={() => setFilter(item.value)}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 6,
                      padding: '8px 12px',
                      borderRadius: 999,
                      background: filter === item.value ? C.blueBg : '#F8FAFC',
                      color: filter === item.value ? C.blue : C.gray,
                      border: `1px solid ${filter === item.value ? C.blueBorder : C.border}`,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setShowUnreadOnly((value) => !value)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: showUnreadOnly ? C.blueBg : '#F8FAFC',
                  color: showUnreadOnly ? C.blue : C.gray,
                  border: `1px solid ${showUnreadOnly ? C.blueBorder : C.border}`,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <Filter size={12} />
                {showUnreadOnly ? 'Unread only' : 'All notifications'}
              </button>
            </div>

            <div
              style={{
                background: C.white,
                borderRadius: 22,
                border: `1px solid ${C.border}`,
                overflow: 'hidden',
                boxShadow: '0 12px 30px rgba(15,23,42,0.05)',
              }}
            >
              {loading ? (
                <div
                  style={{
                    padding: '72px 24px',
                    textAlign: 'center',
                    color: C.gray,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 10,
                  }}
                >
                  <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
                  Loading notifications...
                </div>
              ) : notifications.length === 0 ? (
                <div style={{ padding: '72px 24px', textAlign: 'center' }}>
                  <div
                    style={{
                      width: 72,
                      height: 72,
                      borderRadius: 24,
                      border: `1px solid ${C.border}`,
                      background: '#F8FAFC',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 18px',
                      color: '#CBD5E1',
                    }}
                  >
                    <Bell size={30} />
                  </div>
                  <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>All caught up</div>
                  <div
                    style={{
                      marginTop: 8,
                      fontSize: 13,
                      color: C.light,
                      lineHeight: 1.7,
                      maxWidth: 420,
                      marginInline: 'auto',
                    }}
                  >
                    {showUnreadOnly
                      ? 'There are no unread items in this filter.'
                      : 'New job matches, deadline reminders, employer updates, and advisor notes will appear here.'}
                  </div>
                </div>
              ) : (
                notifications.map((notif, index) => {
                  const cfg = typeConfig(notif.type);
                  const chips = buildMetaChips(notif);
                  return (
                    <div
                      key={notif._id}
                      style={{
                        display: 'flex',
                        gap: 14,
                        padding: '18px 20px',
                        background: notif.isRead ? C.white : '#F8FBFF',
                        borderBottom:
                          index < notifications.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      <div
                        style={{
                          width: 44,
                          height: 44,
                          borderRadius: 14,
                          flexShrink: 0,
                          background: cfg.bg,
                          border: `1px solid ${cfg.border}`,
                          color: cfg.color,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        {cfg.icon}
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            justifyContent: 'space-between',
                            gap: 12,
                          }}
                        >
                          <div style={{ minWidth: 0 }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '3px 9px',
                                borderRadius: 999,
                                background: cfg.bg,
                                border: `1px solid ${cfg.border}`,
                                color: cfg.color,
                                fontSize: 10.5,
                                fontWeight: 800,
                                textTransform: 'uppercase',
                                letterSpacing: 0.05,
                              }}
                            >
                              {cfg.label}
                            </span>
                            <div
                              style={{
                                marginTop: 8,
                                fontSize: 15,
                                fontWeight: notif.isRead ? 700 : 900,
                                color: C.text,
                                lineHeight: 1.45,
                              }}
                            >
                              {notif.title}
                            </div>
                          </div>

                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}
                          >
                            <span style={{ fontSize: 11, color: C.light, whiteSpace: 'nowrap' }}>
                              {timeAgo(notif.createdAt)}
                            </span>
                            {!notif.isRead && (
                              <button
                                onClick={() => markRead(notif._id)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 5,
                                  padding: '5px 9px',
                                  borderRadius: 9,
                                  border: `1px solid ${C.blueBorder}`,
                                  background: C.blueBg,
                                  color: C.blue,
                                  fontSize: 11,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <CheckCheck size={11} />
                                Mark read
                              </button>
                            )}
                          </div>
                        </div>

                        <div style={{ marginTop: 8, fontSize: 13, color: C.gray, lineHeight: 1.7 }}>
                          {notif.body}
                        </div>

                        {chips.length > 0 && (
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              flexWrap: 'wrap',
                              marginTop: 10,
                            }}
                          >
                            {chips.map((chip) => (
                              <span
                                key={`${notif._id}-${chip}`}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  padding: '4px 9px',
                                  borderRadius: 999,
                                  background: '#F8FAFC',
                                  border: `1px solid ${C.border}`,
                                  color: '#475569',
                                  fontSize: 11,
                                  fontWeight: 700,
                                }}
                              >
                                {chip}
                              </span>
                            ))}
                          </div>
                        )}

                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: 10,
                            flexWrap: 'wrap',
                            marginTop: 12,
                          }}
                        >
                          <div style={{ fontSize: 11.5, color: C.light }}>
                            Logged {fmtDate(notif.createdAt)}
                          </div>
                          {notif.link && (
                            <Link
                              href={notif.link}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '7px 11px',
                                borderRadius: 10,
                                background: C.blueBg,
                                border: `1px solid ${C.blueBorder}`,
                                color: C.blue,
                                fontSize: 12,
                                fontWeight: 700,
                                textDecoration: 'none',
                              }}
                            >
                              Open item
                              <ExternalLink size={12} />
                            </Link>
                          )}
                        </div>
                      </div>

                      {!notif.isRead && (
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: C.blue,
                            marginTop: 8,
                            flexShrink: 0,
                          }}
                        />
                      )}
                    </div>
                  );
                })
              )}
            </div>

            {totalPages > 1 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 18,
                  flexWrap: 'wrap',
                }}
              >
                <button
                  onClick={() => setPage((value) => Math.max(1, value - 1))}
                  disabled={page === 1}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    color: page === 1 ? C.light : C.text,
                    cursor: page === 1 ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Prev
                </button>
                <span style={{ fontSize: 13, color: C.gray }}>
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((value) => Math.min(totalPages, value + 1))}
                  disabled={page === totalPages}
                  style={{
                    padding: '9px 14px',
                    borderRadius: 10,
                    border: `1px solid ${C.border}`,
                    background: C.white,
                    color: page === totalPages ? C.light : C.text,
                    cursor: page === totalPages ? 'not-allowed' : 'pointer',
                    fontSize: 13,
                    fontWeight: 700,
                  }}
                >
                  Next
                </button>
              </div>
            )}
          </div>

          <aside style={{ display: 'grid', gap: 16 }}>
            <div
              style={{
                background: C.white,
                borderRadius: 18,
                border: `1px solid ${C.border}`,
                padding: '18px',
                boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>Priority queue</div>
              <div style={{ marginTop: 4, fontSize: 13, color: C.gray, lineHeight: 1.65 }}>
                The most relevant items from your current page, with unread items surfaced first.
              </div>

              <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                {priorityItems.length > 0 ? (
                  priorityItems.map((notif) => {
                    const cfg = typeConfig(notif.type);
                    return (
                      <div
                        key={`priority-${notif._id}`}
                        style={{
                          borderRadius: 14,
                          border: `1px solid ${cfg.border}`,
                          background: cfg.bg,
                          padding: '12px 13px',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <span style={{ color: cfg.color, display: 'inline-flex' }}>
                            {cfg.icon}
                          </span>
                          <span style={{ fontSize: 12, fontWeight: 800, color: cfg.color }}>
                            {cfg.label}
                          </span>
                        </div>
                        <div
                          style={{
                            marginTop: 8,
                            fontSize: 13,
                            fontWeight: 700,
                            color: C.text,
                            lineHeight: 1.5,
                          }}
                        >
                          {notif.title}
                        </div>
                        <div style={{ marginTop: 6, fontSize: 11.5, color: C.gray }}>
                          {timeAgo(notif.createdAt)}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.7 }}>
                    No items on this page yet. Change filters or wait for new activity.
                  </div>
                )}
              </div>
            </div>

            <div
              style={{
                background: C.white,
                borderRadius: 18,
                border: `1px solid ${C.border}`,
                padding: '18px',
                boxShadow: '0 10px 24px rgba(15,23,42,0.04)',
              }}
            >
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>How this helps</div>
              <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
                {[
                  'Deadline reminders help you avoid missing saved-job or event milestones.',
                  'Status and interview notifications keep your application pipeline visible without checking every page manually.',
                  'Job matches and advisor notes support personalized opportunity discovery and guided improvement.',
                  'Marking items as read works best after you have opened the linked page or taken the required action.',
                ].map((item) => (
                  <div
                    key={item}
                    style={{
                      borderRadius: 12,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      padding: '12px 13px',
                      fontSize: 13,
                      color: '#334155',
                      lineHeight: 1.65,
                    }}
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 980px) {
          .student-notif-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
