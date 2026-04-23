'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { ArrowLeft, CalendarDays, Inbox } from 'lucide-react';
import SessionCard from '@/components/mentorship/SessionCard';
import RateSessionModal from '@/components/mentorship/RateSessionModal';
import VideoSessionLauncher from '@/components/mentorship/VideoSessionLauncher';

export default function MyMentorSessionsPage() {
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  const [rateModalOpen, setRateModalOpen] = useState(false);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);

  useEffect(() => {
    fetchSessions();
  }, []);

  async function fetchSessions() {
    try {
      setLoading(true);
      const res = await fetch('/api/mentor-sessions?role=student');
      if (res.ok) {
        const data = await res.json();
        setSessions(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(sessionId: string, action: string) {
    if (action === 'rate') {
      setSelectedSessionId(sessionId);
      setRateModalOpen(true);
      return;
    }

    if (action === 'cancel') {
      if (!confirm('Are you sure you want to cancel this session?')) return;
      try {
        const res = await fetch(`/api/mentor-sessions/${sessionId}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: 'cancelled' }),
        });
        if (res.ok) {
          fetchSessions();
        }
      } catch (err) {
        console.error(err);
      }
    }
  }

  const upcomingSessions = sessions.filter((s) => ['pending', 'accepted'].includes(s.status));
  const pastSessions = sessions.filter((s) =>
    ['completed', 'rejected', 'cancelled'].includes(s.status)
  );

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto', padding: '40px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 40 }}>
        <Link
          href="/student/mentorship"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: 40,
            height: 40,
            borderRadius: 12,
            background: '#F8FAFC',
            color: '#64748B',
            border: '1px solid #E2E8F0',
            textDecoration: 'none',
          }}
        >
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1
            style={{
              fontSize: 32,
              fontWeight: 900,
              color: '#1E293B',
              margin: '0 0 4px 0',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <CalendarDays size={32} color="#2563EB" />
            My Mentorship Sessions
          </h1>
          <p style={{ fontSize: 16, color: '#64748B', margin: 0 }}>
            Track and manage your upcoming and past mentorship requests.
          </p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 40 }}>
        {/* Upcoming */}
        <section>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#1E293B',
              margin: '0 0 20px 0',
              paddingBottom: 12,
              borderBottom: '2px solid #E2E8F0',
            }}
          >
            Upcoming & Pending
          </h2>
          {loading ? (
            <div style={{ padding: 40, textAlign: 'center', color: '#94A3B8' }}>
              Loading sessions...
            </div>
          ) : upcomingSessions.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 20,
                maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto',
                paddingRight: 8,
              }}
            >
              {upcomingSessions.map((session) => (
                <div
                  key={session._id}
                  style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 12 }}
                >
                  <SessionCard session={session} role="student" onAction={handleAction} />
                  {session.status === 'accepted' && session.agoraChannelId && (
                    <VideoSessionLauncher sessionId={session._id as string} />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div
              style={{
                background: '#F8FAFC',
                padding: 40,
                borderRadius: 20,
                border: '2px dashed #E2E8F0',
                textAlign: 'center',
              }}
            >
              <Inbox
                size={48}
                color="#94A3B8"
                style={{ margin: '0 auto 16px auto', display: 'block' }}
              />
              <h3 style={{ margin: '0 0 8px 0', fontSize: 16, fontWeight: 700, color: '#475569' }}>
                No upcoming sessions
              </h3>
              <p style={{ margin: 0, color: '#94A3B8', fontSize: 14 }}>
                Browse mentors to request a new session.
              </p>
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: '#1E293B',
              margin: '0 0 20px 0',
              paddingBottom: 12,
              borderBottom: '2px solid #E2E8F0',
            }}
          >
            Past Sessions
          </h2>
          {loading ? null : pastSessions.length > 0 ? (
            <div
              style={{
                display: 'grid',
                gap: 20,
                maxHeight: 'calc(100vh - 250px)',
                overflowY: 'auto',
                paddingRight: 8,
              }}
            >
              {pastSessions.map((session) => (
                <SessionCard
                  key={session._id}
                  session={session}
                  role="student"
                  onAction={handleAction}
                />
              ))}
            </div>
          ) : (
            <div style={{ color: '#94A3B8', fontSize: 14 }}>No past sessions found.</div>
          )}
        </section>
      </div>

      {rateModalOpen && selectedSessionId && (
        <RateSessionModal
          isOpen={rateModalOpen}
          sessionId={selectedSessionId}
          onClose={() => setRateModalOpen(false)}
          onSuccess={() => {
            setRateModalOpen(false);
            fetchSessions();
          }}
        />
      )}
    </div>
  );
}
