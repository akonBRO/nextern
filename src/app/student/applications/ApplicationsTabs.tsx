'use client';
// src/app/student/applications/ApplicationsTabs.tsx
// Tabbed view — Applications tab + Events tab — Fully Responsive

import { useState } from 'react';
import type { ReactNode } from 'react';
import Link from 'next/link';
import {
  BriefcaseBusiness,
  CalendarDays,
  Send,
  Eye,
  Star,
  ClipboardList,
  CalendarCheck,
  BadgeCheck,
  XCircle,
  Undo2,
  MapPin,
  Clock,
  ChevronRight,
} from 'lucide-react';

/* ─── Status config ─────────────────────────────────────────────────────────── */
const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'info' | 'success' | 'warning' | 'neutral'; icon: ReactNode }
> = {
  applied: { label: 'Applied', tone: 'info', icon: <Send size={10} /> },
  under_review: { label: 'Under Review', tone: 'warning', icon: <Eye size={10} /> },
  shortlisted: { label: 'Shortlisted', tone: 'info', icon: <Star size={10} /> },
  assessment_sent: { label: 'Assessment Sent', tone: 'info', icon: <ClipboardList size={10} /> },
  interview_scheduled: {
    label: 'Interview Scheduled',
    tone: 'info',
    icon: <CalendarCheck size={10} />,
  },
  hired: { label: 'Hired', tone: 'success', icon: <BadgeCheck size={10} /> },
  rejected: { label: 'Not Selected', tone: 'warning', icon: <XCircle size={10} /> },
  withdrawn: { label: 'Withdrawn', tone: 'neutral', icon: <Undo2 size={10} /> },
};

const TONE_STYLES = {
  info: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  success: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  neutral: { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
};

/* ─── Types ──────────────────────────────────────────────────────────────────── */
type AppItem = {
  _id: string;
  status: string;
  coverLetter: string | null;
  resumeUrlSnapshot: string | null;
  appliedAt: string;
  fitScore: number | null;
  isEventRegistration: boolean;
  statusHistory: { status: string; changedAt: string }[];
  job: {
    _id: string;
    title: string;
    type: string;
    companyName: string;
    city: string | null;
    locationType: string;
    applicationDeadline: string | null;
  } | null;
};

/* ─── Helpers ────────────────────────────────────────────────────────────────── */
function formatShortDate(d?: string | null) {
  if (!d) return 'No date';
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(d));
}

function formatStatusLabel(v: string) {
  return v
    .split('_')
    .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
    .join(' ');
}

