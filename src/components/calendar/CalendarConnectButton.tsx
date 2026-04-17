'use client';
// src/components/calendar/CalendarConnectButton.tsx

import { useState } from 'react';
import { Calendar, CalendarCheck, Loader2, Unlink } from 'lucide-react';

type Props = {
  isConnected: boolean;
  onConnect?: () => void;
  callbackUrl?: string;
  description?: string;
  connectedDescription?: string;
};

export default function CalendarConnectButton({
  isConnected,
  onConnect,
  callbackUrl,
  description = 'Auto-sync job deadlines, interviews, and event dates to your personal Google Calendar. Never miss an opportunity.',
  connectedDescription = 'Deadlines and interviews sync automatically',
}: Props) {
  const [loading, setLoading] = useState(false);
  const [connected, setConnected] = useState(isConnected);
  const [syncing, setSyncing] = useState(false);
  const [syncDone, setSyncDone] = useState(false);

  function handleConnect() {
    setLoading(true);
    // Redirect to our dedicated calendar OAuth route which requests
    // the calendar scope with prompt=consent so we always get a refresh token.
    window.location.href = callbackUrl
      ? `/api/calendar/connect?callbackUrl=${encodeURIComponent(callbackUrl)}`
      : '/api/calendar/connect';
  }

  async function handleResync() {
    setSyncing(true);
    try {
      const res = await fetch('/api/calendar/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resync: true }),
      });
      if (res.ok) {
        setSyncDone(true);
        setTimeout(() => setSyncDone(false), 4000);
        onConnect?.();
      }
    } catch {
      // silent
    } finally {
      setSyncing(false);
    }
  }

  async function handleDisconnect() {
    try {
      await fetch('/api/calendar/disconnect', { method: 'POST' });
      setConnected(false);
    } catch {
      // silent
    }
  }

  if (connected) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '14px 18px',
          background: 'linear-gradient(135deg, #ECFDF5, #F0FDF4)',
          border: '1.5px solid #A7F3D0',
          borderRadius: 14,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div
            style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: 'linear-gradient(135deg, #10B981, #059669)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 10px rgba(16,185,129,0.3)',
            }}
          >
            <CalendarCheck size={16} />
          </div>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>
              Google Calendar connected
            </div>
            <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>
              {connectedDescription}
            </div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button
            onClick={handleResync}
            disabled={syncing}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              padding: '7px 12px',
              background: '#fff',
              border: '1px solid #A7F3D0',
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              color: '#065F46',
              cursor: syncing ? 'not-allowed' : 'pointer',
            }}
          >
            {syncing ? (
              <Loader2 size={12} style={{ animation: 'spin 0.8s linear infinite' }} />
            ) : (
              <Calendar size={12} />
            )}
            {syncDone ? 'Synced!' : syncing ? 'Syncing…' : 'Re-sync'}
          </button>
          <button
            onClick={handleDisconnect}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              padding: '7px 12px',
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 9,
              fontSize: 12,
              fontWeight: 700,
              color: '#DC2626',
              cursor: 'pointer',
            }}
          >
            <Unlink size={12} /> Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: '20px 18px',
        background: 'linear-gradient(135deg, #EFF6FF, #F5F3FF)',
        border: '1.5px dashed #BFDBFE',
        borderRadius: 14,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
          }}
        >
          <Calendar size={18} />
        </div>
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
            Connect Google Calendar
          </div>
          <div style={{ fontSize: 12, color: '#64748B', marginTop: 2, maxWidth: 320 }}>
            {description}
          </div>
        </div>
      </div>
      <button
        onClick={handleConnect}
        disabled={loading}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 7,
          padding: '10px 18px',
          background: loading ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #7C3AED)',
          color: '#fff',
          border: 'none',
          borderRadius: 11,
          fontSize: 13,
          fontWeight: 700,
          cursor: loading ? 'not-allowed' : 'pointer',
          boxShadow: loading ? 'none' : '0 4px 14px rgba(37,99,235,0.35)',
          whiteSpace: 'nowrap',
          flexShrink: 0,
        }}
      >
        {loading ? (
          <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />
        ) : (
          <Calendar size={14} />
        )}
        {loading ? 'Connecting…' : 'Connect'}
      </button>
    </div>
  );
}
