'use client';
// src/app/student/ger/page.tsx
// Graduation Evaluation Report — live preview + download + save to profile

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Download,
  FileText,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Save,
  Lock,
  GraduationCap,
  Star,
  Briefcase,
  Users,
  Code2,
  Award,
  TrendingUp,
  ExternalLink,
  Layers,
  BookOpen,
  Zap,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';
import type { GERData, GERCategory } from '@/lib/ger-pdf';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  teal: '#0D9488',
  violet: '#7C3AED',
  emerald: '#059669',
  amber: '#D97706',
  pink: '#DB2777',
  sky: '#0EA5E9',
  indigo: '#6366F1',
  dark: '#0F172A',
  navyMid: '#1E293B',
  bg: '#F1F5F9',
  white: '#fff',
  border: '#E2E8F0',
  text: '#0F172A',
  gray: '#64748B',
  light: '#94A3B8',
  success: '#10B981',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
};

const CAT_COLORS = [C.blue, C.teal, C.violet, C.emerald, C.amber, C.pink, C.sky, C.indigo];

const CAT_ICONS = [
  <GraduationCap key="acad" size={16} />,
  <Code2 key="skill" size={16} />,
  <Layers key="engage" size={16} />,
  <Users key="mentor" size={16} />,
  <Briefcase key="free" size={16} />,
  <Award key="badge" size={16} />,
  <Star key="endorse" size={16} />,
  <TrendingUp key="opp" size={16} />,
];

function gradeColor(g: string) {
  if (g === 'A+' || g === 'A') return C.success;
  if (g === 'B+' || g === 'B') return C.blue;
  if (g === 'C') return C.amber;
  return C.danger;
}

function fmtDate(iso?: string | null) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  } catch {
    return iso;
  }
}

// ── Category card ──────────────────────────────────────────────────────────
function CategoryCard({
  cat,
  color,
  icon,
}: {
  cat: GERCategory;
  color: string;
  icon: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pct = cat.rawScore;

  return (
    <div
      style={{
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${C.border}`,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s',
        cursor: 'pointer',
      }}
      onClick={() => setOpen((v) => !v)}
      onMouseEnter={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.09)')}
      onMouseLeave={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
    >
      {/* Top accent */}
      <div style={{ height: 3, background: color }} />

      <div style={{ padding: '16px 18px' }}>
        {/* Header row */}
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            marginBottom: 10,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <div
              style={{
                width: 32,
                height: 32,
                borderRadius: 9,
                background: `${color}18`,
                color,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 12, fontWeight: 800, color: C.text }}>{cat.label}</div>
              <div style={{ fontSize: 10, color: C.light, marginTop: 1 }}>
                Weight: {cat.weight}%
              </div>
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div
              style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'var(--font-display)' }}
            >
              {cat.weightedScore.toFixed(1)}
            </div>
            <div style={{ fontSize: 9, color: C.light }}>/ {cat.weight} pts</div>
          </div>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 8,
            background: C.bg,
            borderRadius: 999,
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${pct}%`,
              height: '100%',
              borderRadius: 999,
              background: color,
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontSize: 11, color: C.gray }}>{cat.detail}</div>
          <div style={{ fontSize: 11, fontWeight: 700, color }}>{cat.rawScore}/100</div>
        </div>

        {/* Expandable evidence */}
        {open && cat.items.length > 0 && (
          <div
            style={{
              marginTop: 12,
              paddingTop: 12,
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 5,
            }}
          >
            {cat.items.map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: color,
                    marginTop: 5,
                    flexShrink: 0,
                  }}
                />
                <span style={{ fontSize: 12, color: C.gray }}>{item}</span>
              </div>
            ))}
          </div>
        )}

        {/* Toggle hint */}
        <div style={{ marginTop: 8, fontSize: 10, color: C.light, textAlign: 'right' }}>
          {open ? '▲ Hide details' : '▼ Show evidence'}
        </div>
      </div>
    </div>
  );
}

