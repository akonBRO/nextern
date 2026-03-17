'use client';
// src/app/student/jobs/JobFeedClient.tsx
// Handles search/filter UI + apply modal — client-side interactivity

import { useState, useMemo } from 'react';
import { Search, MapPin, Clock, Users, Layers, Rocket, CalendarDays } from 'lucide-react';

const C = {
  blue: '#2563EB',
  indigo: '#1E293B',
  cyan: '#22D3EE',
  bg: '#F1F5F9',
  gray: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#fff',
  dark: '#0F172A',
  border: '#E2E8F0',
  text: '#0F172A',
  light: '#94A3B8',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warnBg: '#FFFBEB',
  warnBorder: '#FDE68A',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
};

const TYPE_LABELS: Record<string, string> = {
  internship: 'Internship',
  'part-time': 'Part-time',
  'full-time': 'Full-time',
  'campus-drive': 'Campus Drive',
  webinar: 'Webinar',
  workshop: 'Workshop',
};
const TYPE_COLORS: Record<string, { bg: string; color: string; border: string }> = {
  internship: { bg: C.blueBg, color: C.blue, border: C.blueBorder },
  'part-time': { bg: C.successBg, color: '#065F46', border: C.successBorder },
  'full-time': { bg: '#EDE9FE', color: '#7C3AED', border: '#DDD6FE' },
  'campus-drive': { bg: C.warnBg, color: '#92400E', border: C.warnBorder },
  webinar: { bg: '#F0F9FF', color: '#0369A1', border: '#BAE6FD' },
  workshop: { bg: C.dangerBg, color: '#BE123C', border: C.dangerBorder },
};

function daysLeft(d?: string) {
  if (!d) return null;
  return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000);
}

type Job = {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  type: string;
  locationType: string;
  city?: string;
  stipendBDT?: number;
  isStipendNegotiable?: boolean;
  applicationDeadline?: string;
  requiredSkills: string[];
  applicationCount: number;
  isBatchHiring?: boolean;
  isPremiumListing?: boolean;
  fitScore: number | null;
  hasApplied: boolean;
};

