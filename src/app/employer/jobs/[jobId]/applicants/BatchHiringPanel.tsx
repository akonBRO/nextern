'use client';
// src/app/employer/jobs/[jobId]/applicants/BatchHiringPanel.tsx
// Interactive batch hiring analytics — university filter tabs, expandable pipeline,
// batch status actions, university comparison, and applicant list

import { useState, useMemo } from 'react';
import Link from 'next/link';
import ApplicantActions from './ApplicantActions';
import {
  ChevronDown,
  ChevronUp,
  Users,
  Target,
  CheckCircle2,
  Trophy,
  BarChart3,
  Filter,
  Zap,
  Eye,
} from 'lucide-react';

// ── Types ──────────────────────────────────────────────────────────────────
type StudentData = {
  _id: string;
  name: string;
  email: string;
  university: string;
  department: string;
  cgpa?: number;
  skills: string[];
  yearOfStudy?: number;
};

type AppData = {
  _id: string;
  status: string;
  fitScore: number;
  appliedAt: string;
  resumeUrlSnapshot: string;
  generatedResumeUrlSnapshot: string;
  student: StudentData;
};

type UniversityStat = {
  university: string;
  total: number;
  shortlisted: number;
  hired: number;
  avgFit: number;
  pipeline: Record<string, number>;
};

type Props = {
  jobId: string;
  isBatchHiring: boolean;
  batchUniversities: string[];
  applications: AppData[];
  universityStats: UniversityStat[];
  totalApplications: number;
};

// ── Constants ──────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { bg: string; color: string; border: string; label: string }> = {
  applied: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE', label: 'Applied' },
  under_review: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A', label: 'Under Review' },
  shortlisted: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0', label: 'Shortlisted' },
  assessment_sent: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD', label: 'Assessment Sent' },
  interview_scheduled: { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE', label: 'Interview' },
  hired: { bg: '#DCFCE7', color: '#065F46', border: '#BBF7D0', label: 'Hired' },
  rejected: { bg: '#FEF2F2', color: '#991B1B', border: '#FECACA', label: 'Not Selected' },
};

const PIPELINE_ORDER = [
  'applied',
  'under_review',
  'shortlisted',
  'assessment_sent',
  'interview_scheduled',
  'hired',
  'rejected',
];

