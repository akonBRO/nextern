'use client';

import BrandLoader from '@/components/ui/BrandLoader';
// src/components/notifications/NotificationBell.tsx
// Real-time notification bell for the dashboard header.
// - Connects to Pusher on mount and listens for new notifications
// - Shows unread badge count
// - Dropdown shows last 8 notifications
// - "Mark all read" clears the badge
// - Links to /student/notifications for the full list

import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import {
  Bell,
  X,
  CheckCheck,
  ExternalLink,
  Briefcase,
  Award,
  CalendarDays,
  Star,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Zap,
  Users,
  SendToBack,
} from 'lucide-react';
import Pusher from 'pusher-js';
import { userChannel, PUSHER_EVENTS } from '@/lib/pusher';
import { readJsonSafely } from '@/lib/safe-json';
import styles from '@/components/dashboard/HeaderActions.module.css';

// ── Types ──────────────────────────────────────────────────────────────────
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

// ── Notification type → icon + colour ─────────────────────────────────────
function typeConfig(type: string): { icon: React.ReactNode; color: string; bg: string } {
  const map: Record<string, { icon: React.ReactNode; color: string; bg: string }> = {
    status_update: { icon: <Briefcase size={14} />, color: '#2563EB', bg: '#EFF6FF' },
    deadline_reminder: { icon: <CalendarDays size={14} />, color: '#D97706', bg: '#FFFBEB' },
    recommendation_request: {
      icon: <SendToBack size={14} />,
      color: '#7C3AED',
      bg: '#F5F3FF',
    },
    badge_earned: { icon: <Award size={14} />, color: '#7C3AED', bg: '#EDE9FE' },
    application_received: { icon: <Users size={14} />, color: '#0D9488', bg: '#ECFDF5' },
    job_match: { icon: <Zap size={14} />, color: '#0D9488', bg: '#F0FDFA' },
    advisor_note: { icon: <Star size={14} />, color: '#0EA5E9', bg: '#F0F9FF' },
    interview_scheduled: { icon: <CalendarDays size={14} />, color: '#059669', bg: '#ECFDF5' },
    score_update: { icon: <TrendingUp size={14} />, color: '#6366F1', bg: '#EEF2FF' },
    message_received: { icon: <MessageSquare size={14} />, color: '#64748B', bg: '#F1F5F9' },
    support_message: { icon: <MessageSquare size={14} />, color: '#0F766E', bg: '#F0FDFA' },
    admin_message: { icon: <MessageSquare size={14} />, color: '#1D4ED8', bg: '#EFF6FF' },
    system_message: { icon: <AlertCircle size={14} />, color: '#7C3AED', bg: '#F5F3FF' },
  };
  return map[type] ?? { icon: <AlertCircle size={14} />, color: '#64748B', bg: '#F1F5F9' };
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  return `${days}d ago`;
}

// ── Props ──────────────────────────────────────────────────────────────────
type Props = {
  userId: string;
  initialUnread?: number;
  notificationsHref?: string; // e.g. '/student/notifications'
  compact?: boolean;
};

