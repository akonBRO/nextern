'use client';
// src/components/academic/TeacherAcademicReviewComposer.tsx

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

type ApiResponse = {
  error?: string;
  message?: string;
  details?: Record<string, string[] | undefined>;
};

function getApiErrorMessage(data: ApiResponse | null | undefined, fallback: string) {
  const detail = Object.values(data?.details ?? {})
    .flat()
    .find((m): m is string => typeof m === 'string' && m.trim().length > 0);
  return detail ?? data?.error ?? fallback;
}

function readinessTone(level: WorkspaceAcademicReview['readinessLevel']) {
  if (level === 'ready') return { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' };
  if (level === 'priority_support') return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };
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
  const [editingReviewId, setEditingReviewId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedReviewIds, setExpandedReviewIds] = useState<Record<string, boolean>>({});

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingReviewId(null);
  }

  function toggleReviewExpanded(id: string) {
    setExpandedReviewIds((c) => ({ ...c, [id]: !c[id] }));
  }

  function startEditing(review: WorkspaceAcademicReview) {
    setForm({
      headline: review.headline,
      summary: review.summary,
      strengths: review.strengths.join(', '),
      growthAreas: review.growthAreas.join(', '),
      readinessLevel: review.readinessLevel,
      profileScore: typeof review.profileScore === 'number' ? String(review.profileScore) : '',
    });
    setEditingReviewId(review.id);
    setConfirmDeleteId(null);
    setMessage(null);
    setError(null);
    setExpandedReviewIds((c) => ({ ...c, [review.id]: true }));
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function cancelEditing() {
    resetForm();
    setConfirmDeleteId(null);
    setMessage(null);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    setError(null);

    const payload = {
      studentId,
      headline: form.headline.trim(),
      summary: form.summary.trim(),
      strengths: form.strengths
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      growthAreas: form.growthAreas
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      readinessLevel: form.readinessLevel,
      profileScore: form.profileScore ? Number(form.profileScore) : undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch(
          editingReviewId ? `/api/academic-reviews/${editingReviewId}` : '/api/academic-reviews',
          {
            method: editingReviewId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const data = (await res.json()) as ApiResponse;
        if (!res.ok) {
          setError(getApiErrorMessage(data, 'Failed to save academic review.'));
          return;
        }
        setMessage(
          data.message ?? (editingReviewId ? 'Academic review updated.' : 'Academic review saved.')
        );
        resetForm();
        router.refresh();
      } catch {
        setError(
          editingReviewId
            ? 'Network error while updating academic review.'
            : 'Network error while saving academic review.'
        );
      }
    });
  }

  async function handleDelete(id: string) {
    setDeletePendingId(id);
    setConfirmDeleteId(null);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch(`/api/academic-reviews/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(getApiErrorMessage(data, 'Failed to delete academic review.'));
        return;
      }
      if (editingReviewId === id) resetForm();
      setMessage(data.message ?? 'Academic review deleted.');
      router.refresh();
    } catch {
      setError('Network error while deleting academic review.');
    } finally {
      setDeletePendingId(null);
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
      {/* ── Composer ── */}
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
            {editingReviewId ? 'Edit academic review' : 'Add an academic review'}
          </h3>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: '#64748B' }}>
            {editingReviewId
              ? 'Update the saved review, then save your changes. Cancel anytime to return to a new review.'
              : 'Record a clean, student-visible review of strengths, growth areas, and readiness. This becomes part of the student profile for future advising.'}
          </p>
        </div>

        {/* Active-edit banner */}
        {editingReviewId && (
          <div
            style={{
              borderRadius: 14,
              border: '1.5px solid #93C5FD',
              background: 'linear-gradient(135deg, #EFF6FF, #F0F9FF)',
              padding: '12px 15px',
              marginBottom: 16,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {/* pencil icon */}
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 10,
                  background: '#BFDBFE',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <svg
                  width="15"
                  height="15"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#1D4ED8"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                Editing an existing review — save to update or cancel to discard.
              </span>
            </div>
            <button
              type="button"
              onClick={cancelEditing}
              disabled={isPending}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#64748B',
                background: '#F1F5F9',
                border: '1px solid #CBD5E1',
                borderRadius: 10,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              Cancel edit
            </button>
          </div>
        )}

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
                onChange={(e) => update('headline', e.target.value)}
                placeholder="Strong technical potential with interview gaps"
                required
                minLength={3}
                maxLength={160}
                style={inputStyle()}
              />
            </Field>
            <Field label="Readiness level">
              <select
                value={form.readinessLevel}
                onChange={(e) =>
                  update('readinessLevel', e.target.value as FormState['readinessLevel'])
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
              onChange={(e) => update('summary', e.target.value)}
              placeholder="Summarize the student's overall profile, present standing, and what matters most right now."
              rows={5}
              required
              minLength={20}
              maxLength={2400}
              style={{ ...inputStyle(), resize: 'vertical', minHeight: 136 }}
            />
          </Field>

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}
          >
            <Field label="Key strengths">
              <input
                value={form.strengths}
                onChange={(e) => update('strengths', e.target.value)}
                placeholder="Problem solving, teamwork, Java"
                style={inputStyle()}
              />
            </Field>
            <Field label="Growth areas">
              <input
                value={form.growthAreas}
                onChange={(e) => update('growthAreas', e.target.value)}
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
              onChange={(e) => update('profileScore', e.target.value)}
              placeholder="Optional"
              inputMode="numeric"
              style={inputStyle()}
            />
          </Field>

          {message && <InlineMessage tone="success" text={message} />}
          {error && <InlineMessage tone="error" text={error} />}

          <div
            style={{
              borderRadius: 14,
              background: '#F8FAFC',
              border: '1px solid #E2E8F0',
              padding: '12px 14px',
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
              borderRadius: 14,
              padding: '13px 20px',
              background: isPending ? '#99F6E4' : 'linear-gradient(135deg, #0F766E, #0D9488)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 800,
              cursor: isPending ? 'wait' : 'pointer',
              alignSelf: 'start',
            }}
          >
            {isPending
              ? editingReviewId
                ? 'Updating review…'
                : 'Saving review…'
              : editingReviewId
                ? 'Update academic review'
                : 'Save academic review'}
          </button>
        </form>
      </div>

      {/* ── History ── */}
      <div
        style={{
          borderRadius: 24,
          background: '#FFFFFF',
          border: '1px solid #D9E2EC',
          boxShadow: '0 18px 34px rgba(15,23,42,0.06)',
          padding: 22,
        }}
      >
        <div
          style={{
            marginBottom: 18,
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            alignItems: 'flex-start',
            flexWrap: 'wrap',
          }}
        >
          <div>
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
                fontSize: 22,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
              }}
            >
              Academic review history
            </h3>
          </div>
          {reviews.length > 0 && <Chip label={`${reviews.length} saved`} tone="info" />}
        </div>

        {reviews.length === 0 ? (
          <div
            style={{
              borderRadius: 16,
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
          <div
            style={{ display: 'grid', gap: 12, maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}
            className="teacher-history-scroll"
          >
            {reviews.map((item) => {
              const tone = readinessTone(item.readinessLevel);
              const isExpanded = Boolean(expandedReviewIds[item.id]);
              const isEditing = editingReviewId === item.id;
              const isDeleting = deletePendingId === item.id;
              const isConfirming = confirmDeleteId === item.id;

              return (
                <div
                  key={item.id}
                  style={{
                    borderRadius: 18,
                    border: isEditing ? '1.5px solid #93C5FD' : '1px solid #E2E8F0',
                    background: isEditing ? '#F8FBFF' : '#FFFFFF',
                    padding: 16,
                    transition: 'border-color 0.15s, background 0.15s',
                  }}
                >
                  {/* Card header */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 12,
                    }}
                    className="teacher-history-item-header"
                  >
                    <div style={{ minWidth: 0, flex: '1 1 0%' }}>
                      {isEditing && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            background: '#BFDBFE',
                            color: '#1D4ED8',
                            borderRadius: 999,
                            padding: '2px 8px',
                            fontSize: 10,
                            fontWeight: 800,
                            textTransform: 'uppercase',
                            letterSpacing: 0.5,
                            marginBottom: 6,
                          }}
                        >
                          <svg
                            width="10"
                            height="10"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                          </svg>
                          Editing now
                        </div>
                      )}
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: '#0F172A',
                          overflowWrap: 'anywhere',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {item.headline}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}
                      className="teacher-history-item-actions"
                    >
                      {/* Edit button */}
                      <button
                        type="button"
                        disabled={isPending || isDeleting}
                        onClick={() => (isEditing ? cancelEditing() : startEditing(item))}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 5,
                          borderRadius: 10,
                          border: isEditing ? '1px solid #93C5FD' : '1px solid #BFDBFE',
                          background: isEditing ? '#DBEAFE' : '#EFF6FF',
                          color: '#1D4ED8',
                          padding: '8px 11px',
                          fontSize: 12,
                          fontWeight: 700,
                          cursor: 'pointer',
                          whiteSpace: 'nowrap',
                        }}
                      >
                        {isEditing ? (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M18 6L6 18M6 6l12 12" />
                            </svg>{' '}
                            Cancel
                          </>
                        ) : (
                          <>
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
                            </svg>{' '}
                            Edit
                          </>
                        )}
                      </button>

                      {/* Delete — two-step confirm */}
                      {isConfirming ? (
                        <>
                          <button
                            type="button"
                            disabled={isDeleting}
                            onClick={() => handleDelete(item.id)}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 5,
                              borderRadius: 10,
                              border: 'none',
                              background: '#DC2626',
                              color: '#FFFFFF',
                              padding: '8px 11px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: isDeleting ? 'wait' : 'pointer',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {isDeleting ? (
                              'Deleting…'
                            ) : (
                              <>
                                <svg
                                  width="12"
                                  height="12"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2.5"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <polyline points="20 6 9 17 4 12" />
                                </svg>{' '}
                                Confirm delete
                              </>
                            )}
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            style={{
                              borderRadius: 10,
                              border: '1px solid #E2E8F0',
                              background: '#F8FAFC',
                              color: '#64748B',
                              padding: '8px 10px',
                              fontSize: 12,
                              fontWeight: 700,
                              cursor: 'pointer',
                            }}
                          >
                            Keep
                          </button>
                        </>
                      ) : (
                        <button
                          type="button"
                          disabled={isDeleting || isPending}
                          onClick={() => setConfirmDeleteId(item.id)}
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 5,
                            borderRadius: 10,
                            border: '1px solid #FECACA',
                            background: '#FEF2F2',
                            color: '#B91C1C',
                            padding: '8px 11px',
                            fontSize: 12,
                            fontWeight: 700,
                            cursor: isDeleting || isPending ? 'wait' : 'pointer',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                          Delete
                        </button>
                      )}

                      {/* Expand/collapse */}
                      <button
                        type="button"
                        onClick={() => toggleReviewExpanded(item.id)}
                        aria-label={isExpanded ? 'Collapse' : 'Expand'}
                        style={{
                          width: 36,
                          height: 36,
                          borderRadius: 10,
                          border: '1px solid #E2E8F0',
                          background: '#F8FAFC',
                          color: '#64748B',
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          flexShrink: 0,
                        }}
                      >
                        <svg
                          width="14"
                          height="14"
                          viewBox="0 0 16 16"
                          fill="none"
                          style={{
                            transform: isExpanded ? 'rotate(180deg)' : 'none',
                            transition: 'transform 0.2s',
                          }}
                        >
                          <path
                            d="M4 6L8 10L12 6"
                            stroke="currentColor"
                            strokeWidth="1.8"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Confirm delete warning */}
                  {isConfirming && (
                    <div
                      style={{
                        marginTop: 10,
                        borderRadius: 10,
                        border: '1px solid #FECACA',
                        background: '#FFF5F5',
                        padding: '9px 12px',
                        fontSize: 12,
                        color: '#991B1B',
                        fontWeight: 600,
                        lineHeight: 1.5,
                      }}
                    >
                      This will permanently delete the review. This action cannot be undone.
                    </div>
                  )}

                  {/* Expanded body */}
                  {isExpanded && (
                    <>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 8,
                          flexWrap: 'wrap',
                          marginTop: 12,
                        }}
                      >
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            padding: '5px 10px',
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
                        {typeof item.profileScore === 'number' && (
                          <Chip label={`Profile ${item.profileScore}%`} tone="info" />
                        )}
                      </div>
                      <p
                        style={{
                          margin: '10px 0 0',
                          fontSize: 14,
                          lineHeight: 1.7,
                          color: '#475569',
                          overflowWrap: 'anywhere',
                        }}
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
                          emptyText="No strengths listed."
                        />
                        <ReviewBucket
                          title="Growth areas"
                          items={item.growthAreas}
                          tone="warning"
                          emptyText="No growth areas listed."
                        />
                      </div>
                      <div style={{ marginTop: 12, fontSize: 12, color: '#94A3B8' }}>
                        Added {new Date(item.createdAt).toLocaleDateString()}
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .teacher-review-grid, .teacher-review-detail-grid { grid-template-columns: 1fr !important; }
          .teacher-history-scroll { max-height: 520px !important; }
        }
        @media (max-width: 720px) {
          .teacher-history-item-header { flex-wrap: wrap !important; }
          .teacher-history-item-actions { width: 100%; }
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
  const p =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166634' }
      : tone === 'warning'
        ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
        : { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        borderRadius: 999,
        border: `1px solid ${p.border}`,
        background: p.bg,
        color: p.color,
        padding: '5px 10px',
        fontSize: 12,
        fontWeight: 700,
        overflowWrap: 'anywhere',
        whiteSpace: 'normal',
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
  const p =
    tone === 'success'
      ? { bg: '#F0FDF4', border: '#BBF7D0', color: '#166534' }
      : { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };
  return (
    <div
      style={{
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        background: '#F8FAFC',
        padding: 13,
        minWidth: 0,
      }}
    >
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
          marginBottom: 10,
        }}
      >
        {title}
      </div>
      <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
        {items.length > 0 ? (
          items.map((s) => (
            <span
              key={`${title}:${s}`}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                borderRadius: 999,
                border: `1px solid ${p.border}`,
                background: p.bg,
                color: p.color,
                padding: '4px 9px',
                fontSize: 12,
                fontWeight: 600,
              }}
            >
              {s}
            </span>
          ))
        ) : (
          <span style={{ fontSize: 13, color: '#94A3B8' }}>{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function InlineMessage({ tone, text }: { tone: 'success' | 'error'; text: string }) {
  const p =
    tone === 'success'
      ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
      : { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };
  return (
    <div
      style={{
        borderRadius: 12,
        border: `1px solid ${p.border}`,
        background: p.bg,
        color: p.color,
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
    borderRadius: 12,
    border: '1px solid #CBD5E1',
    padding: '11px 13px',
    fontSize: 14,
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
    fontFamily: 'inherit',
  };
}
