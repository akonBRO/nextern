'use client';

import { useState } from 'react';
import { X, Calendar, Video, FileText } from 'lucide-react';

interface Props {
  isOpen: boolean;
  mentorId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RequestSessionModal({ isOpen, mentorId, onClose, onSuccess }: Props) {
  const [sessionType, setSessionType] = useState('career_advice');
  const [studentNotes, setStudentNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!studentNotes.trim()) {
      setError('Please provide some notes on what you want to discuss.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/mentor-sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mentorId, sessionType, studentNotes }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to request session.');
      }

      onSuccess();
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(15,23,42,0.6)',
        backdropFilter: 'blur(4px)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 24,
      }}
    >
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          width: '100%',
          maxWidth: 520,
          boxShadow: '0 24px 48px rgba(15,23,42,0.15)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ position: 'relative', padding: 32 }}>
          <button
            onClick={onClose}
            disabled={loading}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'transparent',
              border: 'none',
              color: '#94A3B8',
              cursor: 'pointer',
              padding: 4,
            }}
          >
            <X size={20} />
          </button>

          <div
            style={{
              width: 56,
              height: 56,
              borderRadius: 16,
              background: 'linear-gradient(135deg, #EFF6FF, #DBEAFE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#2563EB',
              marginBottom: 20,
            }}
          >
            <Calendar size={28} strokeWidth={2} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>
            Request Mentorship Session
          </h2>
          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Submit a request to schedule a 1:1 video session. Free users get 2 requests per month.
            Premium users have unlimited access.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: 8,
                }}
              >
                <Video size={16} /> Session Topic
              </label>
              <select
                value={sessionType}
                onChange={(e) => setSessionType(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: 15,
                  fontWeight: 500,
                  outline: 'none',
                }}
              >
                <option value="career_advice">Career Guidance</option>
                <option value="resume_review">Resume / Portfolio Review</option>
                <option value="mock_interview">Interview Preparation</option>
                <option value="general">Technical Help & Networking</option>
              </select>
            </div>

            <div>
              <label
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#475569',
                  marginBottom: 8,
                }}
              >
                <FileText size={16} /> What would you like to discuss?
              </label>
              <textarea
                value={studentNotes}
                onChange={(e) => setStudentNotes(e.target.value)}
                placeholder="Be specific so the mentor can prepare..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  color: '#1E293B',
                  fontSize: 15,
                  resize: 'none',
                  outline: 'none',
                  fontFamily: 'inherit',
                }}
              />
            </div>

            {error && (
              <div
                style={{
                  color: '#EF4444',
                  fontSize: 14,
                  background: '#FEF2F2',
                  padding: '12px',
                  borderRadius: 8,
                  border: '1px solid #FECACA',
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: 'flex', gap: 12, marginTop: 8 }}>
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  color: '#64748B',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  flex: 2,
                  padding: '12px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
                }}
              >
                {loading ? 'Submitting...' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `,
        }}
      />
    </div>
  );
}
