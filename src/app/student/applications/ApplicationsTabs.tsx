'use client';
// src/app/student/applications/ApplicationsTabs.tsx
// Tabbed view — Applications tab + Events tab

import { useState } from 'react';
import Link from 'next/link';
import { BriefcaseBusiness, CalendarDays } from 'lucide-react';

const STATUS_CONFIG: Record<
  string,
  { label: string; tone: 'info' | 'success' | 'warning' | 'neutral'; icon: string }
> = {
  applied: { label: 'Applied', tone: 'info', icon: '📤' },
  under_review: { label: 'Under Review', tone: 'warning', icon: '👀' },
  shortlisted: { label: 'Shortlisted', tone: 'info', icon: '⭐' },
  assessment_sent: { label: 'Assessment Sent', tone: 'info', icon: '📝' },
  interview_scheduled: { label: 'Interview Scheduled', tone: 'info', icon: '🗓' },
  hired: { label: 'Hired', tone: 'success', icon: '🎉' },
  rejected: { label: 'Not Selected', tone: 'warning', icon: '❌' },
  withdrawn: { label: 'Withdrawn', tone: 'neutral', icon: '↩' },
};

const TONE_STYLES = {
  info: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  success: { bg: '#ECFDF5', color: '#065F46', border: '#A7F3D0' },
  warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
  neutral: { bg: '#F8FAFC', color: '#64748B', border: '#E2E8F0' },
};

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

function AppCard({ app, isEvent }: { app: AppItem; isEvent: boolean }) {
  const cfg = STATUS_CONFIG[app.status] ?? STATUS_CONFIG['applied'];
  const toneStyle = TONE_STYLES[cfg.tone];
  const job = app.job;

  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        border: '1px solid #E2E8F0',
        padding: '18px 22px',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s',
      }}
      onMouseOver={(e) => (e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,0,0,0.08)')}
      onMouseOut={(e) => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.04)')}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 14,
          flexWrap: 'wrap',
        }}
      >
        <div style={{ flex: 1, minWidth: 200 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              flexWrap: 'wrap',
              marginBottom: 5,
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                margin: 0,
              }}
            >
              {job?.title ?? 'Job Removed'}
            </h3>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: toneStyle.bg,
                color: toneStyle.color,
                border: `1px solid ${toneStyle.border}`,
                padding: '3px 10px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {cfg.icon} {cfg.label}
            </span>
            {typeof app.fitScore === 'number' && !isEvent && (
              <span
                style={{
                  background:
                    app.fitScore >= 70 ? '#ECFDF5' : app.fitScore >= 40 ? '#EFF6FF' : '#FFFBEB',
                  color:
                    app.fitScore >= 70 ? '#065F46' : app.fitScore >= 40 ? '#2563EB' : '#92400E',
                  border: `1px solid ${app.fitScore >= 70 ? '#A7F3D0' : app.fitScore >= 40 ? '#BFDBFE' : '#FDE68A'}`,
                  padding: '3px 10px',
                  borderRadius: 999,
                  fontSize: 11,
                  fontWeight: 700,
                }}
              >
                {app.fitScore}% fit
              </span>
            )}
          </div>
          <div style={{ color: '#64748B', fontSize: 13 }}>
            {job?.companyName}
            {job?.city && ` · ${job.city}`}
            {job?.locationType && ` · ${formatStatusLabel(job.locationType)}`}
            <span style={{ color: '#94A3B8', marginLeft: 8 }}>
              {isEvent ? 'Registered' : 'Applied'} {formatShortDate(app.appliedAt)}
            </span>
          </div>

          {isEvent && job?.applicationDeadline && (
            <div
              style={{
                marginTop: 6,
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#7C3AED',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CalendarDays size={13} /> Event deadline: {formatShortDate(job.applicationDeadline)}
            </div>
          )}

          {app.coverLetter && !isEvent && (
            <div
              style={{
                background: '#F8FAFC',
                borderRadius: 8,
                padding: '7px 11px',
                marginTop: 10,
                fontSize: 12,
                color: '#64748B',
                fontStyle: 'italic',
                borderLeft: '2px solid #E2E8F0',
              }}
            >
              &quot;{app.coverLetter.slice(0, 160)}
              {app.coverLetter.length > 160 ? '...' : ''}&quot;
            </div>
          )}

          {app.statusHistory && app.statusHistory.length > 1 && (
            <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {app.statusHistory.slice(-3).map((h, i) => (
                <span key={i} style={{ fontSize: 11, color: '#94A3B8' }}>
                  {formatStatusLabel(h.status)} ({formatShortDate(h.changedAt)})
                  {i < Math.min(app.statusHistory.length, 3) - 1 && ' →'}
                </span>
              ))}
            </div>
          )}
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            alignItems: 'flex-end',
            flexShrink: 0,
          }}
        >
          {job?._id && (
            <Link
              href={`/student/jobs/${job._id}`}
              style={{ color: '#2563EB', fontSize: 13, fontWeight: 600, textDecoration: 'none' }}
            >
              View {isEvent ? 'Event' : 'Job'} →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

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
    <div
      style={{
        background: '#fff',
        borderRadius: 20,
        border: '1px solid #E2E8F0',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
      }}
    >
      {/* Tab bar */}
      <div style={{ display: 'flex', borderBottom: '1px solid #E2E8F0', background: '#FAFBFC' }}>
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '16px 24px',
              border: 'none',
              background: 'none',
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: activeTab === tab.key ? 700 : 500,
              color: activeTab === tab.key ? '#2563EB' : '#64748B',
              borderBottom: `2px solid ${activeTab === tab.key ? '#2563EB' : 'transparent'}`,
              transition: 'all 0.15s',
              fontFamily: 'var(--font-body)',
            }}
          >
            <span style={{ color: activeTab === tab.key ? '#2563EB' : '#94A3B8' }}>{tab.icon}</span>
            {tab.label}
            <span
              style={{
                background: activeTab === tab.key ? '#EFF6FF' : '#F1F5F9',
                color: activeTab === tab.key ? '#2563EB' : '#64748B',
                border: `1px solid ${activeTab === tab.key ? '#BFDBFE' : '#E2E8F0'}`,
                padding: '2px 8px',
                borderRadius: 999,
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* Content */}
      <div style={{ padding: '20px 22px' }}>
        {activeItems.length === 0 ? (
          <div
            style={{
              borderRadius: 14,
              border: '1px dashed #CBD5E1',
              background: '#F8FAFC',
              padding: '40px 20px',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 12 }}>{isEvent ? '📅' : '📭'}</div>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#0F172A', marginBottom: 6 }}>
              {isEvent ? 'No events registered yet' : 'No applications yet'}
            </div>
            <div style={{ fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
              {isEvent
                ? 'Register for webinars and workshops from the job feed to see them here.'
                : 'Apply to jobs and internships from the job feed to track them here.'}
            </div>
            {/* ✅ Fixed: <a> → <Link> for internal navigation */}
            <Link
              href="/student/jobs"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 7,
                marginTop: 16,
                background: '#2563EB',
                color: '#fff',
                padding: '10px 20px',
                borderRadius: 10,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
              }}
            >
              Browse {isEvent ? 'Events' : 'Jobs'} →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {activeItems.map((app) => (
              <AppCard key={app._id} app={app} isEvent={isEvent} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
