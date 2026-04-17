'use client';

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
  const [archivePendingId, setArchivePendingId] = useState<string | null>(null);

  const linkedJob = useMemo(
    () => jobOptions.find((item) => item.id === form.linkedJobId),
    [form.linkedJobId, jobOptions]
  );

  function update<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [key]: value }));
  }

  function handleJobChange(value: string) {
    const selected = jobOptions.find((item) => item.id === value);
    setForm((current) => ({
      ...current,
      linkedJobId: value,
      title:
        selected && !current.title
          ? `Recommend for ${selected.title} at ${selected.companyName}`
          : current.title,
      fitScore: selected && !current.fitScore ? String(selected.fitScore) : current.fitScore,
    }));
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
      category: 'job',
      title: form.title.trim(),
      description: form.description.trim(),
      priority: form.priority,
      focusSkills: form.focusSkills
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean),
      linkedJobId: form.linkedJobId,
      resourceUrl: form.resourceUrl.trim() || undefined,
      fitScore: form.fitScore ? Number(form.fitScore) : undefined,
    };

    startTransition(async () => {
      try {
        const res = await fetch('/api/opportunity-recommendations', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        const data = (await res.json()) as { error?: string; message?: string };
        if (!res.ok) {
          setError(data.error ?? 'Failed to save recommendation.');
          return;
        }

        setMessage(data.message ?? 'Recommendation saved.');
        resetForm();
        router.refresh();
      } catch {
        setError('Network error while saving recommendation.');
      }
    });
  }

  async function handleArchive(id: string) {
    setArchivePendingId(id);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/opportunity-recommendations/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'archived' }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) {
        setError(data.error ?? 'Failed to archive recommendation.');
        return;
      }

      setMessage(data.message ?? 'Recommendation archived.');
      router.refresh();
    } catch {
      setError('Network error while archiving recommendation.');
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
      className="teacher-recommendation-grid"
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
            Recommend the student for a platform job
          </h3>
          <p style={{ margin: '10px 0 0', fontSize: 14, lineHeight: 1.7, color: '#64748B' }}>
            Choose an internship, part-time, or full-time job from this platform and explain why the
            student should be prioritized. The recommendation is saved in the student guidance
            record and sent directly to the target employer as a recommendation request.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 14 }}>
          <Field label="Select job">
            <select
              value={form.linkedJobId}
              onChange={(event) => handleJobChange(event.target.value)}
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

          {linkedJob ? (
            <div
              style={{
                borderRadius: 18,
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                padding: '14px 16px',
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
                {linkedJob.dateLabel ? (
                  <Chip label={`Deadline ${linkedJob.dateLabel}`} tone="warning" />
                ) : null}
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, minmax(0, 1fr))',
              gap: 12,
            }}
          >
            <Field label="Recommendation title">
              <input
                value={form.title}
                onChange={(event) => update('title', event.target.value)}
                placeholder="Example: Strong fit for the next internship round"
                style={inputStyle()}
              />
            </Field>
            <Field label="Priority">
              <select
                value={form.priority}
                onChange={(event) =>
                  update('priority', event.target.value as FormState['priority'])
                }
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
              onChange={(event) => update('description', event.target.value)}
              placeholder="Explain why this student should be considered, what signals stand out, and what outcome you expect."
              rows={5}
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
                onChange={(event) => update('focusSkills', event.target.value)}
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
                onChange={(event) => update('fitScore', event.target.value)}
                placeholder={linkedJob ? String(linkedJob.fitScore) : 'Optional'}
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="Optional supporting link">
            <input
              value={form.resourceUrl}
              onChange={(event) => update('resourceUrl', event.target.value)}
              placeholder="https://..."
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
              ? 'Use this for department-level talent signaling when a student is ready for a high-value placement.'
              : 'Use this for direct advising support when you want to push a student toward a specific hiring track.'}
          </div>

          <button
            type="submit"
            disabled={isPending}
            style={{
              border: 'none',
              borderRadius: 16,
              padding: '13px 18px',
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              fontSize: 14,
              fontWeight: 800,
              cursor: isPending ? 'wait' : 'pointer',
            }}
          >
            {isPending ? 'Saving recommendation...' : 'Save job recommendation'}
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
            Saved guidance
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
            Job recommendations history
          </h3>
        </div>

        {recommendations.length === 0 ? (
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
            No saved job recommendations yet. Once you add one, the student will see it in the
            profile feedback area.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {recommendations.map((item) => {
              const tone = badgeTone(item.priority);
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
                          {item.priority}
                        </span>
                        <Chip label="job recommendation" tone="info" />
                        <Chip
                          label={requestStatusLabel(item.requestStatus)}
                          tone={requestStatusTone(item.requestStatus)}
                        />
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
                        {item.title}
                      </div>
                      {item.companyName ? (
                        <div style={{ marginTop: 6, fontSize: 13, color: '#64748B' }}>
                          {item.companyName}
                          {item.jobType ? ` · ${formatJobType(item.jobType)}` : ''}
                        </div>
                      ) : null}
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
                    {item.description}
                  </p>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }}>
                    {typeof item.fitScore === 'number' ? (
                      <Chip label={`Fit ${item.fitScore}%`} tone="success" />
                    ) : null}
                    {item.focusSkills.map((skill) => (
                      <Chip key={`${item.id}:${skill}`} label={skill} tone="neutral" />
                    ))}
                    {item.resourceUrl ? (
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
                          padding: '6px 10px',
                          textDecoration: 'none',
                          fontSize: 12,
                          fontWeight: 700,
                        }}
                      >
                        Open resource
                      </a>
                    ) : null}
                  </div>

                  {item.employerResponseNote ? (
                    <div
                      style={{
                        marginTop: 12,
                        borderRadius: 14,
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        padding: '12px 13px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: 0.6,
                        }}
                      >
                        Employer note
                      </div>
                      <div
                        style={{ marginTop: 6, fontSize: 13, lineHeight: 1.7, color: '#475569' }}
                      >
                        {item.employerResponseNote}
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .teacher-recommendation-grid {
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

function Chip({
  label,
  tone,
}: {
  label: string;
  tone: 'info' | 'success' | 'warning' | 'neutral';
}) {
  const palette =
    tone === 'info'
      ? { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' }
      : tone === 'success'
        ? { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' }
        : tone === 'warning'
          ? { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' }
          : { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' };

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