// ── Stat pill ──────────────────────────────────────────────────────────────
function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: string | number;
  color: string;
}) {
  return (
    <div
      style={{
        background: `${color}10`,
        border: `1px solid ${color}25`,
        borderRadius: 12,
        padding: '12px 16px',
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 900, color, fontFamily: 'var(--font-display)' }}>
        {value}
      </div>
      <div style={{ fontSize: 11, color: C.gray, marginTop: 3 }}>{label}</div>
    </div>
  );
}

// ── Score ring ─────────────────────────────────────────────────────────────
function ScoreRing({ score, grade }: { score: number; grade: string }) {
  const gc = gradeColor(grade);
  const r = 70;
  const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div style={{ position: 'relative', width: 180, height: 180, margin: '0 auto' }}>
      <svg width={180} height={180} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={90} cy={90} r={r} fill="none" stroke="#E2E8F0" strokeWidth={12} />
        <circle
          cx={90}
          cy={90}
          r={r}
          fill="none"
          stroke={gc}
          strokeWidth={12}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          style={{ transition: 'stroke-dasharray 1s ease' }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div
          style={{
            fontSize: 36,
            fontWeight: 900,
            color: gc,
            fontFamily: 'var(--font-display)',
            lineHeight: 1,
          }}
        >
          {score}
        </div>
        <div style={{ fontSize: 12, color: C.light }}>/ 100</div>
        <div
          style={{
            marginTop: 6,
            background: gc,
            color: '#fff',
            padding: '3px 12px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 800,
          }}
        >
          {grade}
        </div>
      </div>
    </div>
  );
}

