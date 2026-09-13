'use client';

import { useState } from 'react';
import useDialog from '@/components/ui/useDialog';
import './mentorship.css';
import { X, Star } from 'lucide-react';

interface Props {
  isOpen: boolean;
  sessionId: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function RateSessionModal({ isOpen, sessionId, onClose, onSuccess }: Props) {
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [review, setReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const dialogRef = useDialog(isOpen, loading ? undefined : onClose);
  if (!isOpen) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (rating === 0) {
      setError('Please select a star rating.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/mentor-sessions/${sessionId}/rate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, review }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to submit rating.');
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
      className="mentor-modal-backdrop"
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
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label="Rate your session"
        tabIndex={-1}
        className="mentor-modal-panel"
        style={{
          background: '#FFFFFF',
          borderRadius: 12,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 48px rgba(15,23,42,0.15)',
          overflow: 'hidden',
          animation: 'fadeInUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
        }}
      >
        <div style={{ position: 'relative', padding: 32 }}>
          <button
            aria-label="Close dialog"
            onClick={onClose}
            disabled={loading}
            style={{
              position: 'absolute',
              top: 24,
              right: 24,
              background: 'transparent',
              border: 'none',
              color: '#6e7f89',
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
              borderRadius: 12,
              background: '#FEF3C7',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#D97706',
              marginBottom: 20,
            }}
          >
            <Star size={28} strokeWidth={2} fill="currentColor" />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 700, color: '#182c39', margin: '0 0 8px 0' }}>
            Rate Your Session
          </h2>
          <p style={{ fontSize: 15, color: '#60717d', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Your feedback helps us maintain a high-quality mentorship network and guide other
            students.
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 20 }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 16 }}>
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    aria-label={`Rate ${star} out of 5`}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    style={{
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      padding: 4,
                      transition: 'transform 0.1s',
                      transform: (hoverRating || rating) >= star ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    <Star
                      size={32}
                      color={(hoverRating || rating) >= star ? '#F59E0B' : '#dfe6e9'}
                      fill={(hoverRating || rating) >= star ? '#F59E0B' : 'transparent'}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 14,
                  fontWeight: 700,
                  color: '#435663',
                  marginBottom: 8,
                }}
              >
                Written Review (Optional)
              </label>
              <textarea
                aria-label="Session notes"
                value={review}
                onChange={(e) => setReview(e.target.value)}
                placeholder="How did the mentor help you?"
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: 12,
                  border: '1px solid #dfe6e9',
                  background: '#f6f8f9',
                  color: '#182c39',
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
                  border: '1px solid #dfe6e9',
                  background: '#FFFFFF',
                  color: '#60717d',
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
                  background: '#F59E0B',
                  color: '#FFFFFF',
                  fontSize: 15,
                  fontWeight: 700,
                  cursor: 'pointer',
                  opacity: loading ? 0.7 : 1,
                  boxShadow: '0 2px 8px rgba(24,44,57,0.04)',
                }}
              >
                {loading ? 'Submitting...' : 'Submit Rating'}
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
