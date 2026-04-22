'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { GraduationCap, AlertTriangle, ShieldCheck, X } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onConverted: () => void;
}

export default function AlumniConversionModal({ isOpen, onClose, onConverted }: Props) {
  const { update } = useSession();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  async function handleConvert() {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/users/convert-alumni', {
        method: 'POST',
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to convert account.');
      }

      // Update NextAuth session to reflect the new role
      await update({ role: 'alumni' });

      onConverted();
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
          maxWidth: 480,
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
            <GraduationCap size={28} strokeWidth={2} />
          </div>

          <h2 style={{ fontSize: 24, fontWeight: 800, color: '#1E293B', margin: '0 0 8px 0' }}>
            Convert to Alumni Status
          </h2>
          <p style={{ fontSize: 15, color: '#64748B', lineHeight: 1.6, margin: '0 0 24px 0' }}>
            Congratulations on your graduation! You can now convert your account to alumni status to
            become a mentor and guide fellow students.
          </p>

          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 16,
              padding: 16,
              display: 'flex',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div style={{ color: '#EF4444', flexShrink: 0 }}>
              <AlertTriangle size={20} />
            </div>
            <div>
              <h4 style={{ margin: '0 0 4px 0', fontSize: 14, fontWeight: 700, color: '#991B1B' }}>
                Permanent Action
              </h4>
              <p style={{ margin: 0, fontSize: 13, color: '#B91C1C', lineHeight: 1.5 }}>
                Converting to alumni is irreversible. You will no longer be considered an active
                student. Make sure you are completely finished with your undergraduate studies.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gap: 12, marginBottom: 32 }}>
            {[
              'Create a professional mentor profile',
              'Set your availability & session limits',
              'Conduct 1:1 video sessions with students',
              'Retain access to select job postings',
            ].map((feature, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <ShieldCheck size={16} color="#10B981" />
                <span style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>{feature}</span>
              </div>
            ))}
          </div>

          {error && (
            <div style={{ color: '#EF4444', fontSize: 14, marginBottom: 16, textAlign: 'center' }}>
              {error}
            </div>
          )}

          <div style={{ display: 'flex', gap: 12 }}>
            <button
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
              onClick={handleConvert}
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
              {loading ? 'Converting...' : 'Convert to Alumni'}
            </button>
          </div>
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