// ── Main page ──────────────────────────────────────────────────────────────
export default function GERPage() {
  const [gerData, setGerData] = useState<GERData | null>(null);
  const [isGraduated, setIsGraduated] = useState(false);
  const [gerUrl, setGerUrl] = useState<string | null>(null);
  const [stats, setStats] = useState<Record<string, number>>({});
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { startUpload } = useUploadThing('gerUploader');

  useEffect(() => {
    fetch('/api/ger/preview')
      .then((r) => r.json())
      .then((data) => {
        if (data.gerData) setGerData(data.gerData);
        if (data.isGraduated !== undefined) setIsGraduated(data.isGraduated);
        if (data.gerUrl) setGerUrl(data.gerUrl);
        setStats({
          applications: data.applicationCount ?? 0,
          events: data.eventCount ?? 0,
          hired: data.hiredCount ?? 0,
          mentors: data.mentorSessions ?? 0,
          freelance: data.freelanceOrders ?? 0,
          badges: data.badgeCount ?? 0,
        });
      })
      .catch(() => setError('Failed to load GER data'))
      .finally(() => setFetching(false));
  }, []);

  async function handleDownload() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/ger/generate');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to generate GER');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(gerData?.name ?? 'Student').replace(/\s+/g, '_')}_GER.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate GER. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveToProfile() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/ger/generate');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed');
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], 'ger.pdf', { type: 'application/pdf' });
      const uploaded = await startUpload([file]);
      const gerFileUrl = uploaded?.[0]?.ufsUrl;
      if (!gerFileUrl) {
        setError('Upload failed.');
        return;
      }

      setGerUrl(gerFileUrl);
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError('Failed to save GER. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (fetching) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
          color: C.gray,
        }}
      >
        <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite', marginRight: 10 }} />
        Loading your Graduation Report…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  const btnDisabled = generating || saving;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* ── Header ── */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.navyMid})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 1060, margin: '0 auto', padding: '20px 24px' }}>
          <Link
            href="/student/dashboard"
            style={{ color: C.gray, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Dashboard
          </Link>

          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
              marginTop: 16,
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                <div
                  style={{
                    width: 38,
                    height: 38,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #7C3AED, #2563EB)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <GraduationCap size={20} />
                </div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                  }}
                >
                  Graduation Evaluation Report
                </h1>
              </div>
              <p style={{ color: C.gray, fontSize: 13, margin: 0 }}>
                A comprehensive, data-backed achievement document reflecting your entire university
                journey on Nextern. Scored out of 100 across 8 professional categories.
              </p>
            </div>

            {isGraduated && (
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', flexShrink: 0 }}>
                <button
                  onClick={handleDownload}
                  disabled={btnDisabled}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 20px',
                    background: generating
                      ? 'rgba(37,99,235,0.5)'
                      : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 11,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: btnDisabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-display)',
                    boxShadow: generating ? 'none' : '0 4px 14px rgba(37,99,235,0.4)',
                  }}
                >
                  {generating ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />{' '}
                      Generating…
                    </>
                  ) : (
                    <>
                      <Download size={14} /> Download GER PDF
                    </>
                  )}
                </button>

                <button
                  onClick={handleSaveToProfile}
                  disabled={btnDisabled}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '11px 20px',
                    background: saving
                      ? 'rgba(124,58,237,0.5)'
                      : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 11,
                    fontSize: 14,
                    fontWeight: 700,
                    cursor: btnDisabled ? 'not-allowed' : 'pointer',
                    fontFamily: 'var(--font-display)',
                    boxShadow: saving ? 'none' : '0 4px 14px rgba(124,58,237,0.4)',
                  }}
                >
                  {saving ? (
                    <>
                      <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />{' '}
                      Saving…
                    </>
                  ) : (
                    <>
                      <Save size={14} /> Save to Profile
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div style={{ maxWidth: 1060, margin: '28px auto', padding: '0 24px 48px' }}>
        {/* Alerts */}
        {error && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: C.dangerBg,
              border: `1px solid ${C.dangerBorder}`,
              borderRadius: 12,
              padding: '12px 16px',
              color: '#991B1B',
              fontSize: 14,
              marginBottom: 18,
            }}
          >
            <AlertCircle size={15} /> {error}
          </div>
        )}
        {saved && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              borderRadius: 12,
              padding: '12px 16px',
              color: '#065F46',
              fontSize: 14,
              fontWeight: 600,
              marginBottom: 18,
            }}
          >
            <CheckCircle2 size={15} /> GER saved to your profile — now shareable with recruiters and
            university advisors.
          </div>
        )}

        {/* ── Not graduated lock screen ── */}
        {!isGraduated && (
          <div
            style={{
              background: C.white,
              borderRadius: 20,
              border: `1px solid ${C.border}`,
              padding: '60px 40px',
              textAlign: 'center',
              marginBottom: 24,
              boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: '#F8FAFC',
                border: `2px solid ${C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.light,
                margin: '0 auto 20px',
              }}
            >
              <Lock size={30} />
            </div>
            <div
              style={{
                fontSize: 20,
                fontWeight: 900,
                color: C.text,
                fontFamily: 'var(--font-display)',
                marginBottom: 10,
              }}
            >
              GER Unlocks at Graduation
            </div>
            <div
              style={{
                fontSize: 14,
                color: C.gray,
                lineHeight: 1.75,
                maxWidth: 480,
                margin: '0 auto 24px',
              }}
            >
              Your Graduation Evaluation Report is generated once you mark yourself as graduated on
              your profile. In the meantime, you can see a live preview of how your scores would
              look below.
            </div>
            <Link
              href="/student/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                background: C.violet,
                color: '#fff',
                padding: '11px 24px',
                borderRadius: 11,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
              }}
            >
              <GraduationCap size={15} /> Mark as Graduated on Profile
            </Link>
          </div>
        )}

        {/* ── Saved GER link ── */}
        {gerUrl && (
          <div
            style={{
              background: C.successBg,
              border: `1px solid ${C.successBorder}`,
              borderRadius: 14,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 12,
              marginBottom: 24,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <CheckCircle2 size={18} color={C.success} />
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>
                  GER saved to your profile
                </div>
                <div style={{ fontSize: 12, color: C.success }}>
                  Shareable directly with recruiters and university advisors
                </div>
              </div>
            </div>
            <a
              href={gerUrl}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: C.success,
                color: '#fff',
                padding: '9px 18px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                flexShrink: 0,
              }}
            >
              <ExternalLink size={13} /> View GER
            </a>
          </div>
        )}

        {gerData && (
          <div style={{ display: 'flex', gap: 22 }} className="ger-layout">
            {/* ── Left: main content ── */}
            <div
              style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 20, minWidth: 0 }}
            >
              {/* Score hero card */}
              <div
                style={{
                  background: `linear-gradient(135deg, ${C.dark}, ${C.navyMid})`,
                  borderRadius: 20,
                  padding: '32px 32px 28px',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.14)',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Decorative */}
                <div
                  style={{
                    position: 'absolute',
                    top: -20,
                    right: -20,
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(124,58,237,0.12) 0%, transparent 70%)',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: -30,
                    left: -10,
                    width: 140,
                    height: 140,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(13,148,136,0.10) 0%, transparent 70%)',
                  }}
                />

                <div style={{ display: 'flex', alignItems: 'center', gap: 40, flexWrap: 'wrap' }}>
                  <ScoreRing score={gerData.totalScore} grade={gerData.grade} />

                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.violet,
                        letterSpacing: 1.5,
                        textTransform: 'uppercase',
                        marginBottom: 8,
                      }}
                    >
                      Graduation Evaluation Report
                    </div>
                    <div
                      style={{
                        fontSize: 22,
                        fontWeight: 900,
                        color: '#F8FAFC',
                        fontFamily: 'var(--font-display)',
                        marginBottom: 4,
                      }}
                    >
                      {gerData.name}
                    </div>
                    {(gerData.department || gerData.university) && (
                      <div style={{ fontSize: 12, color: '#93C5FD', marginBottom: 8 }}>
                        {[gerData.department, gerData.university].filter(Boolean).join('  ·  ')}
                      </div>
                    )}
                    {gerData.cgpa != null && (
                      <div
                        style={{
                          display: 'inline-block',
                          background: C.blue,
                          color: '#fff',
                          padding: '4px 12px',
                          borderRadius: 999,
                          fontSize: 12,
                          fontWeight: 700,
                          marginBottom: 12,
                        }}
                      >
                        CGPA {gerData.cgpa.toFixed(2)} / 4.00
                      </div>
                    )}

                    {/* Mini category bars */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginTop: 4 }}>
                      {gerData.categories.map((cat, i) => (
                        <div
                          key={cat.key}
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}
                        >
                          <div style={{ fontSize: 9, color: '#64748B', width: 110, flexShrink: 0 }}>
                            {cat.label}
                          </div>
                          <div
                            style={{
                              flex: 1,
                              height: 5,
                              background: 'rgba(255,255,255,0.07)',
                              borderRadius: 999,
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                width: `${cat.rawScore}%`,
                                height: '100%',
                                background: CAT_COLORS[i],
                                borderRadius: 999,
                              }}
                            />
                          </div>
                          <div
                            style={{
                              fontSize: 9,
                              fontWeight: 700,
                              color: CAT_COLORS[i],
                              width: 28,
                              textAlign: 'right',
                            }}
                          >
                            {cat.weightedScore.toFixed(0)}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform activity stats */}
              <div
                style={{
                  background: C.white,
                  borderRadius: 18,
                  border: `1px solid ${C.border}`,
                  padding: '20px 22px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                }}
              >
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: C.text,
                    marginBottom: 16,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Platform Activity Summary
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
                  <StatPill
                    label="Job Applications"
                    value={stats.applications ?? 0}
                    color={C.blue}
                  />
                  <StatPill label="Events Attended" value={stats.events ?? 0} color={C.violet} />
                  <StatPill label="Hired Outcomes" value={stats.hired ?? 0} color={C.emerald} />
                  <StatPill label="Mentor Sessions" value={stats.mentors ?? 0} color={C.teal} />
                  <StatPill label="Freelance Orders" value={stats.freelance ?? 0} color={C.amber} />
                  <StatPill label="Badges Earned" value={stats.badges ?? 0} color={C.pink} />
                </div>
              </div>

              {/* 8 Category cards */}
              <div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: C.text,
                    marginBottom: 14,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Category Breakdown{' '}
                  <span style={{ color: C.light, fontSize: 12, fontWeight: 500 }}>
                    — click any card to see evidence
                  </span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  {gerData.categories.map((cat, i) => (
                    <CategoryCard
                      key={cat.key}
                      cat={cat}
                      color={CAT_COLORS[i]}
                      icon={CAT_ICONS[i]}
                    />
                  ))}
                </div>
              </div>

              {/* Note about scoring */}
              <div
                style={{
                  background: `${C.violet}0D`,
                  border: `1px solid ${C.violet}25`,
                  borderRadius: 14,
                  padding: '16px 20px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <Zap size={16} color={C.violet} style={{ flexShrink: 0, marginTop: 2 }} />
                  <div>
                    <div
                      style={{ fontSize: 13, fontWeight: 700, color: C.violet, marginBottom: 4 }}
                    >
                      How GER is scored
                    </div>
                    <div style={{ fontSize: 12, color: C.gray, lineHeight: 1.7 }}>
                      Your GER is computed from real data across your entire Nextern journey. Each
                      category has a weight (18% for Academic, 15% for Skill Growth, 13% for Badges,
                      etc.) and a raw score 0–100. Weighted scores are summed to a final GER score
                      out of 100%. Platform Engagement, Mentorship, and Freelance scores grow
                      automatically as you use Nextern — the GER updates each time you generate it.
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ── Right: sticky sidebar ── */}
            <div style={{ width: 256, flexShrink: 0 }} className="ger-sidebar">
              <div
                style={{
                  background: C.white,
                  borderRadius: 18,
                  border: `1px solid ${C.border}`,
                  padding: '20px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                  position: 'sticky',
                  top: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 14,
                }}
              >
                {/* Score summary */}
                <div>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: C.text,
                      marginBottom: 14,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    GER Score
                  </div>
                  <div
                    style={{
                      background: `linear-gradient(135deg, ${C.dark}, ${C.navyMid})`,
                      borderRadius: 14,
                      padding: '18px',
                      textAlign: 'center',
                    }}
                  >
                    <div
                      style={{
                        fontSize: 36,
                        fontWeight: 900,
                        color: gradeColor(gerData.grade),
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {gerData.totalScore}
                    </div>
                    <div style={{ fontSize: 11, color: C.light }}>out of 100</div>
                    <div
                      style={{
                        display: 'inline-block',
                        marginTop: 8,
                        background: gradeColor(gerData.grade),
                        color: '#fff',
                        padding: '4px 16px',
                        borderRadius: 999,
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {gerData.grade}
                    </div>
                  </div>
                </div>

                {/* Category mini scores */}
                <div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.light,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 10,
                    }}
                  >
                    Category Scores
                  </div>
                  {gerData.categories.map((cat, i) => (
                    <div key={cat.key} style={{ marginBottom: 10 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 3,
                        }}
                      >
                        <span style={{ fontSize: 11, color: C.gray, fontWeight: 600 }}>
                          {cat.label}
                        </span>
                        <span style={{ fontSize: 11, fontWeight: 800, color: CAT_COLORS[i] }}>
                          {cat.weightedScore.toFixed(1)}
                          <span style={{ color: C.light, fontWeight: 400 }}>/{cat.weight}</span>
                        </span>
                      </div>
                      <div
                        style={{
                          height: 5,
                          background: C.bg,
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            width: `${cat.rawScore}%`,
                            height: '100%',
                            background: CAT_COLORS[i],
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Grading scale */}
                <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 14 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 700,
                      color: C.light,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      marginBottom: 10,
                    }}
                  >
                    Grading Scale
                  </div>
                  {[
                    { g: 'A+', range: '90–100', color: C.success },
                    { g: 'A', range: '80–89', color: C.success },
                    { g: 'B+', range: '70–79', color: C.blue },
                    { g: 'B', range: '60–69', color: C.blue },
                    { g: 'C', range: '50–59', color: C.amber },
                    { g: 'F', range: '0–49', color: C.danger },
                  ].map(({ g, range, color }) => (
                    <div
                      key={g}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '4px 8px',
                        borderRadius: 6,
                        marginBottom: 3,
                        background: gerData.grade === g ? `${color}12` : 'transparent',
                      }}
                    >
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: gerData.grade === g ? 800 : 400,
                          color: gerData.grade === g ? color : C.gray,
                        }}
                      >
                        Grade {g}
                      </span>
                      <span style={{ fontSize: 11, color: gerData.grade === g ? color : C.light }}>
                        {range}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Actions */}
                {isGraduated && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <button
                      onClick={handleDownload}
                      disabled={btnDisabled}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 0',
                        width: '100%',
                        background: generating
                          ? '#93C5FD'
                          : `linear-gradient(135deg, ${C.blue}, ${C.blueDark})`,
                        color: '#fff',
                        border: 'none',
                        borderRadius: 11,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: btnDisabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-display)',
                        boxShadow: generating ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                      }}
                    >
                      {generating ? (
                        <>
                          <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />{' '}
                          Generating…
                        </>
                      ) : (
                        <>
                          <Download size={13} /> Download PDF
                        </>
                      )}
                    </button>
                    <button
                      onClick={handleSaveToProfile}
                      disabled={btnDisabled}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 8,
                        padding: '12px 0',
                        width: '100%',
                        background: saving ? 'rgba(124,58,237,0.4)' : `${C.violet}12`,
                        color: saving ? '#fff' : C.violet,
                        border: `1.5px solid ${C.violet}30`,
                        borderRadius: 11,
                        fontSize: 13,
                        fontWeight: 700,
                        cursor: btnDisabled ? 'not-allowed' : 'pointer',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {saving ? (
                        <>
                          <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} />{' '}
                          Saving…
                        </>
                      ) : (
                        <>
                          <Save size={13} /> Save to Profile
                        </>
                      )}
                    </button>
                    {gerUrl && (
                      <a
                        href={gerUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: 6,
                          padding: '10px 0',
                          background: C.successBg,
                          color: C.success,
                          border: `1px solid ${C.successBorder}`,
                          borderRadius: 11,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        <ExternalLink size={12} /> View Saved GER
                      </a>
                    )}
                  </div>
                )}

                {!isGraduated && (
                  <div
                    style={{
                      background: `${C.amber}10`,
                      border: `1px solid ${C.amber}30`,
                      borderRadius: 12,
                      padding: '12px 14px',
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 700, color: C.amber, marginBottom: 4 }}>
                      🎓 Preview Mode
                    </div>
                    <div style={{ fontSize: 11, color: C.gray, lineHeight: 1.6 }}>
                      Mark yourself as graduated on your profile to unlock the official GER and PDF
                      download.
                    </div>
                    <Link
                      href="/student/profile"
                      style={{
                        display: 'block',
                        marginTop: 10,
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.amber,
                        textDecoration: 'none',
                      }}
                    >
                      Go to Profile →
                    </Link>
                  </div>
                )}

                {/* Info */}
                <div style={{ paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                  <div
                    style={{ fontSize: 10, color: C.light, lineHeight: 1.6, textAlign: 'center' }}
                  >
                    GER is auto-generated from your Nextern platform data. Shareable directly with
                    recruiters and university advisors as verified proof of readiness.
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .ger-layout  { flex-direction: column !important; }
          .ger-sidebar { width: 100% !important; }
        }
        @media (max-width: 600px) {
          .ger-layout > div:first-child > div > div {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