// ── University row with expandable pipeline ────────────────────────────────
function UniversityRow({
  stat,
  total,
  rank,
}: {
  stat: UniversityStat;
  total: number;
  rank: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const pct = total > 0 ? Math.round((stat.total / total) * 100) : 0;
  const fitColor = stat.avgFit >= 70 ? '#10B981' : stat.avgFit >= 40 ? '#F59E0B' : '#94A3B8';

  const rankColors = ['#F59E0B', '#94A3B8', '#CD7C2F'];
  const rankColor = rank < 3 ? rankColors[rank] : '#E2E8F0';
  const rankTextColor = rank < 3 ? '#fff' : '#94A3B8';

  return (
    <div
      style={{
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        background: '#fff',
      }}
    >
      {/* Main row */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '44px 1fr 90px 100px 80px 90px 100px',
          gap: 12,
          padding: '16px 18px',
          alignItems: 'center',
          cursor: 'pointer',
        }}
        onClick={() => setExpanded((p) => !p)}
      >
        {/* Rank */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 10,
            background: rankColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 13,
            fontWeight: 900,
            color: rankTextColor,
          }}
        >
          {rank + 1}
        </div>

        {/* University + bar */}
        <div>
          <div style={{ fontSize: 14, fontWeight: 700, color: '#0F172A', marginBottom: 5 }}>
            {stat.university}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <div
              style={{
                flex: 1,
                height: 5,
                background: '#F1F5F9',
                borderRadius: 999,
                overflow: 'hidden',
                maxWidth: 180,
              }}
            >
              <div
                style={{
                  width: `${pct}%`,
                  height: '100%',
                  background: 'linear-gradient(90deg, #2563EB, #22D3EE)',
                  borderRadius: 999,
                }}
              />
            </div>
            <span style={{ fontSize: 11, color: '#94A3B8', fontWeight: 600 }}>{pct}% of total</span>
          </div>
        </div>

        {/* Total */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#2563EB',
            fontFamily: 'var(--font-display)',
            textAlign: 'center',
          }}
        >
          {stat.total}
        </div>

        {/* Shortlisted */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#22D3EE',
            fontFamily: 'var(--font-display)',
            textAlign: 'center',
          }}
        >
          {stat.shortlisted}
        </div>

        {/* Hired */}
        <div
          style={{
            fontSize: 22,
            fontWeight: 900,
            color: '#10B981',
            fontFamily: 'var(--font-display)',
            textAlign: 'center',
          }}
        >
          {stat.hired}
        </div>

        {/* Avg fit */}
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              fontSize: 20,
              fontWeight: 900,
              color: fitColor,
              fontFamily: 'var(--font-display)',
            }}
          >
            {stat.avgFit > 0 ? `${stat.avgFit}%` : '—'}
          </div>
          {stat.avgFit > 0 && (
            <div
              style={{
                height: 4,
                background: '#F1F5F9',
                borderRadius: 999,
                overflow: 'hidden',
                marginTop: 4,
              }}
            >
              <div
                style={{
                  width: `${stat.avgFit}%`,
                  height: '100%',
                  background: fitColor,
                  borderRadius: 999,
                }}
              />
            </div>
          )}
        </div>

        {/* Expand toggle */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setExpanded((p) => !p);
            }}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
              background: '#F8FAFC',
              color: '#64748B',
              border: '1px solid #E2E8F0',
              borderRadius: 8,
              padding: '5px 10px',
              fontSize: 11,
              fontWeight: 600,
              cursor: 'pointer',
            }}
          >
            {expanded ? (
              <>
                <ChevronUp size={12} /> Hide
              </>
            ) : (
              <>
                <ChevronDown size={12} /> Pipeline
              </>
            )}
          </button>
        </div>
      </div>

      {/* Expanded pipeline breakdown */}
      {expanded && (
        <div
          style={{ borderTop: '1px solid #F1F5F9', padding: '16px 18px', background: '#FAFBFC' }}
        >
          <div
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: '#64748B',
              textTransform: 'uppercase',
              letterSpacing: 0.8,
              marginBottom: 12,
            }}
          >
            Pipeline breakdown for {stat.university}
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {PIPELINE_ORDER.map((key) => {
              const count = stat.pipeline[key] ?? 0;
              if (count === 0) return null;
              const cfg = STATUS_CFG[key];
              const pct = stat.total > 0 ? Math.round((count / stat.total) * 100) : 0;
              return (
                <div key={key}>
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        background: cfg.bg,
                        color: cfg.color,
                        border: `1px solid ${cfg.border}`,
                        padding: '2px 9px',
                        borderRadius: 999,
                        fontSize: 11,
                        fontWeight: 700,
                      }}
                    >
                      {cfg.label}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ fontSize: 12, color: '#94A3B8' }}>{pct}%</span>
                      <span
                        style={{
                          fontSize: 16,
                          fontWeight: 900,
                          color: cfg.color,
                          fontFamily: 'var(--font-display)',
                          minWidth: 24,
                          textAlign: 'right',
                        }}
                      >
                        {count}
                      </span>
                    </div>
                  </div>
                  <div
                    style={{
                      height: 6,
                      background: '#F1F5F9',
                      borderRadius: 999,
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${pct}%`,
                        height: '100%',
                        background: cfg.color,
                        borderRadius: 999,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ── Applicant card ─────────────────────────────────────────────────────────
function ApplicantCard({
  app,
  jobId,
  selected,
  onSelect,
}: {
  app: AppData;
  jobId: string;
  selected: boolean;
  onSelect: (id: string) => void;
}) {
  const fitScore = app.fitScore ?? 0;
  const fitColor = fitScore >= 70 ? '#10B981' : fitScore >= 40 ? '#F59E0B' : '#EF4444';
  const statusCfg = STATUS_CFG[app.status] ?? STATUS_CFG['applied'];
  const initials = app.student.name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: `2px solid ${selected ? '#2563EB' : '#E2E8F0'}`,
        padding: '16px 18px',
        display: 'flex',
        alignItems: 'flex-start',
        gap: 14,
        transition: 'border-color 0.15s',
        boxShadow: selected ? '0 0 0 3px rgba(37,99,235,0.1)' : '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      {/* Checkbox */}
      <div
        onClick={() => onSelect(app._id)}
        style={{
          width: 18,
          height: 18,
          borderRadius: 5,
          border: `2px solid ${selected ? '#2563EB' : '#CBD5E1'}`,
          background: selected ? '#2563EB' : '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          flexShrink: 0,
          marginTop: 2,
          transition: 'all 0.15s',
        }}
      >
        {selected && <div style={{ width: 8, height: 8, borderRadius: 2, background: '#fff' }} />}
      </div>

      {/* Avatar */}
      <div
        style={{
          width: 42,
          height: 42,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontSize: 14,
          fontWeight: 800,
          flexShrink: 0,
        }}
      >
        {initials}
      </div>

      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
            marginBottom: 3,
          }}
        >
          <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A' }}>{app.student.name}</div>
          <span
            style={{
              background: statusCfg.bg,
              color: statusCfg.color,
              border: `1px solid ${statusCfg.border}`,
              padding: '2px 8px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 700,
            }}
          >
            {statusCfg.label}
          </span>
        </div>
        <div style={{ fontSize: 13, color: '#64748B', marginBottom: 6 }}>
          {[app.student.university, app.student.department].filter(Boolean).join(' · ')}
          {app.student.yearOfStudy && ` · Year ${app.student.yearOfStudy}`}
          {typeof app.student.cgpa === 'number' && (
            <span style={{ color: '#10B981', fontWeight: 600 }}>
              {' '}
              · CGPA {app.student.cgpa.toFixed(2)}
            </span>
          )}
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5 }}>
          {app.student.skills.slice(0, 4).map((s) => (
            <span
              key={s}
              style={{
                background: '#F1F5F9',
                color: '#475569',
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 600,
              }}
            >
              {s}
            </span>
          ))}
        </div>
        <div style={{ fontSize: 11, color: '#94A3B8', marginTop: 6 }}>
          Applied{' '}
          {app.appliedAt
            ? new Date(app.appliedAt).toLocaleDateString('en-BD', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : '—'}
        </div>
      </div>

      {/* Fit score ring */}
      <div style={{ textAlign: 'center', flexShrink: 0 }}>
        <div style={{ position: 'relative', width: 52, height: 52 }}>
          <svg width="52" height="52" viewBox="0 0 52 52">
            <circle cx="26" cy="26" r="20" fill="none" stroke="#F1F5F9" strokeWidth="4.5" />
            <circle
              cx="26"
              cy="26"
              r="20"
              fill="none"
              stroke={fitScore > 0 ? fitColor : '#E2E8F0'}
              strokeWidth="4.5"
              strokeDasharray={`${2 * Math.PI * 20}`}
              strokeDashoffset={`${2 * Math.PI * 20 * (1 - fitScore / 100)}`}
              strokeLinecap="round"
              transform="rotate(-90 26 26)"
            />
          </svg>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 900,
              color: fitScore > 0 ? fitColor : '#94A3B8',
              fontFamily: 'var(--font-display)',
            }}
          >
            {fitScore > 0 ? `${fitScore}%` : '—'}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#94A3B8', fontWeight: 600, marginTop: 2 }}>fit</div>
      </div>

      {/* Actions */}
      <div style={{ flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 8 }}>
        <Link
          href={`/employer/jobs/${jobId}/applicants/${app.student._id}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 5,
            background: '#0F172A',
            color: '#fff',
            padding: '7px 13px',
            borderRadius: 9,
            fontSize: 11,
            fontWeight: 700,
            textDecoration: 'none',
          }}
        >
          <Eye size={11} /> View
        </Link>
        <ApplicantActions
          appId={app._id}
          currentStatus={app.status}
          resumeUrl={app.resumeUrlSnapshot || undefined}
          generatedResumeUrl={app.generatedResumeUrlSnapshot}
        />
      </div>
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────────────────
export default function BatchHiringPanel({
  jobId,
  isBatchHiring,
  batchUniversities,
  applications,
  universityStats,
  totalApplications,
}: Props) {
  const [activeTab, setActiveTab] = useState('all');
  const [selectedApps, setSelectedApps] = useState<Set<string>>(new Set());
  const [batchStatus, setBatchStatus] = useState('');
  const [batchSaving, setBatchSaving] = useState(false);
  const [batchSaved, setBatchSaved] = useState(false);
  const [expandedUniPanel, setExpandedUniPanel] = useState(true);

  // Filter applications by selected university tab
  const filteredApps = useMemo(() => {
    if (activeTab === 'all') return applications;
    return applications.filter((a) => a.student.university === activeTab);
  }, [activeTab, applications]);

  // Unique universities from actual applicants
  const universities = useMemo(() => {
    const unis = [...new Set(applications.map((a) => a.student.university).filter(Boolean))];
    return unis.sort();
  }, [applications]);

  function toggleSelect(id: string) {
    setSelectedApps((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function toggleSelectAll() {
    if (selectedApps.size === filteredApps.length) {
      setSelectedApps(new Set());
    } else {
      setSelectedApps(new Set(filteredApps.map((a) => a._id)));
    }
  }

  async function handleBatchAction() {
    if (!batchStatus || selectedApps.size === 0) return;
    setBatchSaving(true);
    setBatchSaved(false);
    try {
      await Promise.all(
        [...selectedApps].map((id) =>
          fetch(`/api/applications?id=${id}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status: batchStatus }),
          })
        )
      );
      setBatchSaved(true);
      setSelectedApps(new Set());
      setTimeout(() => setBatchSaved(false), 3000);
      window.location.reload();
    } catch {
      /* silent */
    } finally {
      setBatchSaving(false);
    }
  }

  const allSelected = filteredApps.length > 0 && selectedApps.size === filteredApps.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, marginTop: 8 }}>
      {/* ── University analytics panel ── */}
      {(isBatchHiring || universityStats.length > 0) && (
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            overflow: 'hidden',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
          }}
        >
          {/* Panel header */}
          <div
            style={{
              padding: '20px 24px',
              borderBottom: expandedUniPanel ? '1px solid #F1F5F9' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setExpandedUniPanel((p) => !p)}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <BarChart3 size={16} color="#fff" />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {isBatchHiring ? 'Batch Hiring Analytics' : 'University Breakdown'}
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  {universityStats.length}{' '}
                  {universityStats.length === 1 ? 'university' : 'universities'} · Click a row to
                  expand pipeline
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              {isBatchHiring && (
                <span
                  style={{
                    background: '#EDE9FE',
                    color: '#7C3AED',
                    border: '1px solid #DDD6FE',
                    padding: '3px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Batch Hiring
                </span>
              )}
              <button
                type="button"
                style={{
                  background: '#F8FAFC',
                  color: '#64748B',
                  border: '1px solid #E2E8F0',
                  borderRadius: 8,
                  padding: '5px 10px',
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                {expandedUniPanel ? (
                  <>
                    <ChevronUp size={12} /> Collapse
                  </>
                ) : (
                  <>
                    <ChevronDown size={12} /> Expand
                  </>
                )}
              </button>
            </div>
          </div>

          {expandedUniPanel && universityStats.length > 0 && (
            <div style={{ padding: '0 24px 20px' }}>
              {/* Column headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '44px 1fr 90px 100px 80px 90px 100px',
                  gap: 12,
                  padding: '12px 18px 8px',
                }}
              >
                {['#', 'University', 'Total', 'Shortlisted', 'Hired', 'Avg Fit', ''].map((h, i) => (
                  <div
                    key={i}
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: '#94A3B8',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      textAlign: i >= 2 ? 'center' : 'left',
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {universityStats.map((stat, i) => (
                  <UniversityRow
                    key={stat.university}
                    stat={stat}
                    total={totalApplications}
                    rank={i}
                  />
                ))}
              </div>

              {/* Totals footer */}
              <div
                style={{
                  marginTop: 12,
                  background: '#0F172A',
                  borderRadius: 14,
                  padding: '14px 18px',
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <div style={{ flex: 1, fontSize: 13, fontWeight: 700, color: '#94A3B8' }}>
                  Totals across all universities
                </div>
                <div style={{ display: 'flex', gap: 32 }}>
                  {[
                    { label: 'Applied', value: totalApplications, color: '#2563EB' },
                    {
                      label: 'Shortlisted',
                      value: universityStats.reduce((s, u) => s + u.shortlisted, 0),
                      color: '#22D3EE',
                    },
                    {
                      label: 'Hired',
                      value: universityStats.reduce((s, u) => s + u.hired, 0),
                      color: '#10B981',
                    },
                  ].map((s) => (
                    <div key={s.label} style={{ textAlign: 'center' }}>
                      <div
                        style={{
                          fontSize: 20,
                          fontWeight: 900,
                          color: s.color,
                          fontFamily: 'var(--font-display)',
                          lineHeight: 1,
                        }}
                      >
                        {s.value}
                      </div>
                      <div
                        style={{ fontSize: 10, color: '#64748B', marginTop: 3, fontWeight: 600 }}
                      >
                        {s.label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Avg fit comparison bar chart */}
              {universityStats.some((u) => u.avgFit > 0) && (
                <div
                  style={{
                    marginTop: 16,
                    background: '#F8FAFC',
                    borderRadius: 14,
                    border: '1px solid #E2E8F0',
                    padding: '16px 18px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: '#64748B',
                      textTransform: 'uppercase',
                      letterSpacing: 0.8,
                      marginBottom: 12,
                    }}
                  >
                    Average fit score comparison
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {[...universityStats]
                      .sort((a, b) => b.avgFit - a.avgFit)
                      .map((u) => {
                        const color =
                          u.avgFit >= 70 ? '#10B981' : u.avgFit >= 40 ? '#F59E0B' : '#94A3B8';
                        return (
                          <div
                            key={u.university}
                            style={{ display: 'flex', alignItems: 'center', gap: 10 }}
                          >
                            <div
                              style={{
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#475569',
                                minWidth: 160,
                                maxWidth: 160,
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {u.university}
                            </div>
                            <div
                              style={{
                                flex: 1,
                                height: 8,
                                background: '#E2E8F0',
                                borderRadius: 999,
                                overflow: 'hidden',
                              }}
                            >
                              <div
                                style={{
                                  width: `${u.avgFit}%`,
                                  height: '100%',
                                  background: color,
                                  borderRadius: 999,
                                  transition: 'width 0.4s ease',
                                }}
                              />
                            </div>
                            <div
                              style={{
                                fontSize: 13,
                                fontWeight: 800,
                                color,
                                minWidth: 36,
                                textAlign: 'right',
                              }}
                            >
                              {u.avgFit > 0 ? `${u.avgFit}%` : '—'}
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── Applicant list section ── */}
      <div
        style={{
          background: '#fff',
          borderRadius: 20,
          border: '1px solid #E2E8F0',
          overflow: 'hidden',
          boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F1F5F9' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              flexWrap: 'wrap',
              marginBottom: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  background: '#EFF6FF',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#2563EB',
                }}
              >
                <Users size={16} />
              </div>
              <div>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 800,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  All Applicants
                </div>
                <div style={{ fontSize: 12, color: '#64748B', marginTop: 1 }}>
                  {filteredApps.length} {activeTab !== 'all' ? `from ${activeTab}` : 'total'}
                </div>
              </div>
            </div>
            <span
              style={{
                background: '#EFF6FF',
                color: '#2563EB',
                border: '1px solid #BFDBFE',
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              {filteredApps.length} total
            </span>
          </div>

          {/* University filter tabs */}
          {universities.length > 1 && (
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                { key: 'all', label: `All (${applications.length})` },
                ...universities.map((u) => ({
                  key: u,
                  label: `${u.split(' ')[0]} (${applications.filter((a) => a.student.university === u).length})`,
                })),
              ].map((tab) => (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => {
                    setActiveTab(tab.key);
                    setSelectedApps(new Set());
                  }}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 600,
                    border: `1.5px solid ${activeTab === tab.key ? '#2563EB' : '#E2E8F0'}`,
                    background: activeTab === tab.key ? '#EFF6FF' : '#F8FAFC',
                    color: activeTab === tab.key ? '#2563EB' : '#64748B',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Batch action toolbar */}
        <div
          style={{
            padding: '12px 24px',
            background: '#FAFBFC',
            borderBottom: '1px solid #F1F5F9',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          {/* Select all */}
          <div
            onClick={toggleSelectAll}
            style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          >
            <div
              style={{
                width: 18,
                height: 18,
                borderRadius: 5,
                border: `2px solid ${allSelected ? '#2563EB' : '#CBD5E1'}`,
                background: allSelected ? '#2563EB' : '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              {allSelected && (
                <div style={{ width: 8, height: 8, borderRadius: 2, background: '#fff' }} />
              )}
            </div>
            <span style={{ fontSize: 12, fontWeight: 600, color: '#64748B' }}>Select all</span>
          </div>

          {selectedApps.size > 0 && (
            <>
              <div style={{ width: 1, height: 20, background: '#E2E8F0' }} />
              <span
                style={{
                  background: '#EFF6FF',
                  color: '#2563EB',
                  border: '1px solid #BFDBFE',
                  padding: '2px 9px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {selectedApps.size} selected
              </span>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <select
                  value={batchStatus}
                  onChange={(e) => setBatchStatus(e.target.value)}
                  style={{
                    padding: '6px 10px',
                    border: '1.5px solid #E2E8F0',
                    borderRadius: 8,
                    fontSize: 12,
                    fontWeight: 600,
                    color: '#475569',
                    background: '#fff',
                    outline: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <option value="">Move to status…</option>
                  <option value="under_review">Under Review</option>
                  <option value="shortlisted">Shortlisted</option>
                  <option value="assessment_sent">Assessment Sent</option>
                  <option value="interview_scheduled">Interview Scheduled</option>
                  <option value="hired">Hired</option>
                  <option value="rejected">Not Selected</option>
                </select>
                <button
                  type="button"
                  onClick={handleBatchAction}
                  disabled={!batchStatus || batchSaving}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    background:
                      !batchStatus || batchSaving
                        ? '#F1F5F9'
                        : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: !batchStatus || batchSaving ? '#94A3B8' : '#fff',
                    border: 'none',
                    borderRadius: 8,
                    padding: '7px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: !batchStatus || batchSaving ? 'not-allowed' : 'pointer',
                    boxShadow:
                      !batchStatus || batchSaving ? 'none' : '0 2px 8px rgba(37,99,235,0.3)',
                  }}
                >
                  <Zap size={12} />
                  {batchSaving ? 'Applying…' : `Apply to ${selectedApps.size}`}
                </button>
              </div>
              {batchSaved && (
                <span
                  style={{
                    fontSize: 12,
                    color: '#10B981',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CheckCircle2 size={13} /> Status updated!
                </span>
              )}
            </>
          )}

          {selectedApps.size === 0 && (
            <span style={{ fontSize: 12, color: '#94A3B8' }}>
              Select applicants to use batch actions
            </span>
          )}
        </div>

        {/* Applicant list */}
        <div style={{ padding: '16px 24px', display: 'flex', flexDirection: 'column', gap: 10 }}>
          {filteredApps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '40px 0', color: '#94A3B8' }}>
              <Users size={32} style={{ margin: '0 auto 12px', display: 'block', opacity: 0.4 }} />
              <div style={{ fontSize: 14, fontWeight: 700, marginBottom: 4 }}>No applicants</div>
              <div style={{ fontSize: 13 }}>
                {activeTab !== 'all'
                  ? `No applicants from ${activeTab} yet.`
                  : 'No applications received yet.'}
              </div>
            </div>
          ) : (
            filteredApps.map((app) => (
              <ApplicantCard
                key={app._id}
                app={app}
                jobId={jobId}
                selected={selectedApps.has(app._id)}
                onSelect={toggleSelect}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
