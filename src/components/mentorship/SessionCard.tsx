'use client';

import { Calendar, Clock, Video, MoreVertical, MessageSquare } from 'lucide-react';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Session {
  _id: string;
  studentId: {
    _id: string;
    name: string;
    email: string;
    image?: string;
  };
  mentorId: {
    _id: string;
    userId: {
      _id: string;
      name: string;
      email: string;
      image?: string;
    };
  };
  status: 'pending' | 'accepted' | 'rejected' | 'completed' | 'cancelled';
  sessionType: string;
  studentNotes: string;
  scheduledAt?: string;
  durationMinutes: number;
  agoraChannelId?: string;
  completedAt?: string;
}

interface Props {
  session: Session;
  role: 'student' | 'mentor';
  onAction: (sessionId: string, action: string, data?: unknown) => void;
  onJoinVideo?: (sessionId: string) => void;
}

export default function SessionCard({ session, role, onAction, onJoinVideo }: Props) {
  const [menuOpen, setMenuOpen] = useState(false);
  const router = useRouter();
  const otherUser = role === 'student' ? session.mentorId?.userId : session.studentId;

  const statusColors = {
    pending: { bg: '#FEF3C7', text: '#D97706' },
    accepted: { bg: '#DBEAFE', text: '#2563EB' },
    rejected: { bg: '#FEE2E2', text: '#DC2626' },
    completed: { bg: '#D1FAE5', text: '#059669' },
    cancelled: { bg: '#F1F5F9', text: '#64748B' },
  };

  const statusConfig = statusColors[session.status] || statusColors.pending;

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        padding: 24,
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {otherUser?.image ? (
            <img
              src={otherUser.image}
              alt={otherUser.name || 'User'}
              style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }}
            />
          ) : (
            <div
              style={{
                width: 48,
                height: 48,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #3B82F6, #06B6D4)',
                color: '#FFFFFF',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 18,
                fontWeight: 800,
              }}
            >
              {otherUser?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
          )}
          <div>
            <h3 style={{ margin: '0 0 4px 0', fontSize: 16, fontWeight: 700, color: '#1E293B' }}>
              {otherUser?.name || 'Unknown User'}
            </h3>
            <span
              style={{
                display: 'inline-block',
                background: statusConfig.bg,
                color: statusConfig.text,
                fontSize: 12,
                fontWeight: 700,
                padding: '2px 8px',
                borderRadius: 999,
                textTransform: 'capitalize',
              }}
            >
              {session.status}
            </span>
          </div>
        </div>

        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            style={{
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#94A3B8',
              padding: 4,
            }}
          >
            <MoreVertical size={20} />
          </button>

          {menuOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                width: 160,
                background: '#FFFFFF',
                borderRadius: 12,
                boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
                border: '1px solid #E2E8F0',
                zIndex: 10,
                overflow: 'hidden',
              }}
            >
              {role === 'mentor' && session.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAction(session._id, 'accept');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#10B981',
                      fontWeight: 600,
                    }}
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => {
                      setMenuOpen(false);
                      onAction(session._id, 'reject');
                    }}
                    style={{
                      width: '100%',
                      padding: '10px 16px',
                      textAlign: 'left',
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      fontSize: 13,
                      color: '#EF4444',
                      fontWeight: 600,
                    }}
                  >
                    Reject
                  </button>
                </>
              )}
              {session.status === 'accepted' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(session._id, 'complete');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#10B981',
                    fontWeight: 600,
                  }}
                >
                  Mark Completed
                </button>
              )}
              {['pending', 'accepted'].includes(session.status) && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(session._id, 'cancel');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#64748B',
                    fontWeight: 600,
                  }}
                >
                  Cancel Session
                </button>
              )}
              {role === 'student' && session.status === 'completed' && (
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    onAction(session._id, 'rate');
                  }}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    textAlign: 'left',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 13,
                    color: '#F59E0B',
                    fontWeight: 600,
                  }}
                >
                  Rate Session
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gap: 8, fontSize: 14, color: '#475569' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Video size={16} /> <strong>Topic:</strong> {session.sessionType.replace('_', ' ')}
        </div>
        {session.scheduledAt && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={16} /> <strong>Date:</strong>{' '}
            {new Date(session.scheduledAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
            <Clock size={16} style={{ marginLeft: 8 }} />{' '}
            {new Date(session.scheduledAt).toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            })}
          </div>
        )}
      </div>

      <div
        style={{
          background: '#F8FAFC',
          padding: 16,
          borderRadius: 12,
          fontSize: 14,
          color: '#334155',
          lineHeight: 1.5,
        }}
      >
        <strong>Notes:</strong>
        <br />
        {session.studentNotes}
      </div>

      <div style={{ marginTop: 'auto', paddingTop: 16, display: 'flex', gap: 12 }}>
        {['pending', 'accepted', 'scheduled', 'completed'].includes(session.status) &&
          otherUser && (
            <button
              onClick={() => router.push(`/student/messages?user=${otherUser._id}`)}
              style={{
                flex: 1,
                padding: '12px',
                borderRadius: 12,
                background: '#F1F5F9',
                color: '#475569',
                fontWeight: 700,
                fontSize: 14,
                border: '1px solid #E2E8F0',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                transition: 'background 0.2s',
              }}
              onMouseOver={(e) => (e.currentTarget.style.background = '#E2E8F0')}
              onMouseOut={(e) => (e.currentTarget.style.background = '#F1F5F9')}
            >
              <MessageSquare size={18} /> Message
            </button>
          )}

        {session.status === 'accepted' && session.agoraChannelId && onJoinVideo && (
          <button
            onClick={() => onJoinVideo(session._id)}
            style={{
              flex: 1,
              padding: '12px',
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: 14,
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
            }}
          >
            <Video size={18} /> Join Video Call
          </button>
        )}
      </div>
    </div>
  );
}