function getFitColor(score: number) {
  if (score >= 70) return { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' };
  if (score >= 40) return { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' };
  return { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' };
}

/* ─── Inline responsive styles injected once ─────────────────────────────────── */
const RESPONSIVE_STYLES = `
  .app-card {
    background: #fff;
    border-radius: 14px;
    border: 1px solid #E2E8F0;
    padding: 16px 18px;
    box-shadow: 0 1px 4px rgba(0,0,0,0.04);
    transition: box-shadow 0.18s, transform 0.18s;
    cursor: default;
  }
  .app-card:hover {
    box-shadow: 0 6px 24px rgba(37,99,235,0.10);
    transform: translateY(-1px);
  }
  .app-card-inner {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 12px;
  }
  .app-card-body { flex: 1; min-width: 0; }
  .app-card-title-row {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 7px;
    margin-bottom: 4px;
  }
  .app-card-title {
    font-size: 15px;
    font-weight: 800;
    color: #0F172A;
    font-family: var(--font-display, system-ui);
    margin: 0;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: 100%;
  }
  .app-card-meta {
    color: #64748B;
    font-size: 13px;
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 4px;
    margin-top: 2px;
  }
  .app-card-meta-dot { color: #CBD5E1; }
  .app-card-date { color: #94A3B8; font-size: 12px; }
  .app-card-cover {
    background: #F8FAFC;
    border-radius: 8px;
    padding: 7px 10px;
    margin-top: 10px;
    font-size: 12px;
    color: #64748B;
    font-style: italic;
    border-left: 2px solid #BFDBFE;
    line-height: 1.6;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .app-card-history {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-top: 8px;
  }
  .app-card-history-step { font-size: 11px; color: #94A3B8; }
  .app-card-actions {
    display: flex;
    flex-direction: column;
    align-items: flex-end;
    gap: 8px;
    flex-shrink: 0;
  }
  .app-card-link {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    color: #2563EB;
    font-size: 13px;
    font-weight: 600;
    text-decoration: none;
    padding: 6px 12px;
    border-radius: 8px;
    border: 1px solid #BFDBFE;
    background: #EFF6FF;
    transition: background 0.15s, border-color 0.15s;
    white-space: nowrap;
  }
  .app-card-link:hover { background: #DBEAFE; border-color: #93C5FD; }

  /* Badge base */
  .badge {
    display: inline-flex;
    align-items: center;
    gap: 4px;
    padding: 3px 9px;
    border-radius: 999px;
    font-size: 11px;
    font-weight: 700;
    border: 1px solid transparent;
    white-space: nowrap;
  }

  /* Tab bar */
  .tabs-bar {
    display: flex;
    border-bottom: 1px solid #E2E8F0;
    background: #FAFBFC;
    overflow-x: auto;
    scrollbar-width: none;
    -ms-overflow-style: none;
  }
  .tabs-bar::-webkit-scrollbar { display: none; }
  .tab-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 14px 22px;
    border: none;
    background: none;
    cursor: pointer;
    font-size: 14px;
    font-family: var(--font-body, system-ui);
    font-weight: 500;
    color: #64748B;
    border-bottom: 2.5px solid transparent;
    transition: all 0.15s;
    white-space: nowrap;
    flex-shrink: 0;
  }
  .tab-btn.active {
    font-weight: 700;
    color: #2563EB;
    border-bottom-color: #2563EB;
  }
  .tab-btn:hover:not(.active) { color: #334155; background: #F1F5F9; }

  /* List */
  .cards-list { display: flex; flex-direction: column; gap: 10px; }

  /* Empty state */
  .empty-state {
    border-radius: 14px;
    border: 1.5px dashed #CBD5E1;
    background: #F8FAFC;
    padding: 44px 20px;
    text-align: center;
  }
  .empty-icon { color: #CBD5E1; margin-bottom: 14px; }
  .empty-title { font-size: 15px; font-weight: 800; color: #0F172A; margin-bottom: 6px; }
  .empty-desc { font-size: 13px; color: #64748B; line-height: 1.75; max-width: 340px; margin: 0 auto; }
  .empty-cta {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    margin-top: 18px;
    background: #2563EB;
    color: #fff;
    padding: 10px 22px;
    border-radius: 10px;
    font-size: 13px;
    font-weight: 700;
    text-decoration: none;
    font-family: var(--font-display, system-ui);
    transition: background 0.15s;
  }
  .empty-cta:hover { background: #1D4ED8; }

  /* Wrapper */
  .tabs-wrapper {
    background: #fff;
    border-radius: 20px;
    border: 1px solid #E2E8F0;
    overflow: hidden;
    box-shadow: 0 2px 8px rgba(0,0,0,0.04);
  }
  .tabs-content { padding: 18px 18px 20px; }

  /* ── Mobile (≤ 480px) ─────────────────────────────────────── */
  @media (max-width: 480px) {
    .tab-btn { padding: 12px 14px; font-size: 13px; gap: 5px; }
    .tabs-content { padding: 12px 12px 16px; }
    .app-card { padding: 13px 14px; border-radius: 12px; }
    .app-card-inner { flex-direction: column; gap: 10px; }
    .app-card-actions { flex-direction: row; align-items: center; width: 100%; }
    .app-card-link { flex: 1; justify-content: center; font-size: 12px; }
    .app-card-title { font-size: 14px; white-space: normal; }
    .app-card-meta { font-size: 12px; }
    .badge { font-size: 10px; padding: 2px 7px; }
    .empty-state { padding: 32px 16px; }
  }

  /* ── Small tablet (481–767px) ─────────────────────────────── */
  @media (min-width: 481px) and (max-width: 767px) {
    .app-card-inner { flex-direction: column; gap: 10px; }
    .app-card-actions { flex-direction: row; width: 100%; }
    .app-card-link { flex: 1; justify-content: center; }
    .tabs-content { padding: 14px 16px 18px; }
  }

  /* ── Tablet (768–1023px) ──────────────────────────────────── */
  @media (min-width: 768px) and (max-width: 1023px) {
    .app-card { padding: 15px 18px; }
    .tab-btn { padding: 13px 20px; }
  }

  /* ── Desktop (≥ 1024px) ───────────────────────────────────── */
  @media (min-width: 1024px) {
    .app-card-title { font-size: 15px; }
    .tabs-content { padding: 20px 22px 24px; }
    .cards-list { gap: 12px; }
  }
`;

/* ─── AppCard ────────────────────────────────────────────────────────────────── */
function AppCard({ app, isEvent }: { app: AppItem; isEvent: boolean }) {
  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG['applied'];
  const toneStyle = TONE_STYLES[cfg.tone];
  const job = app.job;

  return (
    <div className="app-card">
      <div className="app-card-inner">
        {/* ── Left body ── */}
        <div className="app-card-body">
          {/* Title row */}
          <div className="app-card-title-row">
            <h3 className="app-card-title">{job?.title ?? 'Job Removed'}</h3>

            {/* Status badge */}
            <span
              className="badge"
              style={{
                background: toneStyle.bg,
                color: toneStyle.color,
                borderColor: toneStyle.border,
              }}
            >
              {cfg.icon} {cfg.label}
            </span>

            {/* Fit score */}
            {typeof app.fitScore === 'number' &&
              !isEvent &&
              (() => {
                const fc = getFitColor(app.fitScore);
                return (
                  <span
                    className="badge"
                    style={{ background: fc.bg, color: fc.color, borderColor: fc.border }}
                  >
                    {app.fitScore}% fit
                  </span>
                );
              })()}
          </div>

          {/* Meta line */}
          <div className="app-card-meta">
            {job?.companyName && <span>{job.companyName}</span>}
            {job?.city && (
              <>
                <span className="app-card-meta-dot">·</span>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                  <MapPin size={11} /> {job.city}
                </span>
              </>
            )}
            {job?.locationType && (
              <>
                <span className="app-card-meta-dot">·</span>
                <span>{formatStatusLabel(job.locationType)}</span>
              </>
            )}
            <span
              className="app-card-date"
              style={{ display: 'inline-flex', alignItems: 'center', gap: 3 }}
            >
              <Clock size={10} />
              {isEvent ? 'Registered' : 'Applied'} {formatShortDate(app.appliedAt)}
            </span>
          </div>

          {/* Event deadline */}
          {isEvent && job?.applicationDeadline && (
            <div
              style={{
                marginTop: 7,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                color: '#7C3AED',
                fontSize: 12,
                fontWeight: 600,
                background: '#F5F3FF',
                border: '1px solid #DDD6FE',
                padding: '3px 9px',
                borderRadius: 999,
              }}
            >
              <CalendarDays size={11} /> Event deadline: {formatShortDate(job.applicationDeadline)}
            </div>
          )}

          {/* Cover letter preview */}
          {app.coverLetter && !isEvent && (
            <div className="app-card-cover">
              &ldquo;{app.coverLetter.slice(0, 180)}
              {app.coverLetter.length > 180 ? '…' : ''}&rdquo;
            </div>
          )}

          {/* Status history */}
          {app.statusHistory && app.statusHistory.length > 1 && (
            <div className="app-card-history">
              {app.statusHistory.slice(-3).map((h, i, arr) => (
                <span key={i} className="app-card-history-step">
                  {formatStatusLabel(h.status)}{' '}
                  <span style={{ opacity: 0.6 }}>({formatShortDate(h.changedAt)})</span>
                  {i < arr.length - 1 && <span style={{ marginLeft: 4 }}>→</span>}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* ── Right actions ── */}
        <div className="app-card-actions">
          {job?._id && (
            <Link href={`/student/jobs/${job._id}`} className="app-card-link">
              View {isEvent ? 'Event' : 'Job'} <ChevronRight size={13} />
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

/* ─── Main export ────────────────────────────────────────────────────────────── */
export default function ApplicationsTabs({
  applications,
  events,
}: {
  applications: AppItem[];
  events: AppItem[];
}) {
  const [activeTab, setActiveTab] = useState<'applications' | 'events'>('applications');

  const tabs = [
    {
      key: 'applications' as const,
      label: 'Job Applications',
      icon: <BriefcaseBusiness size={15} />,
      count: applications.length,
    },
    {
      key: 'events' as const,
      label: 'Events & Webinars',
      icon: <CalendarDays size={15} />,
      count: events.length,
    },
  ];

  const activeItems = activeTab === 'applications' ? applications : events;
  const isEvent = activeTab === 'events';

  return (
    <>
      {/* Inject responsive styles once */}
      <style>{RESPONSIVE_STYLES}</style>

      <div className="tabs-wrapper">
        {/* Tab bar */}
        <div className="tabs-bar" role="tablist">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              role="tab"
              aria-selected={activeTab === tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`tab-btn${activeTab === tab.key ? 'active' : ''}`}
            >
              <span
                style={{ color: activeTab === tab.key ? '#2563EB' : '#94A3B8', display: 'flex' }}
              >
                {tab.icon}
              </span>
              {tab.label}
              <span
                className="badge"
                style={{
                  background: activeTab === tab.key ? '#EFF6FF' : '#F1F5F9',
                  color: activeTab === tab.key ? '#2563EB' : '#64748B',
                  borderColor: activeTab === tab.key ? '#BFDBFE' : '#E2E8F0',
                }}
              >
                {tab.count}
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="tabs-content" role="tabpanel">
          {activeItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">
                {isEvent ? <CalendarDays size={40} /> : <BriefcaseBusiness size={40} />}
              </div>
              <div className="empty-title">
                {isEvent ? 'No events registered yet' : 'No applications yet'}
              </div>
              <p className="empty-desc">
                {isEvent
                  ? 'Register for webinars and workshops from the job feed to see them here.'
                  : 'Apply to jobs and internships from the job feed to track them here.'}
              </p>
              <Link href="/student/jobs" className="empty-cta">
                Browse {isEvent ? 'Events' : 'Jobs'} <ChevronRight size={14} />
              </Link>
            </div>
          ) : (
            <div className="cards-list">
              {activeItems.map((app) => (
                <AppCard key={app._id} app={app} isEvent={isEvent} />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
