'use client';
// src/app/employer/jobs/[jobId]/applicants/ApplicantActions.tsx

import { useState } from 'react';

const STATUSES = [
  { value: 'applied', label: 'Applied' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'assessment_sent', label: 'Assessment Sent' },
  { value: 'interview_scheduled', label: 'Interview Scheduled' },
  { value: 'hired', label: 'Hired' },
  { value: 'rejected', label: 'Not Selected' },
];

const STATUS_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  applied: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  under_review: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  shortlisted: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  assessment_sent: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  interview_scheduled: { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  hired: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  rejected: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA' },
};

export default function ApplicantActions({
  appId,
  currentStatus,
  resumeUrl,
  generatedResumeUrl,
}: {
  appId: string;
  currentStatus: string;
  resumeUrl?: string;
  generatedResumeUrl?: string;
}) {
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const cfg = STATUS_COLORS[status] ?? STATUS_COLORS['applied'];
  const hasAnyResume = resumeUrl || generatedResumeUrl;

  async function handleChange(newStatus: string) {
    setSaving(true);
    setSaved(false);
    const res = await fetch(`/api/applications?id=${appId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) {
      setStatus(newStatus);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
    setSaving(false);
  }

  return (
    <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8, minWidth: 165 }}>
      {/* ── Resume links ── */}
      {hasAnyResume && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
          {/* Uploaded resume (actual) */}
          {resumeUrl && (
            <a
              href={resumeUrl}
              target="_blank"
              rel="noreferrer"
              title="Student's own uploaded resume"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                border: '1.5px solid #A7F3D0',
                borderRadius: 8,
                color: '#065F46',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                background: '#ECFDF5',
              }}
            >
              📄
              <span style={{ flex: 1 }}>Resume</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#10B981',
                  background: '#D1FAE5',
                  border: '1px solid #A7F3D0',
                  padding: '1px 6px',
                  borderRadius: 999,
                }}
              >
                PDF
              </span>
            </a>
          )}

          {/* Nextern-generated in-platform resume */}
          {generatedResumeUrl && (
            <a
              href={generatedResumeUrl}
              target="_blank"
              rel="noreferrer"
              title="Nextern auto-generated resume"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                padding: '7px 12px',
                border: '1.5px solid #BFDBFE',
                borderRadius: 8,
                color: '#1D4ED8',
                fontSize: 12,
                fontWeight: 600,
                textDecoration: 'none',
                background: '#EFF6FF',
              }}
            >
              ⚡<span style={{ flex: 1 }}>In-Platform Resume</span>
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#2563EB',
                  background: '#DBEAFE',
                  border: '1px solid #BFDBFE',
                  padding: '1px 6px',
                  borderRadius: 999,
                }}
              >
                PDF
              </span>
            </a>
          )}
        </div>
      )}

      {/* ── Status dropdown ── */}
      <select
        value={status}
        disabled={saving}
        onChange={(e) => handleChange(e.target.value)}
        style={{
          padding: '8px 10px',
          border: `1.5px solid ${cfg.border}`,
          borderRadius: 8,
          fontSize: 12,
          fontWeight: 600,
          color: cfg.color,
          background: cfg.bg,
          cursor: saving ? 'not-allowed' : 'pointer',
          outline: 'none',
        }}
      >
        {STATUSES.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>

      {saved && (
        <div style={{ fontSize: 11, color: '#10B981', fontWeight: 700, textAlign: 'center' }}>
          ✓ Saved
        </div>
      )}
      {saving && <div style={{ fontSize: 11, color: '#64748B', textAlign: 'center' }}>Saving…</div>}
    </div>
  );
}
