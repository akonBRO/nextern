'use client';
// src/app/student/notifications/page.tsx
// Full notifications list page with filters and mark-read controls

import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  CheckCheck,
  Briefcase,
  Award,
  CalendarDays,
  Star,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Zap,
  Filter,
  Loader2,
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
  white: '#fff',
  border: '#E2E8F0',
  text: '#0F172A',
  gray: '#64748B',
  light: '#94A3B8',
  danger: '#EF4444',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
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
  { icon: React.ReactNode; color: string; bg: string; label: string }
> = {
  status_update: {
    icon: <Briefcase size={16} />,
    color: C.blue,
    bg: C.blueBg,
    label: 'Status Update',
  },
  deadline_reminder: {
    icon: <CalendarDays size={16} />,
    color: C.amber,
    bg: '#FFFBEB',
    label: 'Deadline',
  },
  badge_earned: { icon: <Award size={16} />, color: C.violet, bg: '#EDE9FE', label: 'Badge' },
  job_match: { icon: <Zap size={16} />, color: C.teal, bg: '#F0FDFA', label: 'Job Match' },
  advisor_note: { icon: <Star size={16} />, color: C.sky, bg: '#F0F9FF', label: 'Advisor' },
  interview_scheduled: {
    icon: <CalendarDays size={16} />,
    color: C.emerald,
    bg: '#ECFDF5',
    label: 'Interview',
  },
  score_update: { icon: <TrendingUp size={16} />, color: C.indigo, bg: '#EEF2FF', label: 'Score' },
  message_received: {
    icon: <MessageSquare size={16} />,
    color: C.gray,
    bg: C.bg,
    label: 'Message',
  },
};