function ApplyModal({
  job,
  onClose,
  onSuccess,
}: {
  job: Job;
  onClose: () => void;
  onSuccess: (jobId: string, fitScore: number | null) => void;
}) {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleApply() {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/jobs/${job._id}/apply`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverLetter }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to apply');
        return;
      }
      onSuccess(job._id, typeof data.fitScore === 'number' ? data.fitScore : null);
      onClose();
    } catch {
      setError('Network error. Please try again.');
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
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 16,
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          background: C.white,
          borderRadius: 20,
          padding: 32,
          width: '100%',
          maxWidth: 480,
          boxShadow: '0 24px 64px rgba(0,0,0,0.25)',
        }}
      >
        <h2
          style={{
            fontSize: 20,
            fontWeight: 900,
            color: C.text,
            fontFamily: 'var(--font-display)',
            marginBottom: 4,
          }}
        >
          Apply to {job.title}
        </h2>
        <p style={{ color: C.gray, fontSize: 14, marginBottom: 24 }}>
          {job.companyName}
          {job.city ? ` · ${job.city}` : ''}
        </p>
        {error && (
          <div
            style={{
              background: C.dangerBg,
              border: `1px solid ${C.dangerBorder}`,
              borderRadius: 10,
              padding: '10px 14px',
              color: '#991B1B',
              fontSize: 14,
              marginBottom: 16,
            }}
          >
            {error}
          </div>
        )}
        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              display: 'block',
              fontSize: 13,
              fontWeight: 700,
              color: '#374151',
              marginBottom: 7,
            }}
          >
            Cover Letter{' '}
            <span style={{ color: C.light, fontWeight: 400 }}>(optional, max 2000 chars)</span>
          </label>
          <textarea
            value={coverLetter}
            onChange={(e) => setCoverLetter(e.target.value)}
            rows={5}
            placeholder="Introduce yourself and explain why you're a great fit for this role…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '11px 14px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              outline: 'none',
              resize: 'vertical',
              color: C.text,
            }}
          />
        </div>
        <div
          style={{
            background: C.bg,
            borderRadius: 10,
            padding: '10px 14px',
            marginBottom: 24,
            fontSize: 13,
            color: C.gray,
          }}
        >
          📎 Your profile resume will be automatically attached to this application.
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            onClick={onClose}
            style={{
              flex: 1,
              padding: '12px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              background: C.white,
              color: C.gray,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={loading}
            style={{
              flex: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 7,
              padding: '12px',
              background: loading ? '#93C5FD' : `linear-gradient(135deg, ${C.blue}, #1D4ED8)`,
              color: C.white,
              border: 'none',
              borderRadius: 10,
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
            }}
          >
            <Rocket size={15} />
            {loading ? 'Submitting…' : 'Submit Application'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function JobFeedClient({ jobs: initialJobs }: { jobs: Job[] }) {
  const [jobs, setJobs] = useState(initialJobs);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [applyingJob, setApplyingJob] = useState<Job | null>(null);
  const [successMsg, setSuccessMsg] = useState('');

  const filtered = useMemo(() => {
    return jobs.filter((j) => {
      const matchSearch =
        !search ||
        j.title.toLowerCase().includes(search.toLowerCase()) ||
        j.companyName.toLowerCase().includes(search.toLowerCase());
      const matchType = !typeFilter || j.type === typeFilter;
      return matchSearch && matchType;
    });
  }, [jobs, search, typeFilter]);

  function handleApplySuccess(jobId: string, fitScore: number | null) {
    setJobs((prev) =>
      prev.map((j) =>
        j._id === jobId
          ? {
              ...j,
              hasApplied: true,
              applicationCount: j.applicationCount + 1,
              fitScore: fitScore ?? j.fitScore,
            }
          : j
      )
    );
    const job = jobs.find((j) => j._id === jobId);
    if (job) {
      setSuccessMsg(`Successfully applied to ${job.title}!`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  }

  const TYPES = [
    { v: '', l: 'All types' },
    { v: 'internship', l: '🎓 Internship' },
    { v: 'part-time', l: '⏰ Part-time' },
    { v: 'full-time', l: '💼 Full-time' },
    { v: 'campus-drive', l: '🏫 Campus Drive' },
    { v: 'webinar', l: '🌐 Webinar' },
    { v: 'workshop', l: '🔧 Workshop' },
  ];

  return (
    <>
      {/* Search + filters */}
      <div
        style={{
          marginTop: 28,
          marginBottom: 20,
          display: 'flex',
          gap: 12,
          flexWrap: 'wrap',
          alignItems: 'center',
        }}
      >
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <div
            style={{
              position: 'absolute',
              left: 13,
              top: '50%',
              transform: 'translateY(-50%)',
              color: C.light,
              pointerEvents: 'none',
            }}
          >
            <Search size={15} />
          </div>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search jobs, companies…"
            style={{
              width: '100%',
              boxSizing: 'border-box',
              padding: '11px 14px 11px 38px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 11,
              fontSize: 14,
              fontFamily: 'var(--font-body)',
              outline: 'none',
              color: C.text,
              background: C.white,
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {TYPES.map((t) => (
            <button
              key={t.v}
              onClick={() => setTypeFilter(t.v)}
              style={{
                padding: '9px 14px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: `1.5px solid ${typeFilter === t.v ? C.blue : C.border}`,
                background: typeFilter === t.v ? C.blueBg : C.white,
                color: typeFilter === t.v ? C.blue : C.gray,
                cursor: 'pointer',
                transition: 'all 0.15s',
                whiteSpace: 'nowrap',
              }}
            >
              {t.l}
            </button>
          ))}
        </div>
        <span style={{ color: C.light, fontSize: 13, whiteSpace: 'nowrap' }}>
          {filtered.length} listing{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Success toast */}
      {successMsg && (
        <div
          style={{
            position: 'fixed',
            top: 20,
            right: 20,
            background: C.indigo,
            color: C.success,
            padding: '13px 20px',
            borderRadius: 12,
            fontSize: 14,
            fontWeight: 700,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            zIndex: 999,
            border: '1px solid rgba(16,185,129,0.2)',
          }}
        >
          ✅ {successMsg}
        </div>
      )}

      {/* Job grid */}
      {filtered.length === 0 ? (
        <div
          style={{
            background: C.white,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
            padding: '48px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 12 }}>🔍</div>
          <h3
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: C.text,
              fontFamily: 'var(--font-display)',
              marginBottom: 8,
            }}
          >
            No jobs found
          </h3>
          <p style={{ color: C.gray, fontSize: 14 }}>
            Try adjusting your search or check back later for new listings.
          </p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))',
            gap: 16,
          }}
        >
          {filtered.map((job) => {
            const typeStyle = TYPE_COLORS[job.type] ?? TYPE_COLORS['internship'];
            const days = daysLeft(job.applicationDeadline);
            const isUrgent = days !== null && days <= 3 && days >= 0;
            const isExpired = days !== null && days < 0;

            return (
              <div
                key={job._id}
                style={{
                  background: C.white,
                  borderRadius: 18,
                  border: `1px solid ${isUrgent ? C.warnBorder : C.border}`,
                  padding: '20px 22px',
                  boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
                  transition: 'box-shadow 0.2s, transform 0.2s',
                  cursor: 'default',
                }}
                onMouseOver={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 8px 28px rgba(0,0,0,0.09)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
                }}
                onMouseOut={(e) => {
                  (e.currentTarget as HTMLElement).style.boxShadow = '0 1px 6px rgba(0,0,0,0.04)';
                  (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                }}
              >
                {/* Top */}
                <div
                  style={{ display: 'flex', alignItems: 'flex-start', gap: 12, marginBottom: 12 }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      background: `linear-gradient(135deg, ${C.indigo}, #334155)`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: C.white,
                      fontSize: 16,
                      fontWeight: 900,
                      flexShrink: 0,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {job.companyLogo ? (
                      <img
                        src={job.companyLogo}
                        alt=""
                        style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }}
                      />
                    ) : (
                      job.companyName.charAt(0)
                    )}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        flexWrap: 'wrap',
                        marginBottom: 4,
                      }}
                    >
                      <span
                        style={{
                          background: typeStyle.bg,
                          color: typeStyle.color,
                          border: `1px solid ${typeStyle.border}`,
                          padding: '2px 8px',
                          borderRadius: 999,
                          fontSize: 10,
                          fontWeight: 700,
                        }}
                      >
                        {TYPE_LABELS[job.type] ?? job.type}
                      </span>
                      {job.isBatchHiring && (
                        <span
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 3,
                            background: '#EDE9FE',
                            color: '#7C3AED',
                            border: '1px solid #DDD6FE',
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          <Layers size={10} /> Batch
                        </span>
                      )}
                      {job.isPremiumListing && (
                        <span
                          style={{
                            background: C.warnBg,
                            color: '#92400E',
                            border: `1px solid ${C.warnBorder}`,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          ⭐ Featured
                        </span>
                      )}
                      {isUrgent && (
                        <span
                          style={{
                            background: C.warnBg,
                            color: '#92400E',
                            border: `1px solid ${C.warnBorder}`,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          ⚡ Closing soon
                        </span>
                      )}
                      {job.hasApplied && (
                        <span
                          style={{
                            background: C.successBg,
                            color: '#065F46',
                            border: `1px solid ${C.successBorder}`,
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 700,
                          }}
                        >
                          ✓ Applied
                        </span>
                      )}
                    </div>
                    <h3
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: C.text,
                        fontFamily: 'var(--font-display)',
                        margin: 0,
                      }}
                    >
                      {job.title}
                    </h3>
                    <div style={{ color: C.gray, fontSize: 13, marginTop: 1, fontWeight: 600 }}>
                      {job.companyName}
                    </div>
                  </div>
                  {job.fitScore !== null && (
                    <div style={{ flexShrink: 0, textAlign: 'right' }}>
                      <div
                        style={{
                          fontSize: 18,
                          fontWeight: 900,
                          color:
                            job.fitScore >= 70
                              ? C.success
                              : job.fitScore >= 40
                                ? C.blue
                                : C.warning,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {job.fitScore}%
                      </div>
                      <div style={{ fontSize: 10, color: C.light, fontWeight: 600 }}>Fit</div>
                    </div>
                  )}
                </div>

                {/* Meta */}
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginBottom: 10 }}>
                  {job.city && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        color: C.gray,
                        fontSize: 12,
                      }}
                    >
                      <MapPin size={11} />
                      {job.city} · {job.locationType}
                    </span>
                  )}
                  {days !== null && (
                    <span
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 4,
                        fontSize: 12,
                        color: isUrgent ? C.warning : isExpired ? C.danger : C.gray,
                        fontWeight: isUrgent || isExpired ? 700 : 400,
                      }}
                    >
                      <Clock size={11} />
                      {isExpired ? 'Closed' : isUrgent ? `${days}d left` : `${days}d left`}
                    </span>
                  )}
                  <span
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      color: C.light,
                      fontSize: 12,
                    }}
                  >
                    <Users size={11} />
                    {job.applicationCount}
                  </span>
                  {job.stipendBDT && (
                    <span style={{ color: C.success, fontSize: 12, fontWeight: 700 }}>
                      ৳{job.stipendBDT.toLocaleString()}/mo
                    </span>
                  )}
                  {job.isStipendNegotiable && !job.stipendBDT && (
                    <span style={{ color: C.gray, fontSize: 12 }}>Negotiable</span>
                  )}
                </div>

                {/* Skills */}
                {job.requiredSkills.length > 0 && (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, marginBottom: 14 }}>
                    {job.requiredSkills.map((s) => (
                      <span
                        key={s}
                        style={{
                          background: C.bg,
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
                )}

                {/* Actions */}
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    borderTop: `1px solid ${C.bg}`,
                    paddingTop: 12,
                  }}
                >
                  <a
                    href={`/student/jobs/${job._id}`}
                    style={{
                      flex: 1,
                      textAlign: 'center',
                      padding: '8px',
                      border: `1.5px solid ${C.border}`,
                      borderRadius: 9,
                      color: C.gray,
                      fontSize: 12,
                      fontWeight: 600,
                      textDecoration: 'none',
                    }}
                  >
                    View Details
                  </a>
                  <button
                    onClick={() => !job.hasApplied && !isExpired && setApplyingJob(job)}
                    disabled={job.hasApplied || (isExpired ?? false)}
                    style={{
                      flex: 2,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      gap: 5,
                      padding: '8px',
                      background: job.hasApplied
                        ? C.successBg
                        : isExpired
                          ? C.bg
                          : `linear-gradient(135deg, ${C.blue}, #1D4ED8)`,
                      color: job.hasApplied ? '#065F46' : isExpired ? C.light : C.white,
                      border: job.hasApplied
                        ? `1.5px solid ${C.successBorder}`
                        : isExpired
                          ? `1.5px solid ${C.border}`
                          : 'none',
                      borderRadius: 9,
                      fontSize: 12,
                      fontWeight: 700,
                      cursor: job.hasApplied || (isExpired ?? false) ? 'not-allowed' : 'pointer',
                      fontFamily: 'var(--font-display)',
                      boxShadow:
                        !job.hasApplied && !isExpired ? '0 3px 10px rgba(37,99,235,0.3)' : 'none',
                    }}
                  >
                    {job.hasApplied ? (
                      job.type === 'webinar' || job.type === 'workshop' ? (
                        '✓ Registered'
                      ) : (
                        '✓ Applied'
                      )
                    ) : isExpired ? (
                      'Closed'
                    ) : job.type === 'webinar' || job.type === 'workshop' ? (
                      <>
                        <CalendarDays size={12} /> Register
                      </>
                    ) : (
                      <>
                        <Rocket size={12} /> Apply Now
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {applyingJob && (
        <ApplyModal
          job={applyingJob}
          onClose={() => setApplyingJob(null)}
          onSuccess={handleApplySuccess}
        />
      )}
    </>
  );
}
