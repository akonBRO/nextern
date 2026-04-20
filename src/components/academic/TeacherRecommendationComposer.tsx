'use client';
// src/components/academic/TeacherRecommendationComposer.tsx

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type {
  WorkspaceJobRecommendationOption,
  WorkspaceManualRecommendation,
} from '@/lib/opportunity-recommendations';

type Props = {
  studentId: string;
  role: 'advisor' | 'dept_head';
  recommendations: WorkspaceManualRecommendation[];
  jobOptions: WorkspaceJobRecommendationOption[];
};

type FormState = {
  linkedJobId: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  focusSkills: string;
  resourceUrl: string;
  fitScore: string;
};

const initialForm: FormState = {
  linkedJobId: '',
  title: '',
  description: '',
  priority: 'medium',
  focusSkills: '',
  resourceUrl: '',
  fitScore: '',
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

function badgeTone(priority: 'high' | 'medium' | 'low') {
  if (priority === 'high') return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };
  if (priority === 'medium') return { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' };
  return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };
}

function requestStatusTone(status: 'pending' | 'accepted' | 'rejected' | 'hold') {
  if (status === 'accepted') return 'success' as const;
  if (status === 'rejected') return 'warning' as const;
  if (status === 'hold') return 'neutral' as const;
  return 'info' as const;
}

function requestStatusLabel(status: 'pending' | 'accepted' | 'rejected' | 'hold') {
  if (status === 'hold') return 'on hold';
  return status;
}

function formatJobType(type?: string) {
  return type ? type.replace(/-/g, ' ') : 'job';
}