function typeConfig(type: string) {
  return (
    TYPE_CONFIG[type] ?? {
      icon: <AlertCircle size={16} />,
      color: C.gray,
      bg: C.bg,
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

const FILTER_TYPES = [
  { value: 'all', label: 'All', icon: <Bell size={13} /> },
  { value: 'status_update', label: 'Status', icon: <Briefcase size={13} /> },
  { value: 'deadline_reminder', label: 'Deadlines', icon: <CalendarDays size={13} /> },
  { value: 'badge_earned', label: 'Badges', icon: <Award size={13} /> },
  { value: 'job_match', label: 'Job Matches', icon: <Zap size={13} /> },
  { value: 'interview_scheduled', label: 'Interviews', icon: <CalendarDays size={13} /> },
];

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
      } finally {
        setLoading(false);
      }
    },
    [filter, showUnreadOnly]
  );

  useEffect(() => {
    setPage(1);
    fetchNotifs(1);
  }, [filter, showUnreadOnly, fetchNotifs]);

  async function markRead(id: string) {
    await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
    setNotifs((prev) => prev.map((n) => (n._id === id ? { ...n, isRead: true } : n)));
    setUnread((prev) => Math.max(0, prev - 1));
  }

  async function markAllRead() {
    setMarkingAll(true);
    await fetch('/api/notifications', { method: 'PATCH' });
    setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
    setMarkingAll(false);
  }

  const displayed = notifications;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo2})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 860, margin: '0 auto', padding: '20px 24px' }}>
          <Link
            href="/student/dashboard"
            style={{ color: C.gray, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Dashboard
          </Link>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginTop: 16,
              flexWrap: 'wrap',
              gap: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB, #0D9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                }}
              >
                <Bell size={18} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                  }}
                >
                  Notifications
                </h1>
                {unread > 0 && (
                  <div style={{ fontSize: 12, color: '#93C5FD', marginTop: 2 }}>
                    {unread} unread notification{unread !== 1 ? 's' : ''}
                  </div>
                )}
              </div>
            </div>
            {unread > 0 && (
              <button
                onClick={markAllRead}
                disabled={markingAll}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '9px 18px',
                  background: 'rgba(255,255,255,0.1)',
                  color: '#E2E8F0',
                  border: '1px solid rgba(255,255,255,0.15)',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <CheckCheck size={14} />
                {markingAll ? 'Clearing…' : 'Mark all read'}
              </button>
            )}
          </div>
        </div>
      </div>

      <div style={{ maxWidth: 860, margin: '24px auto', padding: '0 24px 48px' }}>
        {/* Filter tabs */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20 }}>
          {FILTER_TYPES.map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 14px',
                borderRadius: 999,
                background: filter === f.value ? C.blue : C.white,
                color: filter === f.value ? '#fff' : C.gray,
                border: `1px solid ${filter === f.value ? C.blue : C.border}`,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {f.icon} {f.label}
            </button>
          ))}

          {/* Unread toggle */}
          <button
            onClick={() => setShowUnreadOnly((v) => !v)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 14px',
              borderRadius: 999,
              marginLeft: 'auto',
              background: showUnreadOnly ? '#EFF6FF' : C.white,
              color: showUnreadOnly ? C.blue : C.gray,
              border: `1px solid ${showUnreadOnly ? C.blueBorder : C.border}`,
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            <Filter size={13} />
            {showUnreadOnly ? 'Unread only' : 'All'}
          </button>
        </div>

        {/* List */}
        <div
          style={{
            background: C.white,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {loading ? (
            <div
              style={{
                padding: '60px 0',
                textAlign: 'center',
                color: C.gray,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
              }}
            >
              <Loader2 size={18} style={{ animation: 'spin 0.8s linear infinite' }} />
              Loading notifications…
            </div>
          ) : displayed.length === 0 ? (
            <div style={{ padding: '60px 20px', textAlign: 'center' }}>
              <Bell size={40} color="#CBD5E1" style={{ margin: '0 auto 14px', display: 'block' }} />
              <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>No notifications</div>
              <div style={{ fontSize: 13, color: C.light, marginTop: 6 }}>
                {filter !== 'all' ? 'No notifications of this type.' : "You're all caught up!"}
              </div>
            </div>
          ) : (
            displayed.map((notif, i) => {
              const cfg = typeConfig(notif.type);
              return (
                <div
                  key={notif._id}
                  style={{
                    display: 'flex',
                    gap: 14,
                    padding: '18px 22px',
                    background: notif.isRead ? C.white : '#F0F7FF',
                    borderBottom: i < displayed.length - 1 ? `1px solid ${C.border}` : 'none',
                    transition: 'background 0.12s',
                    cursor: 'default',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.background = notif.isRead ? C.white : '#F0F7FF')
                  }
                >
                  {/* Icon */}
                  <div
                    style={{
                      width: 42,
                      height: 42,
                      borderRadius: 12,
                      flexShrink: 0,
                      background: cfg.bg,
                      color: cfg.color,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      border: `1px solid ${cfg.color}20`,
                    }}
                  >
                    {cfg.icon}
                  </div>

                  {/* Content */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                        gap: 10,
                        marginBottom: 4,
                      }}
                    >
                      <div>
                        <span
                          style={{
                            display: 'inline-block',
                            background: cfg.bg,
                            color: cfg.color,
                            border: `1px solid ${cfg.color}25`,
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                            padding: '1px 7px',
                            marginBottom: 4,
                          }}
                        >
                          {cfg.label}
                        </span>
                        <div
                          style={{
                            fontSize: 14,
                            fontWeight: notif.isRead ? 600 : 800,
                            color: C.text,
                          }}
                        >
                          {notif.title}
                        </div>
                      </div>
                      {!notif.isRead && (
                        <button
                          onClick={() => markRead(notif._id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            padding: '4px 9px',
                            borderRadius: 7,
                            flexShrink: 0,
                            background: C.blueBg,
                            color: C.blue,
                            border: `1px solid ${C.blueBorder}`,
                            fontSize: 11,
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          <CheckCheck size={11} /> Mark read
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: 13, color: C.gray, lineHeight: 1.65, marginBottom: 8 }}>
                      {notif.body}
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <span style={{ fontSize: 11, color: C.light }}>
                        {timeAgo(notif.createdAt)}
                      </span>
                      {notif.link && (
                        <Link
                          href={notif.link}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            fontSize: 12,
                            color: C.blue,
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          View →
                        </Link>
                      )}
                    </div>
                  </div>

                  {/* Unread dot */}
                  {!notif.isRead && (
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: C.blue,
                        flexShrink: 0,
                        marginTop: 6,
                      }}
                    />
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 24 }}>
            <button
              onClick={() => {
                setPage((p) => Math.max(1, p - 1));
                fetchNotifs(Math.max(1, page - 1));
              }}
              disabled={page === 1}
              style={{
                padding: '8px 16px',
                borderRadius: 9,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: page === 1 ? C.light : C.text,
                cursor: page === 1 ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              ← Prev
            </button>
            <span style={{ padding: '8px 16px', fontSize: 13, color: C.gray }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => {
                setPage((p) => Math.min(totalPages, p + 1));
                fetchNotifs(Math.min(totalPages, page + 1));
              }}
              disabled={page === totalPages}
              style={{
                padding: '8px 16px',
                borderRadius: 9,
                border: `1px solid ${C.border}`,
                background: C.white,
                color: page === totalPages ? C.light : C.text,
                cursor: page === totalPages ? 'not-allowed' : 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Next →
            </button>
          </div>
        )}
      </div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
