'use client';

import { useState } from 'react';

export default function CloseJobButton({ jobId }: { jobId: string }) {
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleClose() {
    setLoading(true);
    await fetch(`/api/jobs/${jobId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: false }),
    });
    setLoading(false);
    setShowModal(false);
    window.location.reload();
  }

  return (
    <>
      <button
        type="button"
        onClick={() => setShowModal(true)}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: '#FFFBEB',
          color: '#92400E',
          padding: '8px 14px',
          borderRadius: 10,
          fontSize: 12,
          fontWeight: 600,
          border: '1px solid #FDE68A',
          cursor: 'pointer',
        }}
      >
        Close listing
      </button>

      {showModal && (
        <div
          onClick={(e) => e.target === e.currentTarget && setShowModal(false)}
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 36px',
              width: '100%',
              maxWidth: 420,
              boxShadow: '0 24px 64px rgba(0,0,0,0.2)',
              border: '1px solid #E2E8F0',
            }}
          >
            {/* Icon */}
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: '#FFFBEB',
                border: '1px solid #FDE68A',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 24,
                marginBottom: 20,
              }}
            >
              ⚠️
            </div>

            <h3
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                margin: 0,
                marginBottom: 8,
              }}
            >
              Close this listing?
            </h3>
            <p
              style={{
                color: '#64748B',
                fontSize: 14,
                lineHeight: 1.7,
                margin: 0,
                marginBottom: 28,
              }}
            >
              This listing will be hidden from students immediately. Existing applications will not
              be affected and you can reopen it anytime from the edit page.
            </p>

            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => setShowModal(false)}
                style={{
                  flex: 1,
                  padding: '11px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  background: '#fff',
                  color: '#475569',
                  cursor: 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Keep it open
              </button>
              <button
                onClick={handleClose}
                disabled={loading}
                style={{
                  flex: 1,
                  padding: '11px',
                  background: loading ? '#FDE68A' : 'linear-gradient(135deg, #F59E0B, #D97706)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(245,158,11,0.35)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 7,
                }}
              >
                {loading ? (
                  <>
                    <span
                      style={{
                        width: 14,
                        height: 14,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Closing…
                  </>
                ) : (
                  'Yes, close it'
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}