// ── Component ──────────────────────────────────────────────────────────────
export default function NotificationBell({
  userId,
  initialUnread = 0,
  notificationsHref = '/student/notifications',
  compact = false,
}: Props) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifs] = useState<Notif[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [markingAll, setMarkingAll] = useState(false);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  const dropRef = useRef<HTMLDivElement>(null);

  // ── Close on outside click ────────────────────────────────────────────
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    function onEscape(event: KeyboardEvent) {
      if (event.key === 'Escape' && dropRef.current?.querySelector('[data-notification-panel]')) {
        setOpen(false);
        dropRef.current.querySelector<HTMLButtonElement>('button')?.focus();
      }
    }
    document.addEventListener('mousedown', handler);
    document.addEventListener('keydown', onEscape);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('keydown', onEscape);
    };
  }, []);

  // ── Fetch latest notifications ────────────────────────────────────────
  const fetchNotifs = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/notifications?limit=8');
      if (!res.ok) throw new Error('Unable to load notifications');
      const data = await readJsonSafely<{ notifications?: Notif[]; unreadCount?: number }>(res, {});
      setNotifs(data.notifications ?? []);
      setUnread(data.unreadCount ?? 0);
    } catch {
      setError('Notifications could not be loaded. Try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  // ── Initial fetch of unread count ─────────────────────────────────────
  useEffect(() => {
    fetch('/api/notifications?limit=1')
      .then((r) => readJsonSafely<{ unreadCount?: number }>(r, {}))
      .then((d) => setUnread(d.unreadCount ?? 0))
      .catch(() => {});
  }, []);

  // ── Open dropdown → fetch ─────────────────────────────────────────────
  useEffect(() => {
    if (open) fetchNotifs();
  }, [open, fetchNotifs]);

  // ── Pusher real-time ──────────────────────────────────────────────────
  useEffect(() => {
    if (!userId || !process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER)
      return;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY!, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
    });

    const channel = pusher.subscribe(userChannel(userId));

    // New notification arrives
    channel.bind(PUSHER_EVENTS.NEW_NOTIFICATION, (data: Notif) => {
      setUnread((prev) => prev + 1);
      // If dropdown is open, prepend the new notification
      setNotifs((prev) => {
        const exists = prev.some((n) => n._id === data._id);
        if (exists) return prev;
        return [data, ...prev].slice(0, 8);
      });
    });

    // All-read event
    channel.bind(PUSHER_EVENTS.NOTIFICATION_READ, (data: { unreadCount: number }) => {
      setUnread(data.unreadCount);
    });

    return () => {
      channel.unbind_all();
      pusher.unsubscribe(userChannel(userId));
      pusher.disconnect();
    };
  }, [userId]);

  // ── Mark single notification read ─────────────────────────────────────
  async function markRead(id: string) {
    try {
      const response = await fetch(`/api/notifications?id=${id}`, { method: 'PATCH' });
      if (!response.ok) throw new Error('Unable to mark notification as read');
      setNotifs((prev) =>
        prev.map((notification) =>
          notification._id === id ? { ...notification, isRead: true } : notification
        )
      );
      setUnread((prev) => Math.max(0, prev - 1));
    } catch {
      setError('This notification could not be marked as read. Try again.');
    }
  }

  // ── Mark all read ─────────────────────────────────────────────────────
  async function clearNotifications() {
    setMarkingAll(true);
    try {
      const res = await fetch('/api/notifications', { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to clear notifications');
      setNotifs([]);
      setUnread(0);
    } catch (error) {
      console.error('[CLEAR NOTIFICATIONS ERROR]', error);
      setError('Notifications could not be cleared. Try again.');
    } finally {
      setMarkingAll(false);
    }
  }

  async function markAllRead() {
    setMarkingAllRead(true);
    try {
      const res = await fetch('/api/notifications', { method: 'PATCH' });
      if (!res.ok) throw new Error('Failed to mark all read');
      setNotifs((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnread(0);
    } catch (error) {
      console.error('[MARK ALL READ ERROR]', error);
      setError('Notifications could not be marked as read. Try again.');
    } finally {
      setMarkingAllRead(false);
    }
  }

  async function removeNotification(id: string, isRead: boolean) {
    try {
      const res = await fetch(`/api/notifications?id=${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Failed to remove notification');
      setNotifs((prev) => prev.filter((n) => n._id !== id));
      if (!isRead) {
        setUnread((prev) => Math.max(0, prev - 1));
      }
    } catch (error) {
      console.error('[REMOVE NOTIFICATION ERROR]', error);
      setError('This notification could not be removed. Try again.');
    }
  }

  return (
    <div ref={dropRef} className={styles.actionWrap}>
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className={`${styles.headerButton} ${compact ? styles.compact : ''} ${open ? styles.active : ''}`}
        aria-label={`Notifications${unread ? `, ${unread} unread` : ''}`}
        aria-expanded={open}
      >
        <Bell size={18} strokeWidth={1.8} aria-hidden="true" />
        {!compact && <span>Notifications</span>}
        {unread > 0 && <span className={styles.count}>{unread > 99 ? '99+' : unread}</span>}
      </button>
      {open && (
        <section className={styles.popover} data-notification-panel aria-label="Notifications">
          <div className={styles.popoverHeader}>
            <h2>Notifications</h2>
            <button
              type="button"
              className={styles.iconButton}
              onClick={() => setOpen(false)}
              aria-label="Close notifications"
            >
              <X size={18} />
            </button>
          </div>
          {notifications.length > 0 && (
            <div className={styles.actions}>
              {notifications.some((notification) => !notification.isRead) && (
                <button type="button" onClick={markAllRead} disabled={markingAllRead}>
                  <CheckCheck size={15} />
                  {markingAllRead ? 'Marking?' : 'Mark all read'}
                </button>
              )}
              <button type="button" onClick={clearNotifications} disabled={markingAll}>
                <X size={14} />
                {markingAll ? 'Clearing?' : 'Clear all'}
              </button>
            </div>
          )}
          {error && (
            <div role="alert" className={styles.error}>
              {error}
              <button type="button" onClick={fetchNotifs}>
                Retry
              </button>
            </div>
          )}
          <div className={styles.notificationList}>
            {loading ? (
              <div className={styles.empty}>
                <BrandLoader variant="inline" label="Loading notifications" />
              </div>
            ) : notifications.length === 0 && !error ? (
              <div className={styles.empty}>
                <Bell size={28} strokeWidth={1.5} />
                <strong>You?re all caught up</strong>
                <span>Updates about your activity will appear here.</span>
              </div>
            ) : (
              notifications.map((notification) => {
                const config = typeConfig(notification.type);
                return (
                  <article
                    key={notification._id}
                    className={`${styles.notification} ${notification.isRead ? '' : styles.unread}`}
                  >
                    <span
                      className={styles.notificationIcon}
                      style={{ color: config.color, background: config.bg }}
                    >
                      {config.icon}
                    </span>
                    <div className={styles.notificationCopy}>
                      <h3>{notification.title}</h3>
                      <p>{notification.body}</p>
                      <div className={styles.notificationMeta}>
                        <time dateTime={notification.createdAt}>
                          {timeAgo(notification.createdAt)}
                        </time>
                        {notification.link ? (
                          <Link
                            href={notification.link}
                            onClick={() => {
                              if (!notification.isRead) void markRead(notification._id);
                              setOpen(false);
                            }}
                          >
                            View <ExternalLink size={12} />
                          </Link>
                        ) : (
                          !notification.isRead && (
                            <button type="button" onClick={() => void markRead(notification._id)}>
                              Mark read
                            </button>
                          )
                        )}
                      </div>
                    </div>
                    <button
                      type="button"
                      className={styles.removeButton}
                      onClick={() => void removeNotification(notification._id, notification.isRead)}
                      aria-label={`Remove notification: ${notification.title}`}
                    >
                      <X size={14} />
                    </button>
                  </article>
                );
              })
            )}
          </div>
          <Link
            href={notificationsHref}
            onClick={() => setOpen(false)}
            className={styles.footerLink}
          >
            View all notifications <ExternalLink size={13} />
          </Link>
        </section>
      )}
    </div>
  );
}
