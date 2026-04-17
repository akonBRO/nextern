'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { WorkspaceAcademicReview } from '@/lib/opportunity-recommendations';

type Props = {
  studentId: string;
  role: 'advisor' | 'dept_head';
  reviews: WorkspaceAcademicReview[];
};

type FormState = {
  headline: string;
  summary: string;
  strengths: string;
  growthAreas: string;
  readinessLevel: 'priority_support' | 'developing' | 'ready';
  profileScore: string;
};

const initialForm: FormState = {
  headline: '',
  summary: '',
  strengths: '',
  growthAreas: '',
  readinessLevel: 'developing',
  profileScore: '',
};

function readinessTone(level: WorkspaceAcademicReview['readinessLevel']) {
  if (level === 'ready') return { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' };
  if (level === 'priority_support') {
    return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };
  }
  return { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };
}

function formatReadiness(level: WorkspaceAcademicReview['readinessLevel']) {
  return level.replace(/_/g, ' ');
}

export default function TeacherAcademicReviewComposer({ studentId, role, reviews }: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [archivePendingId, setArchivePendingId] = useState<string | null>(null);

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function resetForm() {
    setForm(initialForm);
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage(null);
    setError(null);

    const payload = {
      studentId,
      headline: form.headline.trim(),
      summary: form.summary.trim(),
      strengths: form.strengths
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      growthAreas: form.growthAreas
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      readinessLevel: form.readinessLevel,
      profileScore: form.profileScore ? Number(form.profileScore) : undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch('/api/academic-reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) {
          setError(data.error ?? 'Failed to save academic review.');
          return;
        }

        setMessage(data.message ?? 'Academic review saved.');
        resetForm();
        router.refresh();
      } catch {
        setError('Network error while saving academic review.');
      }
    });
  }

  async function handleArchive(id: string) {
    setArchivePendingId(id);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/academic-reviews/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to archive academic review.');
        return;
      }

      setMessage(data.message ?? 'Academic review archived.');
      router.refresh();
    } catch {
      setError('Network error while archiving academic review.');
    } finally {
      setArchivePendingId(null);
    }
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.08fr) minmax(0, 0.92fr)',
        gap: 18,
      }}
      className="teacher-review-grid"
    >
      <div
        style={{
          borderRadius: 24,
          background: '#FFFFFF',
          border: '1px solid #D9E2EC',
          boxShadow: '0 18px 34px rgba(15,23,42,0.06)',
          padding: 22,
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Profile review
          </div>
          <h3
            style={{
              margin: '8px 0 0',
              fontSize: 24,
              fontWeight: 900,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
            }}
          >
            Add an academic review
          </h3>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: '#64748B' }}>
            Record a clean, student-visible review of strengths, growth areas, and readiness. This
            becomes part of the student profile for future advising.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.2fr) minmax(0, 0.8fr)',
              gap: 12,
            }}
          >
            <Field label="Review headline">
              <input
                value={form.headline}
                onChange={(event) => update('headline', event.target.value)}
                placeholder="Example: Strong technical potential with interview gaps"
                style={inputStyle()}
              />
            </Field>
            <Field label="Readiness level">
              <select
                value={form.readinessLevel}
                onChange={(event) =>
                  update('readinessLevel', event.target.value as FormState['readinessLevel'])
                }
                style={inputStyle()}
              >
                <option value="ready">Ready</option>
                <option value="developing">Developing</option>
                <option value="priority_support">Priority support</option>
              </select>
            </Field>
          </div>

          <Field label="Profile summary">
            <textarea
              value={form.summary}
              onChange={(event) => update('summary', event.target.value)}
              placeholder="Summarize the student's overall profile, present standing, and what matters most right now."
              rows={5}
              style={{ ...inputStyle(), resize: 'vertical', minHeight: 136 }}
            />
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <Field label="Key strengths">
              <input
                value={form.strengths}
                onChange={(event) => update('strengths', event.target.value)}
                placeholder="Problem solving, teamwork, Java"
                style={inputStyle()}
              />
            </Field>
            <Field label="Growth areas">
              <input
                value={form.growthAreas}
                onChange={(event) => update('growthAreas', event.target.value)}
                placeholder="Interview confidence, Git, SQL"
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="Profile score">
            <input
              type="number"
              min={0}
              max={100}
              value={form.profileScore}
              onChange={(event) => update('profileScore', event.target.value)}
              placeholder="Optional"
              style={inputStyle()}
            />
          </Field>

          {message ? <InlineMessage tone="success" text={message} /> : null}
          {error ? <InlineMessage tone="error" text={error} /> : null}

          <div
            style={{
              borderRadius: 18,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '14px 16px',
              color: '#475569',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            {role === 'dept_head'
              ? 'Department-head reviews work best for overall readiness, academic alignment, and escalation decisions.'
              : 'Advisor reviews work best for coaching history, profile assessment, and practical next-step guidance.'}
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              border: 'none',
              borderRadius: 16,
              padding: '13px 18px',
              background: 'linear-gradient(135deg, #0F766E, #0D9488)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 800,
              cursor: isPending ? 'wait' : 'pointer',
            }}
          >
            {isPending ? 'Saving review...' : 'Save academic review'}
          </button>
        </form>
      </div>

      <div
        style={{
          borderRadius: 24,
          background: '#FFFFFF',
          border: '1px solid #D9E2EC',
          boxShadow: '0 18px 34px rgba(15,23,42,0.06)',
          padding: 22,
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
            }}
          >
            Saved reviews
          </div>
          <h3
            style={{
              margin: '8px 0 0',
              fontSize: 24,
              fontWeight: 900,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
            }}
          >
            Academic review history
          </h3>
        </div>

        {reviews.length === 0 ? (
          <div
            style={{
              borderRadius: 18,
              border: '1px dashed #CBD5E1',
              background: '#F8FAFC',
              padding: '24px 18px',
              color: '#64748B',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            No academic reviews have been saved yet for this student.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {reviews.map((item) => {
              const tone = readinessTone(item.readinessLevel);
              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    padding: 16,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                      flexWrap: 'wrap',
                    }}
                  >
                    <div>
                      <div
                        style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '6px 10px',
                            borderRadius: 999,
                            background: tone.bg,
                            border: `1px solid ${tone.border}`,
                            color: tone.color,
                            fontSize: 11,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                          }}
                        >
                          {formatReadiness(item.readinessLevel)}
                        </span>
                        {typeof item.profileScore === 'number' ? (
                          <Chip label={`Profile ${item.profileScore}%`} tone="info" />
                        ) : null}
                      </div>
                      <div
                        style={{
                          marginTop: 10,
                          fontSize: 17,
                          fontWeight: 800,
                          color: '#0F172A',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {item.headline}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={archivePendingId === item.id}
                      onClick={() => handleArchive(item.id)}
                      style={{
                        borderRadius: 12,
                        border: '1px solid #CBD5E1',
                        background: '#FFFFFF',
                        color: '#334155',
                        padding: '10px 12px',
                        fontSize: 12,
                        fontWeight: 700,
                        cursor: archivePendingId === item.id ? 'wait' : 'pointer',
                      }}
                    >
                      {archivePendingId === item.id ? 'Archiving...' : 'Archive'}
                    </button>
                  </div>

                  <p
                    style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: '#475569' }}
                  >
                    {item.summary}
                  </p>

                  <div
                    style={{
                      display: 'grid',
                      gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
                      gap: 12,
                      marginTop: 12,
                    }}
                    className="teacher-review-detail-grid"
                  >
                    <ReviewBucket
                      title="Strengths"
                      items={item.strengths}
                      tone="success"
                      emptyText="No strengths were listed."
                    />
                    <ReviewBucket
                      title="Growth areas"
                      items={item.growthAreas}
                      tone="warning"
                      emptyText="No growth areas were listed."
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .teacher-review-grid,
          .teacher-review-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({ label, tone }: { label: string; tone: 'info' | 'success' | 'warning' }) {
  const palette =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        padding: '6px 10px',
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function ReviewBucket({
  title,
  items,
  tone,
  emptyText,
}: {
  title: string;
  items: string[];
  tone: 'success' | 'warning';
  emptyText: string;
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        background: '#F8FAFC',
        padding: 14,
      }}
    >
      <div
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
        {items.length > 0 ? (
          items.map((item) => <Chip key={`${title}:${item}`} label={item} tone={tone} />)
        ) : (
          <span style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function InlineMessage({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  const palette =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        padding: '11px 13px',
        fontSize: 13,
        fontWeight: 700,
      }}
    >
      {text}
    </div>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 14,
    border: '1px solid #CBD5E1',
    padding: '12px 14px',
    fontSize: 14,
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
  };
}
