'use client';
// src/components/employer/EmployerRecommendationRequestsClient.tsx

import { useMemo, useState, useTransition, type ComponentType } from 'react';
import { useRouter } from 'next/navigation';
import { CheckCircle2, Mail, PauseCircle, SendToBack, ShieldCheck, XCircle } from 'lucide-react';
import type { EmployerRecommendationRequestItem } from '@/lib/employer-recommendation-requests';

type Props = {
  requests: EmployerRecommendationRequestItem[];
  compact?: boolean;
};

type StatusKey = 'pending' | 'accepted' | 'rejected' | 'hold';

function statusTone(status: StatusKey) {
  if (status === 'accepted') return { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' };
  if (status === 'rejected') return { bg: '#FEF2F2', border: '#FECACA', color: '#B91C1C' };
  if (status === 'hold') return { bg: '#FFF7ED', border: '#FED7AA', color: '#9A3412' };
  return { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' };
}

function formatStatus(status: StatusKey) {
  return status === 'hold' ? 'On hold' : status.charAt(0).toUpperCase() + status.slice(1);
}

function timeLabel(value?: string) {
  if (!value) return null;
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(value));
}

function StatPill({
  label,
  value,
  Icon,
  accent,
}: {
  label: string;
  value: number;
  Icon: ComponentType<{ size?: number }>;
  accent: string;
}) {
  return (
    <div
      style={{
        borderRadius: 18,
        border: '1px solid #E2E8F0',
        background: '#FFFFFF',
        padding: '14px 16px',
        display: 'grid',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 38,
          height: 38,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: `${accent}18`,
          color: accent,
        }}
      >
        <Icon size={18} />
      </div>
      <div style={{ fontSize: 30, fontWeight: 900, color: '#0F172A', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 13, fontWeight: 700, color: '#334155' }}>{label}</div>
    </div>
  );
}

export default function EmployerRecommendationRequestsClient({ requests, compact = false }: Props) {
  const router = useRouter();
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [responseNote, setResponseNote] = useState<Record<string, string>>({});
  const [, startTransition] = useTransition();

  const summary = useMemo(
    () =>
      requests.reduce(
        (acc, request) => {
          acc.total += 1;
          acc[request.requestStatus] += 1;
          return acc;
        },
        { total: 0, pending: 0, accepted: 0, rejected: 0, hold: 0 }
      ),
    [requests]
  );

  async function handleAction(id: string, requestStatus: Exclude<StatusKey, 'pending'>) {
    setPendingId(id);
    setActionError(null);

    try {
      const res = await fetch(`/api/employer/recommendation-requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          requestStatus,
          employerResponseNote: responseNote[id]?.trim() || undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setActionError(data.error ?? 'Failed to update request.');
        return;
      }
      startTransition(() => {
        router.refresh();
      });
    } catch {
      setActionError('Network error while updating the request.');
    } finally {
      setPendingId(null);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      {/* ── Stats row ── */}
      {!compact && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, minmax(0, 1fr))',
            gap: 16,
          }}
          className="employer-recommendation-stats"
        >
          <StatPill label="Pending" value={summary.pending} Icon={SendToBack} accent="#2563EB" />
          <StatPill
            label="Accepted"
            value={summary.accepted}
            Icon={CheckCircle2}
            accent="#16A34A"
          />
          <StatPill label="On Hold" value={summary.hold} Icon={PauseCircle} accent="#EA580C" />
          <StatPill label="Rejected" value={summary.rejected} Icon={XCircle} accent="#DC2626" />
        </div>
      )}

      {/* ── Error banner ── */}
      {actionError && (
        <div
          style={{
            borderRadius: 16,
            border: '1px solid #FECACA',
            background: '#FEF2F2',
            color: '#B91C1C',
            padding: '12px 14px',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {actionError}
        </div>
      )}

      {/* ── Empty state ── */}
      {requests.length === 0 ? (
        <div
          style={{
            borderRadius: 22,
            border: '1px dashed #CBD5E1',
            background: '#F8FAFC',
            padding: '32px 24px',
            textAlign: 'center',
          }}
        >
          <div
            style={{
              width: 58,
              height: 58,
              borderRadius: 18,
              background: '#EFF6FF',
              color: '#2563EB',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 14px',
            }}
          >
            <ShieldCheck size={24} />
          </div>
          <div style={{ fontSize: 18, fontWeight: 900, color: '#0F172A' }}>
            No recommendation requests yet
          </div>
          <div style={{ marginTop: 8, fontSize: 14, lineHeight: 1.7, color: '#64748B' }}>
            Advisor and department-head recommendations for your jobs will appear here as they
            arrive.
          </div>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 16 }}>
          {requests.map((request) => {
            const tone = statusTone(request.requestStatus);
            const isBusy = pendingId === request.id;

            return (
              <div
                key={request.id}
                style={{
                  borderRadius: 24,
                  border: '1px solid #D9E2EC',
                  background: '#FFFFFF',
                  boxShadow: '0 18px 34px rgba(15,23,42,0.06)',
                  padding: '20px 22px',
                  display: 'grid',
                  gap: 16,
                }}
              >
                {/* ── Top bar: status + title + meta ── */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 16,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'grid', gap: 10 }}>
                    {/* Badges */}
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      <span
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          borderRadius: 999,
                          border: `1px solid ${tone.border}`,
                          background: tone.bg,
                          color: tone.color,
                          padding: '6px 11px',
                          fontSize: 11,
                          fontWeight: 800,
                          textTransform: 'uppercase',
                        }}
                      >
                        {formatStatus(request.requestStatus)}
                      </span>
                      <MiniTag label={request.priority} tone="warning" />
                      {typeof request.fitScore === 'number' && (
                        <MiniTag label={`${request.fitScore}% fit`} tone="success" />
                      )}
                    </div>

                    {/* Title */}
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {request.student.name} for {request.job?.title ?? request.title}
                    </div>

                    {/* Recommender line */}
                    <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                      Requested by {request.recommender.name}
                      {request.recommender.designation
                        ? ` · ${request.recommender.designation}`
                        : ''}
                      {request.recommender.institutionName
                        ? ` · ${request.recommender.institutionName}`
                        : ''}
                    </div>
                  </div>

                  {/* Right meta column */}
                  <div style={{ minWidth: 240, display: 'grid', gap: 8 }}>
                    <MetaLine
                      label="Student scope"
                      value={
                        [request.student.university, request.student.department]
                          .filter(Boolean)
                          .join(' · ') || 'Academic profile available'
                      }
                    />
                    <MetaLine
                      label="Readiness"
                      value={
                        typeof request.student.opportunityScore === 'number'
                          ? `${request.student.opportunityScore}% opportunity score`
                          : 'Opportunity score pending'
                      }
                    />
                    <MetaLine
                      label="Requested"
                      value={timeLabel(request.createdAt) ?? 'Recently'}
                    />
                  </div>
                </div>

                {/* ── Student contact strip ── */}
                {request.student.email && (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: 10,
                      borderRadius: 14,
                      border: '1px solid #BFDBFE',
                      background: '#EFF6FF',
                      padding: '11px 14px',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      {/* Avatar initials */}
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: '50%',
                          background: '#2563EB',
                          color: '#FFFFFF',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 12,
                          fontWeight: 800,
                          flexShrink: 0,
                        }}
                      >
                        {request.student.name
                          .split(' ')
                          .slice(0, 2)
                          .map((n) => n[0])
                          .join('')
                          .toUpperCase()}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E40AF' }}>
                          {request.student.name}
                        </div>
                        <div style={{ fontSize: 12, color: '#3B82F6' }}>
                          {[request.student.university, request.student.department]
                            .filter(Boolean)
                            .join(' · ') || 'Student'}
                        </div>
                      </div>
                    </div>

                    <a
                      href={`mailto:${request.student.email}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        borderRadius: 10,
                        border: '1px solid #93C5FD',
                        background: '#FFFFFF',
                        color: '#1D4ED8',
                        padding: '8px 14px',
                        fontSize: 13,
                        fontWeight: 700,
                        textDecoration: 'none',
                        flexShrink: 0,
                        transition: 'background 0.15s',
                      }}
                    >
                      <Mail size={13} />
                      {request.student.email}
                    </a>
                  </div>
                )}

                {/* ── Detail grid: description + decision panel ── */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: compact ? '1fr' : 'minmax(0, 1fr) minmax(280px, 0.8fr)',
                    gap: 16,
                  }}
                  className="employer-recommendation-detail-grid"
                >
                  {/* Left — recommendation body */}
                  <div style={{ display: 'grid', gap: 14 }}>
                    <div
                      style={{
                        borderRadius: 18,
                        border: '1px solid #E2E8F0',
                        background: '#F8FAFC',
                        padding: '14px 16px',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: '#475569',
                          textTransform: 'uppercase',
                          letterSpacing: 0.7,
                        }}
                      >
                        Recommendation reason
                      </div>
                      <div
                        style={{ marginTop: 8, fontSize: 14, lineHeight: 1.8, color: '#334155' }}
                      >
                        {request.description}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {request.focusSkills.length > 0 ? (
                        request.focusSkills.map((skill) => (
                          <MiniTag key={`${request.id}:${skill}`} label={skill} tone="neutral" />
                        ))
                      ) : (
                        <MiniTag label="No explicit focus skills attached" tone="neutral" />
                      )}
                    </div>
                  </div>

                  {/* Right — decision panel */}
                  <div
                    style={{
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#FFFFFF',
                      padding: '16px',
                      display: 'grid',
                      gap: 12,
                    }}
                  >
                    <div style={{ fontSize: 13, fontWeight: 800, color: '#0F172A' }}>
                      Employer decision
                    </div>
                    <textarea
                      value={responseNote[request.id] ?? request.employerResponseNote ?? ''}
                      onChange={(e) =>
                        setResponseNote((curr) => ({ ...curr, [request.id]: e.target.value }))
                      }
                      rows={4}
                      placeholder="Optional note for the advisor or department head"
                      style={{
                        width: '100%',
                        boxSizing: 'border-box',
                        borderRadius: 14,
                        border: '1px solid #CBD5E1',
                        padding: '12px 13px',
                        resize: 'vertical',
                        fontSize: 13,
                        color: '#0F172A',
                        background: '#FFFFFF',
                        fontFamily: 'inherit',
                      }}
                    />

                    <div
                      style={{
                        display: 'grid',
                        gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
                        gap: 10,
                      }}
                    >
                      <ActionButton
                        label="Accept"
                        accent="#16A34A"
                        disabled={isBusy}
                        onClick={() => handleAction(request.id, 'accepted')}
                      />
                      <ActionButton
                        label="Hold"
                        accent="#EA580C"
                        disabled={isBusy}
                        onClick={() => handleAction(request.id, 'hold')}
                      />
                      <ActionButton
                        label="Reject"
                        accent="#DC2626"
                        disabled={isBusy}
                        onClick={() => handleAction(request.id, 'rejected')}
                      />
                    </div>

                    {request.respondedAt ? (
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Last updated {timeLabel(request.respondedAt)}
                      </div>
                    ) : (
                      <div style={{ fontSize: 12, color: '#64748B' }}>
                        Use one of the actions above to update the academic team.
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <style>{`
        @media (max-width: 980px) {
          .employer-recommendation-stats,
          .employer-recommendation-detail-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function ActionButton({
  label,
  accent,
  disabled,
  onClick,
}: {
  label: string;
  accent: string;
  disabled?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      style={{
        borderRadius: 12,
        border: `1px solid ${accent}30`,
        background: `${accent}14`,
        color: accent,
        padding: '11px 12px',
        fontSize: 13,
        fontWeight: 800,
        cursor: disabled ? 'wait' : 'pointer',
      }}
    >
      {disabled ? 'Saving…' : label}
    </button>
  );
}

function MetaLine({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        borderRadius: 14,
        border: '1px solid #E2E8F0',
        background: '#F8FAFC',
        padding: '10px 12px',
      }}
    >
      <span style={{ fontSize: 12, color: '#64748B', fontWeight: 700 }}>{label}</span>
      <span style={{ fontSize: 13, color: '#0F172A', fontWeight: 800, textAlign: 'right' }}>
        {value}
      </span>
    </div>
  );
}

function MiniTag({ label, tone }: { label: string; tone: 'neutral' | 'success' | 'warning' }) {
  const palette =
    tone === 'success'
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