export default function TeacherRecommendationComposer({
  studentId,
  role,
  recommendations,
  jobOptions,
}: Props) {
  const router = useRouter();
  const [form, setForm] = useState<FormState>(initialForm);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [editingRecommendationId, setEditingRecommendationId] = useState<string | null>(null);
  const [deletePendingId, setDeletePendingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [expandedRecommendationIds, setExpandedRecommendationIds] = useState<
    Record<string, boolean>
  >({});

  const linkedJob = useMemo(
    () => jobOptions.find((j) => j.id === form.linkedJobId),
    [form.linkedJobId, jobOptions]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((c) => ({ ...c, [key]: value }));
  }

  function handleJobChange(value: string) {
    const selected = jobOptions.find((j) => j.id === value);
    setForm((c) => ({
      ...c,
      linkedJobId: value,
      title:
        selected && !c.title
          ? `Recommend for ${selected.title} at ${selected.companyName}`
          : c.title,
      fitScore: selected && !c.fitScore ? String(selected.fitScore) : c.fitScore,
    }));
  }

  function resetForm() {
    setForm(initialForm);
    setEditingRecommendationId(null);
  }

  function toggleRecommendationExpanded(id: string) {
    setExpandedRecommendationIds((c) => ({ ...c, [id]: !c[id] }));
  }

  function startEditing(rec: WorkspaceManualRecommendation) {
    setForm({
      linkedJobId: rec.linkedJobId ?? '',
      title: rec.title,
      description: rec.description,
      priority: rec.priority,
      focusSkills: rec.focusSkills.join(', '),
      resourceUrl: rec.resourceUrl ?? '',
      fitScore: typeof rec.fitScore === 'number' ? String(rec.fitScore) : '',
    });
    setEditingRecommendationId(rec.id);
    setConfirmDeleteId(null);
    setMessage(null);
    setError(null);
    setExpandedRecommendationIds((c) => ({ ...c, [rec.id]: true }));
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
      category: 'job',
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      focusSkills: form.focusSkills
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      linkedJobId: form.linkedJobId,
      resourceUrl: form.resourceUrl.trim() || undefined,
      fitScore: form.fitScore ? Number(form.fitScore) : undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch(
          editingRecommendationId
            ? `/api/opportunity-recommendations/${editingRecommendationId}`
            : '/api/opportunity-recommendations',
          {
            method: editingRecommendationId ? 'PATCH' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );
        const data = (await res.json()) as ApiResponse;
        if (!res.ok) {
          setError(getApiErrorMessage(data, 'Failed to save recommendation.'));
          return;
        }
        setMessage(
          data.message ??
            (editingRecommendationId ? 'Recommendation updated.' : 'Recommendation saved.')
        );
        resetForm();
        router.refresh();
      } catch {
        setError(
          editingRecommendationId
            ? 'Network error while updating recommendation.'
            : 'Network error while saving recommendation.'
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
      const res = await fetch(`/api/opportunity-recommendations/${id}`, { method: 'DELETE' });
      const data = (await res.json()) as ApiResponse;
      if (!res.ok) {
        setError(getApiErrorMessage(data, 'Failed to delete recommendation.'));
        return;
      }
      if (editingRecommendationId === id) resetForm();
      setMessage(data.message ?? 'Recommendation deleted.');
      router.refresh();
    } catch {
      setError('Network error while deleting recommendation.');
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
      className="teacher-recommendation-grid"
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
            Job recommendation
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
            {editingRecommendationId
              ? 'Edit a saved job recommendation'
              : 'Recommend the student for a platform job'}
          </h3>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: '#64748B' }}>
            {editingRecommendationId
              ? 'Adjust the saved recommendation details here, then save your changes. Cancel anytime to go back to creating a new recommendation.'
              : 'Choose an internship, part-time, or full-time job from this platform and explain why the student should be prioritized.'}
          </p>
        </div>

        {/* Active-edit banner */}
        {editingRecommendationId && (
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
                Editing an existing recommendation — save to update or cancel to discard.
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
          <Field label="Select job">
            <select
              value={form.linkedJobId}
              onChange={(e) => handleJobChange(e.target.value)}
              required
              style={inputStyle()}
            >
              <option value="">Choose a job from the platform</option>
              {jobOptions.map((job) => (
                <option key={job.id} value={job.id}>
                  {job.title} · {job.companyName} · {formatJobType(job.type)} · {job.fitScore}% fit
                </option>
              ))}
            </select>
          </Field>

          {linkedJob && (
            <div
              style={{
                borderRadius: 14,
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                padding: '13px 15px',
                display: 'grid',
                gap: 8,
              }}
            >
              <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>
                {linkedJob.title}
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <Chip label={linkedJob.companyName} tone="info" />
                <Chip label={formatJobType(linkedJob.type)} tone="neutral" />
                <Chip label={`${linkedJob.fitScore}% fit`} tone="success" />
                {linkedJob.dateLabel && (
                  <Chip label={`Deadline ${linkedJob.dateLabel}`} tone="warning" />
                )}
              </div>
            </div>
          )}

          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: 12 }}
          >
            <Field label="Recommendation title">
              <input
                value={form.title}
                onChange={(e) => update('title', e.target.value)}
                placeholder="Strong fit for the next internship round"
                required
                minLength={3}
                maxLength={160}
                style={inputStyle()}
              />
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(e) => update('priority', e.target.value as FormState['priority'])}
                style={inputStyle()}
              >
                <option value="high">High priority</option>
                <option value="medium">Medium priority</option>
                <option value="low">Low priority</option>
              </select>
            </Field>
          </div>

          <Field label="Reason for recommendation">
            <textarea
              value={form.description}
              onChange={(e) => update('description', e.target.value)}
              placeholder="Explain why this student should be considered, what signals stand out, and what outcome you expect."
              rows={5}
              required
              minLength={12}
              maxLength={2400}
              style={{ ...inputStyle(), resize: 'vertical', minHeight: 136 }}
            />
          </Field>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.15fr) minmax(0, 0.85fr)',
              gap: 12,
            }}
          >
            <Field label="Focus skills">
              <input
                value={form.focusSkills}
                onChange={(e) => update('focusSkills', e.target.value)}
                placeholder="React, Spring Boot, Data Structures"
                style={inputStyle()}
              />
            </Field>
            <Field label="Fit score">
              <input
                type="number"
                min={0}
                max={100}
                value={form.fitScore}
                onChange={(e) => update('fitScore', e.target.value)}
                placeholder={linkedJob ? String(linkedJob.fitScore) : 'Optional'}
                inputMode="numeric"
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="Optional supporting link">
            <input
              value={form.resourceUrl}
              onChange={(e) => update('resourceUrl', e.target.value)}
              placeholder="https://…"
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
              ? 'Use this for department-level talent signaling when a student is ready for a high-value placement.'
              : 'Use this for direct advising support when you want to push a student toward a specific hiring track.'}
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              border: 'none',
              borderRadius: 14,
              padding: '13px 20px',
              background: isPending ? '#BFDBFE' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 800,
              cursor: isPending ? 'wait' : 'pointer',
              alignSelf: 'start',
            }}
          >
            {isPending
              ? editingRecommendationId
                ? 'Updating recommendation…'
                : 'Saving recommendation…'
              : editingRecommendationId
                ? 'Update job recommendation'
                : 'Save job recommendation'}
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
              Saved guidance
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
              Job recommendations history
            </h3>
          </div>
          {recommendations.length > 0 && (
            <Chip label={`${recommendations.length} saved`} tone="info" />
          )}
        </div>

        {recommendations.length === 0 ? (
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
            No saved job recommendations yet. Once you add one, the student will see it in the
            profile feedback area.
          </div>
        ) : (
          <div
            style={{ display: 'grid', gap: 12, maxHeight: 680, overflowY: 'auto', paddingRight: 4 }}
            className="teacher-history-scroll"
          >
            {recommendations.map((item) => {
              const tone = badgeTone(item.priority);
              const isExpanded = Boolean(expandedRecommendationIds[item.id]);
              const isEditing = editingRecommendationId === item.id;
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
                        {item.title}
                      </div>
                      {isExpanded && item.companyName && (
                        <div
                          style={{
                            marginTop: 5,
                            fontSize: 13,
                            color: '#64748B',
                            overflowWrap: 'anywhere',
                          }}
                        >
                          {item.companyName}
                          {item.jobType ? ` · ${formatJobType(item.jobType)}` : ''}
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div
                      style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}
                      className="teacher-history-item-actions"
                    >
                      {/* Edit / Cancel edit */}
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

                      {/* Delete — two-step */}
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

                      {/* Expand / collapse */}
                      <button
                        type="button"
                        onClick={() => toggleRecommendationExpanded(item.id)}
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

                  {/* Confirm-delete warning */}
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
                      This will permanently delete the recommendation. This action cannot be undone.
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
                          {item.priority}
                        </span>
                        <Chip label="job recommendation" tone="info" />
                        <Chip
                          label={requestStatusLabel(item.requestStatus)}
                          tone={requestStatusTone(item.requestStatus)}
                        />
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
                        {item.description}
                      </p>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                        {typeof item.fitScore === 'number' && (
                          <Chip label={`Fit ${item.fitScore}%`} tone="success" />
                        )}
                        {item.focusSkills.map((s) => (
                          <Chip key={`${item.id}:${s}`} label={s} tone="neutral" />
                        ))}
                        {item.resourceUrl && (
                          <a
                            href={item.resourceUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              borderRadius: 999,
                              border: '1px solid #BFDBFE',
                              background: '#EFF6FF',
                              color: '#1D4ED8',
                              padding: '5px 10px',
                              textDecoration: 'none',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            Open resource
                          </a>
                        )}
                      </div>

                      {item.employerResponseNote && (
                        <div
                          style={{
                            marginTop: 12,
                            borderRadius: 12,
                            border: '1px solid #E2E8F0',
                            background: '#F8FAFC',
                            padding: '11px 13px',
                          }}
                        >
                          <div
                            style={{
                              fontSize: 10,
                              fontWeight: 800,
                              color: '#475569',
                              textTransform: 'uppercase',
                              letterSpacing: 0.6,
                              marginBottom: 5,
                            }}
                          >
                            Employer note
                          </div>
                          <div
                            style={{
                              fontSize: 13,
                              lineHeight: 1.7,
                              color: '#475569',
                              overflowWrap: 'anywhere',
                            }}
                          >
                            {item.employerResponseNote}
                          </div>
                        </div>
                      )}

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
          .teacher-recommendation-grid { grid-template-columns: 1fr !important; }
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

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: 'info' | 'success' | 'warning' | 'neutral';
}) {
  const p =
    tone === 'info'
      ? { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' }
      : tone === 'success'
        ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166634' }
        : tone === 'warning'
          ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
          : { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' };
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
