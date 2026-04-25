'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Mail } from 'lucide-react';
import Pusher from 'pusher-js';

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
    <Link href={href} style={{ textDecoration: 'none' }}>
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: compact ? 0 : 8,
          justifyContent: 'center',
          minWidth: compact ? 40 : undefined,
          minHeight: compact ? 40 : undefined,
          padding: compact ? '0' : '9px 12px',
          borderRadius: 999,
          border: '1px solid rgba(255,255,255,0.08)',
          background: 'rgba(255,255,255,0.05)',
          color: '#D8E3F1',
          fontSize: 12,
          fontWeight: 700,
          cursor: 'pointer',
          transition: 'background 0.2s',
          position: 'relative',
        }}
        aria-label="Messages"
      >
        <span style={{ display: 'inline-flex', color: '#22D3EE' }}>
          <Mail size={14} strokeWidth={2} />
        </span>
        {!compact && <span>Messages</span>}
        {unread > 0 && (
          <span
            style={{
              background: '#3B82F6',
              color: '#fff',
              fontSize: 10,
              fontWeight: 800,
              padding: compact ? '0 5px' : '1px 6px',
              borderRadius: 99,
              minWidth: 18,
              height: compact ? 18 : undefined,
              textAlign: 'center',
              position: compact ? 'absolute' : 'static',
              top: compact ? -2 : undefined,
              right: compact ? -2 : undefined,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {unread > 99 ? '99+' : unread}
          </span>
        )}
      </div>
    </Link>
  );
}
