'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import Pusher from 'pusher-js';
import styles from '@/components/dashboard/HeaderActions.module.css';

interface MessageBellProps {
  userId: string;
  initialUnread: number;
  href: string;
  compact?: boolean;
}

export default function MessageBell({
  userId,
  initialUnread,
  href,
  compact = false,
}: MessageBellProps) {
  const [unread, setUnread] = useState(initialUnread);
  const pusherRef = useRef<Pusher | null>(null);

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_PUSHER_KEY || !process.env.NEXT_PUBLIC_PUSHER_CLUSTER) return;

    // Subscribe to the user's Pusher channel for new messages
    if (!pusherRef.current) {
      pusherRef.current = new Pusher(process.env.NEXT_PUBLIC_PUSHER_KEY, {
        cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER,
      });
    }

    const channel = pusherRef.current.subscribe(`user-${userId}`);

    // New message received — bump the unread count
    channel.bind('new-message', () => {
      setUnread((prev) => prev + 1);
    });

    // Decrement when user reads messages inside the Inbox (dispatched by Inbox.tsx)
    const handleRead = (e: Event) => {
      const count = (e as CustomEvent<{ count: number }>).detail?.count ?? 1;
      setUnread((prev) => Math.max(0, prev - count));
    };

    // Intercept: message arrived while thread was open — don't bump
    const handleIntercepted = () => {
      // The new-message event already fired; subtract what we just added
      setUnread((prev) => Math.max(0, prev - 1));
    };

    window.addEventListener('messages-read', handleRead as EventListener);
    window.addEventListener('message-intercepted', handleIntercepted);

    return () => {
      pusherRef.current?.unsubscribe(`user-${userId}`);
      window.removeEventListener('messages-read', handleRead as EventListener);
      window.removeEventListener('message-intercepted', handleIntercepted);
    };
  }, [userId]);

  return (
    <Link
      href={href}
      className={`${styles.headerButton} ${compact ? styles.compact : ''}`}
      aria-label={`Messages${unread ? `, ${unread} unread` : ''}`}
    >
      <Mail size={18} strokeWidth={1.8} aria-hidden="true" />
      {!compact && <span>Messages</span>}
      {unread > 0 && <span className={styles.count}>{unread > 99 ? '99+' : unread}</span>}
    </Link>
  );
}
