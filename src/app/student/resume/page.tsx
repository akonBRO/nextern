'use client';
// src/app/student/resume/page.tsx
// REDESIGNED — same logic, professional UI, consolidated action buttons

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileText,
  Save,
  ExternalLink,
  User,
  GraduationCap,
  Code2,
  Award,
  Briefcase,
  BookOpen,
  Globe,
  Loader2,
  RefreshCw,
  Eye,
  X,
  Linkedin,
  Github,
  MapPin,
  Mail,
  Phone,
  Layers,
  CalendarDays,
  ChevronRight,
  Sparkles,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#EFF6FF',
  blueBorder: '#BFDBFE',
  teal: '#0D9488',
  tealDark: '#0F766E',
  tealBg: '#F0FDFA',
  tealBorder: '#99F6E4',
  indigo: '#1E293B',
  indigoDeep: '#0F172A',
  bg: '#F8FAFC',
  card: '#FFFFFF',
  border: '#E2E8F0',
  borderStrong: '#CBD5E1',
  text: '#0F172A',
  textMid: '#334155',
  textMuted: '#64748B',
  textLight: '#94A3B8',
  success: '#10B981',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  warning: '#F59E0B',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  white: '#FFFFFF',
};

// ── Types ──────────────────────────────────────────────────────────────────
type Profile = {
  name: string;
  email: string;
  phone?: string;
  city?: string;
  bio?: string;
  image?: string;
  university?: string;
  department?: string;
  yearOfStudy?: number;
  currentSemester?: string;
  cgpa?: number;
  studentId?: string;
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  skills: string[];
  completedCourses: string[];
  opportunityScore: number;
  profileCompleteness: number;
  resumeUrl?: string;
  generatedResumeUrl?: string;
  verifiedPortfolioItems: {
    title: string;
    category: string;
    fileUrl: string;
    fileUrls?: string[];
    summary?: string;
    skills?: string[];
    clientName?: string;
    rating?: number;
    completedAt?: string;
    freelanceOrderId?: string;
  }[];
  projects: {
    title: string;
    description: string;
    techStack: string[];
    projectUrl?: string;
    repoUrl?: string;
  }[];
  certifications: { name: string; issuedBy: string; issueDate?: string; credentialUrl?: string }[];
};

type JobApp = {
  _id: string;
  status: string;
  appliedAt: string | null;
  fitScore: number | null;
  coverLetter?: string | null;
  job: {
    _id: string;
    title: string;
    type: string;
    companyName: string;
    city?: string | null;
    locationType: string;
    applicationDeadline?: string | null;
    stipendBDT?: number | null;
    durationMonths?: number | null;
    requiredSkills: string[];
  } | null;
};

type EventReg = {
  _id: string;
  status: string;
  appliedAt: string | null;
  job: {
    _id: string;
    title: string;
    type: string;
    companyName: string;
    applicationDeadline?: string | null;
  } | null;
};

// ── Tiny helpers ───────────────────────────────────────────────────────────
function fmtDate(d?: string | null) {
  if (!d) return '';
  const dt = new Date(d);
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function jobTypeLabel(t: string) {
  const m: Record<string, string> = {
    internship: 'Internship',
    'part-time': 'Part-time',
    'full-time': 'Full-time',
    'campus-drive': 'Campus Drive',
    webinar: 'Webinar',
    workshop: 'Workshop',
  };
  return m[t] ?? t;
}

function categoryLabel(value?: string) {
  if (!value) return 'Verified work';
  const map: Record<string, string> = {
    'web-dev': 'Web Development',
    'graphic-design': 'Graphic Design',
    'content-writing': 'Content Writing',
    'data-analysis': 'Data Analysis',
    'video-editing': 'Video Editing',
    other: 'Verified Work',
  };
  return map[value] ?? value.replace(/-/g, ' ').replace(/\b\w/g, (char) => char.toUpperCase());
}

const STATUS_COLOR: Record<string, string> = {
  hired: C.success,
  shortlisted: C.blue,
  interview_scheduled: C.blue,
  under_review: C.warning,
  applied: C.textMuted,
  rejected: C.danger,
  withdrawn: C.textLight,
};

const STATUS_LABEL: Record<string, string> = {
  applied: 'Applied',
  under_review: 'Under Review',
  shortlisted: 'Shortlisted',
  assessment_sent: 'Assessment Sent',
  interview_scheduled: 'Interview Scheduled',
  hired: 'Hired',
  rejected: 'Not Selected',
  withdrawn: 'Withdrawn',
};

// ── Sidebar sub-components ─────────────────────────────────────────────────
const SBSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        fontSize: 7.5,
        fontWeight: 800,
        letterSpacing: 2,
        color: 'rgba(147,197,253,0.8)',
        textTransform: 'uppercase',
        marginBottom: 8,
        paddingBottom: 5,
        borderBottom: '1px solid rgba(255,255,255,0.07)',
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const SBRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ marginBottom: 9 }}>
    <div
      style={{
        fontSize: 6.5,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.28)',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 8.5, color: '#CBD5E1', lineHeight: 1.45 }}>{value}</div>
  </div>
);

const Section = ({ title, color = C.teal }: { title: string; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12, marginTop: 4 }}>
    <div style={{ width: 3, height: 14, background: color, borderRadius: 99, flexShrink: 0 }} />
    <div
      style={{
        fontSize: 8.5,
        fontWeight: 800,
        color,
        letterSpacing: 1.3,
        textTransform: 'uppercase',
      }}
    >
      {title}
    </div>
    <div style={{ flex: 1, height: 1, background: 'rgba(226,232,240,0.6)', marginLeft: 4 }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// RESUME PREVIEW MODAL — logic unchanged
// ─────────────────────────────────────────────────────────────────────────
function ResumePreviewModal({
  profile,
  jobApps,
  events,
  onClose,
}: {
  profile: Profile;
  jobApps: JobApp[];
  events: EventReg[];
  onClose: () => void;
}) {
  const hasActivity = jobApps.length > 0 || events.length > 0;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(9,14,30,0.82)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '28px 16px',
        overflowY: 'auto',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 840,
          background: C.white,
          borderRadius: 22,
          boxShadow: '0 48px 120px rgba(0,0,0,0.5)',
          overflow: 'hidden',
          fontFamily: 'Georgia, "Times New Roman", serif',
          border: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        {/* Modal top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 22px',
            background: C.indigoDeep,
            borderBottom: '1px solid rgba(255,255,255,0.06)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                background: 'rgba(13,148,136,0.2)',
                border: '1px solid rgba(13,148,136,0.3)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <FileText size={13} color={C.teal} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>
              In-Platform Resume
            </span>
            <span style={{ fontSize: 11, color: C.textLight, marginLeft: 2 }}>
              — {profile.name}
            </span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#94A3B8',
              transition: 'all 0.15s',
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: 'flex', minHeight: 900 }}>
          {/* SIDEBAR */}
          <div style={{ width: 200, flexShrink: 0, background: '#0B1120', padding: '26px 18px' }}>
            <div
              style={{
                width: 74,
                height: 74,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #0D9488)',
                margin: '0 auto 18px',
                overflow: 'hidden',
                border: '2.5px solid rgba(255,255,255,0.1)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 28,
                fontWeight: 900,
                color: '#fff',
                fontFamily: 'var(--font-display)',
              }}
            >
              {profile.image ? (
                <Image
                  src={profile.image}
                  alt={profile.name}
                  width={74}
                  height={74}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                (profile.name?.charAt(0)?.toUpperCase() ?? 'U')
              )}
            </div>

            <SBSection title="Contact">
              {profile.email && <SBRow label="Email" value={profile.email} />}
              {profile.phone && <SBRow label="Phone" value={profile.phone} />}
              {profile.city && <SBRow label="City" value={profile.city} />}
            </SBSection>

            {(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl) && (
              <SBSection title="Links">
                {profile.linkedinUrl && (
                  <SBRow
                    label="LinkedIn"
                    value={profile.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  />
                )}
                {profile.githubUrl && (
                  <SBRow
                    label="GitHub"
                    value={profile.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  />
                )}
                {profile.portfolioUrl && (
                  <SBRow
                    label="Portfolio"
                    value={profile.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}
                  />
                )}
              </SBSection>
            )}

            <SBSection title="Education">
              {profile.university && (
                <div style={{ fontSize: 9, fontWeight: 700, color: '#F1F5F9', marginBottom: 3 }}>
                  {profile.university}
                </div>
              )}
              {profile.department && (
                <div style={{ fontSize: 8.5, color: '#CBD5E1', marginBottom: 3 }}>
                  {profile.department}
                </div>
              )}
              {(profile.yearOfStudy || profile.currentSemester) && (
                <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.38)', marginBottom: 7 }}>
                  {[
                    profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : '',
                    profile.currentSemester,
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </div>
              )}
              {profile.cgpa != null && (
                <div
                  style={{
                    background: 'rgba(37,99,235,0.8)',
                    borderRadius: 6,
                    padding: '5px 10px',
                    fontSize: 9,
                    fontWeight: 800,
                    color: '#fff',
                    textAlign: 'center',
                    marginBottom: 4,
                  }}
                >
                  CGPA {profile.cgpa.toFixed(2)} / 4.00
                </div>
              )}
            </SBSection>

            {profile.skills.length > 0 && (
              <SBSection title="Skills">
                {profile.skills.map((s) => (
                  <div
                    key={s}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 5 }}
                  >
                    <div
                      style={{
                        width: 4,
                        height: 4,
                        borderRadius: '50%',
                        background: C.teal,
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 8.5, color: '#CBD5E1' }}>{s}</span>
                  </div>
                ))}
              </SBSection>
            )}

            {profile.completedCourses.length > 0 && (
              <SBSection title="Completed Courses">
                {profile.completedCourses.map((c) => (
                  <div
                    key={c}
                    style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}
                  >
                    <div
                      style={{
                        width: 3,
                        height: 3,
                        borderRadius: '50%',
                        background: '#475569',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 8, color: '#94A3B8' }}>{c}</span>
                  </div>
                ))}
              </SBSection>
            )}

            {profile.opportunityScore > 0 && (
              <SBSection title="Nextern Score">
                <div
                  style={{
                    height: 6,
                    background: 'rgba(255,255,255,0.08)',
                    borderRadius: 999,
                    overflow: 'hidden',
                    marginBottom: 5,
                  }}
                >
                  <div
                    style={{
                      width: `${profile.opportunityScore}%`,
                      height: '100%',
                      borderRadius: 999,
                      background: profile.opportunityScore >= 70 ? C.success : C.blue,
                    }}
                  />
                </div>
                <div style={{ fontSize: 9, fontWeight: 700, color: '#E2E8F0' }}>
                  {profile.opportunityScore} / 100
                </div>
              </SBSection>
            )}
          </div>

          {/* MAIN CONTENT */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                background: 'linear-gradient(135deg, #0F172A, #1E293B)',
                padding: '26px 30px 22px',
                borderBottom: `3px solid ${C.blue}`,
                position: 'relative',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  position: 'absolute',
                  top: 0,
                  right: 0,
                  width: 130,
                  height: 130,
                  background: 'radial-gradient(circle, rgba(37,99,235,0.14) 0%, transparent 70%)',
                  borderRadius: '50%',
                }}
              />
              <h1
                style={{
                  fontSize: 23,
                  fontWeight: 900,
                  color: '#F8FAFC',
                  fontFamily: 'var(--font-display)',
                  margin: 0,
                  letterSpacing: '-0.3px',
                }}
              >
                {profile.name}
              </h1>
              {(profile.department || profile.university) && (
                <div
                  style={{
                    fontSize: 10.5,
                    color: '#93C5FD',
                    marginTop: 4,
                    fontFamily: 'var(--font-body)',
                  }}
                >
                  {[profile.department, profile.university].filter(Boolean).join('  ·  ')}
                </div>
              )}
              <div
                style={{
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 12,
                  marginTop: 10,
                  fontFamily: 'var(--font-body)',
                }}
              >
                {profile.email && (
                  <span
                    style={{
                      fontSize: 8.5,
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Mail size={10} />
                    {profile.email}
                  </span>
                )}
                {profile.phone && (
                  <span
                    style={{
                      fontSize: 8.5,
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Phone size={10} />
                    {profile.phone}
                  </span>
                )}
                {profile.city && (
                  <span
                    style={{
                      fontSize: 8.5,
                      color: '#94A3B8',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <MapPin size={10} />
                    {profile.city}
                  </span>
                )}
                {profile.linkedinUrl && (
                  <span
                    style={{
                      fontSize: 8.5,
                      color: '#93C5FD',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Linkedin size={10} />
                    LinkedIn
                  </span>
                )}
                {profile.githubUrl && (
                  <span
                    style={{
                      fontSize: 8.5,
                      color: '#93C5FD',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                    }}
                  >
                    <Github size={10} />
                    GitHub
                  </span>
                )}
              </div>
            </div>

            <div style={{ padding: '22px 30px', fontFamily: 'var(--font-body)' }}>
              {profile.bio && (
                <div style={{ marginBottom: 20 }}>
                  <Section title="Professional Summary" />
                  <p style={{ fontSize: 9.5, color: C.textMid, lineHeight: 1.78, margin: 0 }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {profile.projects.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <Section title="Projects" />
                  {profile.projects.map((proj, i) => (
                    <div
                      key={i}
                      style={{
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom:
                          i < profile.projects.length - 1 ? `1px solid ${C.border}` : 'none',
                      }}
                    >
                      <div
                        style={{ fontSize: 10.5, fontWeight: 800, color: C.text, marginBottom: 3 }}
                      >
                        {proj.title}
                      </div>
                      {proj.techStack?.length > 0 && (
                        <div
                          style={{ fontSize: 8, color: C.teal, marginBottom: 4, fontWeight: 600 }}
                        >
                          {proj.techStack.join('  ·  ')}
                        </div>
                      )}
                      {proj.description && (
                        <div
                          style={{
                            fontSize: 9,
                            color: C.textMuted,
                            lineHeight: 1.65,
                            marginBottom: 4,
                          }}
                        >
                          {proj.description}
                        </div>
                      )}
                      <div style={{ display: 'flex', gap: 10 }}>
                        {proj.projectUrl && (
                          <a
                            href={proj.projectUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 8,
                              color: C.blue,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            Live →
                          </a>
                        )}
                        {proj.repoUrl && (
                          <a
                            href={proj.repoUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 8,
                              color: C.textMuted,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            Repo →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {profile.verifiedPortfolioItems.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <Section title="Verified Freelance Work" color={C.blue} />
                  {profile.verifiedPortfolioItems.map((item, index) => (
                    <div
                      key={`${item.freelanceOrderId ?? item.fileUrl}:${index}`}
                      style={{
                        marginBottom: 12,
                        paddingBottom: 12,
                        borderBottom:
                          index < profile.verifiedPortfolioItems.length - 1
                            ? `1px solid ${C.border}`
                            : 'none',
                      }}
                    >
                      <div
                        style={{ fontSize: 10.5, fontWeight: 800, color: C.text, marginBottom: 3 }}
                      >
                        {item.title}
                      </div>
                      <div style={{ fontSize: 8, color: C.blue, marginBottom: 4, fontWeight: 700 }}>
                        {categoryLabel(item.category)}
                        {item.clientName ? `  |  Client: ${item.clientName}` : ''}
                        {typeof item.rating === 'number'
                          ? `  |  Rating: ${item.rating.toFixed(1)}`
                          : ''}
                      </div>
                      {item.summary ? (
                        <div
                          style={{
                            fontSize: 9,
                            color: C.textMuted,
                            lineHeight: 1.65,
                            marginBottom: 4,
                          }}
                        >
                          {item.summary}
                        </div>
                      ) : null}
                      {item.skills?.length ? (
                        <div
                          style={{ fontSize: 8, color: C.teal, marginBottom: 4, fontWeight: 600 }}
                        >
                          {item.skills.join('  |  ')}
                        </div>
                      ) : null}
                    </div>
                  ))}
                </div>
              )}

              {profile.certifications.length > 0 && (
                <div style={{ marginBottom: 20 }}>
                  <Section title="Certifications" />
                  {profile.certifications.map((cert, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        gap: 10,
                        marginBottom: 10,
                      }}
                    >
                      <div
                        style={{
                          width: 7,
                          height: 7,
                          borderRadius: '50%',
                          background: C.blue,
                          marginTop: 4,
                          flexShrink: 0,
                        }}
                      />
                      <div>
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.text }}>
                          {cert.name}
                        </div>
                        <div style={{ fontSize: 8, color: C.textLight }}>
                          {cert.issuedBy}
                          {cert.issueDate ? ` · ${fmtDate(cert.issueDate)}` : ''}
                        </div>
                        {cert.credentialUrl && (
                          <a
                            href={cert.credentialUrl}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              fontSize: 7.5,
                              color: C.blue,
                              fontWeight: 600,
                              textDecoration: 'none',
                            }}
                          >
                            View credential →
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {hasActivity && (
                <div
                  style={{
                    background: C.blueLight,
                    border: `1px solid ${C.blueBorder}`,
                    borderRadius: 12,
                    padding: '16px 18px',
                    marginBottom: 20,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 7,
                      marginBottom: 14,
                      paddingBottom: 10,
                      borderBottom: `1px solid ${C.blueBorder}`,
                    }}
                  >
                    <Layers size={13} color={C.blue} />
                    <span
                      style={{
                        fontSize: 8.5,
                        fontWeight: 800,
                        color: C.blue,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      Nextern Platform Activity
                    </span>
                  </div>
                  {jobApps.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: C.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          marginBottom: 8,
                        }}
                      >
                        Job Applications ({jobApps.length})
                      </div>
                      {jobApps.map(
                        (app) =>
                          app.job && (
                            <div
                              key={app._id}
                              style={{
                                display: 'flex',
                                alignItems: 'flex-start',
                                gap: 10,
                                padding: '8px 12px',
                                background: C.white,
                                borderRadius: 8,
                                border: `1px solid ${C.border}`,
                                marginBottom: 6,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 9.5,
                                    fontWeight: 800,
                                    color: C.text,
                                    marginBottom: 1,
                                  }}
                                >
                                  {app.job.title}
                                </div>
                                <div style={{ fontSize: 8, color: C.textMuted }}>
                                  {app.job.companyName} · {jobTypeLabel(app.job.type)}
                                  {app.job.city ? `  ·  ${app.job.city}` : ''}
                                  {app.appliedAt ? `  ·  Applied ${fmtDate(app.appliedAt)}` : ''}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: 3,
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 8,
                                    fontWeight: 700,
                                    color: STATUS_COLOR[app.status] ?? C.textMuted,
                                    background: `${STATUS_COLOR[app.status]}18`,
                                    border: `1px solid ${STATUS_COLOR[app.status]}30`,
                                    padding: '2px 7px',
                                    borderRadius: 999,
                                  }}
                                >
                                  {STATUS_LABEL[app.status] ?? app.status}
                                </span>
                                {app.fitScore != null && (
                                  <span style={{ fontSize: 7.5, fontWeight: 700, color: C.teal }}>
                                    {app.fitScore}% fit
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  )}
                  {events.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: C.textMuted,
                          textTransform: 'uppercase',
                          letterSpacing: 0.8,
                          marginBottom: 8,
                        }}
                      >
                        Events & Webinars ({events.length})
                      </div>
                      {events.map(
                        (evt) =>
                          evt.job && (
                            <div
                              key={evt._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 10,
                                padding: '7px 12px',
                                background: C.white,
                                borderRadius: 8,
                                border: `1px solid ${C.tealBorder}`,
                                marginBottom: 6,
                              }}
                            >
                              <div
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: C.teal,
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 9.5, fontWeight: 700, color: C.text }}>
                                  {evt.job.title}
                                </div>
                                <div style={{ fontSize: 8, color: C.textMuted }}>
                                  {evt.job.companyName} · {jobTypeLabel(evt.job.type)}
                                  {evt.appliedAt ? `  ·  ${fmtDate(evt.appliedAt)}` : ''}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: 8,
                                  fontWeight: 700,
                                  color: C.teal,
                                  background: C.tealBg,
                                  border: `1px solid ${C.tealBorder}`,
                                  padding: '2px 7px',
                                  borderRadius: 999,
                                }}
                              >
                                Registered
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  )}
                </div>
              )}

              <div
                style={{
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 12,
                  marginTop: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                <div style={{ fontSize: 7.5, color: C.textLight }}>
                  Generated by Nextern · nextern-virid.vercel.app
                </div>
                <div style={{ fontSize: 7.5, color: C.textLight }}>
                  {new Date().toLocaleDateString('en-US', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// SECTION CARD
// ─────────────────────────────────────────────────────────────────────────
function SectionCard({
  icon,
  title,
  filled,
  children,
}: {
  icon: React.ReactNode;
  title: string;
  filled: boolean;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: C.card,
        borderRadius: 14,
        border: `1px solid ${filled ? C.successBorder : C.border}`,
        overflow: 'hidden',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        transition: 'box-shadow 0.15s',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 18px',
          borderBottom: `1px solid ${C.border}`,
          background: filled ? C.successBg : '#FAFBFC',
        }}
      >
        <div style={{ color: filled ? C.success : C.textMuted, display: 'flex' }}>{icon}</div>
        <div style={{ fontSize: 13.5, fontWeight: 700, color: C.text, flex: 1 }}>{title}</div>
        {filled ? (
          <span
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 4,
              fontSize: 11,
              fontWeight: 600,
              color: C.success,
            }}
          >
            <CheckCircle2 size={13} /> Complete
          </span>
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: C.textLight,
              background: '#F1F5F9',
              border: `1px solid ${C.border}`,
              padding: '2px 8px',
              borderRadius: 6,
            }}
          >
            Empty
          </span>
        )}
      </div>
      <div style={{ padding: '14px 18px' }}>{children}</div>
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return (
    <div style={{ fontSize: 13, color: C.textLight, fontStyle: 'italic', padding: '4px 0' }}>
      {text}
    </div>
  );
}

function Chip({
  label,
  color = C.blue,
  bg = C.blueLight,
  border = C.blueBorder,
}: {
  label: string;
  color?: string;
  bg?: string;
  border?: string;
}) {
  return (
    <span
      style={{
        display: 'inline-block',
        background: bg,
        color,
        border: `1px solid ${border}`,
        padding: '3px 10px',
        borderRadius: 6,
        fontSize: 12,
        fontWeight: 600,
        marginRight: 5,
        marginBottom: 5,
      }}
    >
      {label}
    </span>
  );
}

function ReadinessBar({ pct, label }: { pct: number; label: string }) {
  const color = pct >= 80 ? C.success : pct >= 50 ? C.blue : C.warning;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: C.textMuted, fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
      </div>
      <div style={{ height: 6, background: '#EEF2F7', borderRadius: 999, overflow: 'hidden' }}>
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
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────
export default function StudentResumePage() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [jobApps, setJobApps] = useState<JobApp[]>([]);
  const [events, setEvents] = useState<EventReg[]>([]);
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  // generatedResumeUploader saves to User.generatedResumeUrl (NOT resumeUrl)
  const { startUpload } = useUploadThing('generatedResumeUploader');

  useEffect(() => {
    Promise.all([
      fetch('/api/users/profile').then((r) => r.json()),
      fetch('/api/resume/platform-activity').then((r) => r.json()),
    ])
      .then(([profileData, activityData]) => {
        const user = profileData?.user
          ? {
              ...profileData.user,
              skills: profileData.user.skills ?? [],
              completedCourses: profileData.user.completedCourses ?? [],
              projects: profileData.user.projects ?? [],
              certifications: profileData.user.certifications ?? [],
              verifiedPortfolioItems: profileData.user.verifiedPortfolioItems ?? [],
            }
          : null;
        setProfile(user);
        setJobApps(activityData.jobApplications ?? []);
        setEvents(activityData.eventRegistrations ?? []);
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setFetching(false));
  }, []);

  async function handleDownload() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/resume/generate');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed');
        return;
      }
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${(profile?.name ?? 'Resume').replace(/\s+/g, '_')}_Resume.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      setError('Failed to generate resume. Please try again.');
    } finally {
      setGenerating(false);
    }
  }

  async function handleSaveToProfile() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/resume/generate');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed');
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], 'generated_resume.pdf', { type: 'application/pdf' });
      const uploaded = await startUpload([file]);
      if (!uploaded?.[0]?.ufsUrl) {
        setError('Upload failed. Please try again.');
        return;
      }
      setProfile((prev) => (prev ? { ...prev, generatedResumeUrl: uploaded[0].ufsUrl } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 4000);
    } catch {
      setError('Failed to save resume. Please try again.');
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
          color: C.textMuted,
        }}
      >
        <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite', marginRight: 10 }} />
        Loading your resume builder…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.bg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 32, marginBottom: 10 }}>⚠️</div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>Profile not found</div>
          <Link
            href="/student/dashboard"
            style={{ color: C.blue, fontSize: 14, marginTop: 8, display: 'block' }}
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const sections = [
    { key: 'bio', label: 'Summary', filled: !!profile.bio },
    { key: 'acad', label: 'Academic Info', filled: !!(profile.university && profile.cgpa) },
    { key: 'skills', label: 'Skills', filled: profile.skills.length > 0 },
    { key: 'projs', label: 'Projects', filled: profile.projects.length > 0 },
    {
      key: 'verified-work',
      label: 'Verified Work',
      filled: profile.verifiedPortfolioItems.length > 0,
    },
    { key: 'certs', label: 'Certifications', filled: profile.certifications.length > 0 },
    { key: 'courses', label: 'Courses', filled: profile.completedCourses.length > 0 },
    {
      key: 'links',
      label: 'Online Presence',
      filled: !!(profile.linkedinUrl || profile.githubUrl),
    },
    {
      key: 'activity',
      label: 'Platform Activity',
      filled: jobApps.length > 0 || events.length > 0,
    },
  ];
  const filledCount = sections.filter((s) => s.filled).length;
  const resumeReadiness = Math.round((filledCount / sections.length) * 100);
  const btnDisabled = generating || saving;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* ── PAGE HEADER ── */}
      <div style={{ background: C.indigoDeep, borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '0 28px' }}>
          {/* Top nav strip */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              padding: '14px 0',
              borderBottom: '1px solid rgba(255,255,255,0.05)',
            }}
          >
            <Link
              href="/student/dashboard"
              style={{
                color: C.textLight,
                fontSize: 13,
                textDecoration: 'none',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
              }}
            >
              Dashboard
            </Link>
            <ChevronRight size={13} color={C.textLight} />
            <span style={{ color: '#F1F5F9', fontSize: 13, fontWeight: 600 }}>Resume Builder</span>
          </div>

          {/* Header content */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '22px 0',
              flexWrap: 'wrap',
              gap: 16,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'linear-gradient(135deg, #2563EB, #0D9488)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: '#fff',
                  flexShrink: 0,
                }}
              >
                <Sparkles size={20} />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 20,
                    fontWeight: 800,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                    letterSpacing: '-0.2px',
                  }}
                >
                  Resume Builder
                </h1>
                <p style={{ color: C.textLight, fontSize: 12.5, margin: '2px 0 0' }}>
                  Auto-generated from your profile — includes platform activity, applications &
                  events
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── BODY ── */}
      <div
        style={{
          maxWidth: 1080,
          margin: '28px auto',
          padding: '0 28px',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
        className="resume-layout"
      >
        {/* LEFT — section cards */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 12, minWidth: 0 }}>
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
                fontSize: 13,
              }}
            >
              <AlertCircle size={14} /> {error}
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
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              <CheckCircle2 size={14} /> Resume saved to your profile — viewable from your profile
              page.
            </div>
          )}

          {/* Personal */}
          <SectionCard
            icon={<User size={15} />}
            title="Personal Information"
            filled={!!profile.name}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginBottom: profile.bio ? 12 : 0,
              }}
            >
              {[
                { label: 'Name', value: profile.name },
                { label: 'Email', value: profile.email },
                { label: 'Phone', value: profile.phone },
                { label: 'City', value: profile.city },
              ].map(({ label, value }) =>
                value ? (
                  <div key={label}>
                    <div
                      style={{
                        fontSize: 10,
                        fontWeight: 700,
                        color: C.textLight,
                        textTransform: 'uppercase',
                        letterSpacing: 0.5,
                        marginBottom: 2,
                      }}
                    >
                      {label}
                    </div>
                    <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{value}</div>
                  </div>
                ) : null
              )}
            </div>
            {profile.bio ? (
              <div
                style={{
                  fontSize: 13,
                  color: C.textMuted,
                  lineHeight: 1.7,
                  borderTop: `1px solid ${C.border}`,
                  paddingTop: 10,
                }}
              >
                {profile.bio}
              </div>
            ) : (
              <Hint text="No bio added — add one in your profile for a professional summary section." />
            )}
          </SectionCard>

          {/* Academic */}
          <SectionCard
            icon={<GraduationCap size={15} />}
            title="Academic Information"
            filled={!!(profile.university && profile.cgpa)}
          >
            {profile.university || profile.department || profile.cgpa ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { label: 'University', value: profile.university },
                  { label: 'Department', value: profile.department },
                  {
                    label: 'CGPA',
                    value: profile.cgpa != null ? `${profile.cgpa.toFixed(2)} / 4.00` : undefined,
                  },
                  {
                    label: 'Year',
                    value: profile.yearOfStudy ? `Year ${profile.yearOfStudy}` : undefined,
                  },
                  { label: 'Semester', value: profile.currentSemester },
                  { label: 'Student ID', value: profile.studentId },
                ].map(({ label, value }) =>
                  value ? (
                    <div key={label}>
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 700,
                          color: C.textLight,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                          marginBottom: 2,
                        }}
                      >
                        {label}
                      </div>
                      <div style={{ fontSize: 13, color: C.text, fontWeight: 600 }}>{value}</div>
                    </div>
                  ) : null
                )}
              </div>
            ) : (
              <Hint text="No academic info — add university, department and CGPA in your profile." />
            )}
          </SectionCard>

          {/* Skills */}
          <SectionCard icon={<Code2 size={15} />} title="Skills" filled={profile.skills.length > 0}>
            {profile.skills.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {profile.skills.map((s) => (
                  <Chip key={s} label={s} color={C.teal} bg={C.tealBg} border={C.tealBorder} />
                ))}
              </div>
            ) : (
              <Hint text="No skills — skills drive job matching and appear prominently in your resume." />
            )}
          </SectionCard>

          {/* Projects */}
          <SectionCard
            icon={<Briefcase size={15} />}
            title="Projects"
            filled={profile.projects.length > 0}
          >
            {profile.projects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profile.projects.map((proj, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${C.teal}`, paddingLeft: 12 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{proj.title}</div>
                    {proj.techStack?.length > 0 && (
                      <div style={{ marginTop: 4, display: 'flex', flexWrap: 'wrap' }}>
                        {proj.techStack.map((t) => (
                          <Chip
                            key={t}
                            label={t}
                            color={C.blue}
                            bg={C.blueLight}
                            border={C.blueBorder}
                          />
                        ))}
                      </div>
                    )}
                    {proj.description && (
                      <div
                        style={{ marginTop: 6, fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}
                      >
                        {proj.description}
                      </div>
                    )}
                    <div style={{ marginTop: 6, display: 'flex', gap: 12 }}>
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            color: C.blue,
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <ExternalLink size={11} /> Live
                        </a>
                      )}
                      {proj.repoUrl && (
                        <a
                          href={proj.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            color: C.textMuted,
                            fontWeight: 600,
                            textDecoration: 'none',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <ExternalLink size={11} /> Repo
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Hint text="No projects — showcase your work to stand out to employers." />
            )}
          </SectionCard>

          <SectionCard
            icon={<Sparkles size={15} />}
            title="Verified Work Portfolio"
            filled={profile.verifiedPortfolioItems.length > 0}
          >
            {profile.verifiedPortfolioItems.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {profile.verifiedPortfolioItems.map((item, index) => (
                  <div
                    key={`${item.freelanceOrderId ?? item.fileUrl}:${index}`}
                    style={{ borderLeft: `3px solid ${C.blue}`, paddingLeft: 12 }}
                  >
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{item.title}</div>
                    <div style={{ marginTop: 4, fontSize: 12, color: C.blue, fontWeight: 700 }}>
                      {categoryLabel(item.category)}
                      {item.clientName ? ` | Client: ${item.clientName}` : ''}
                      {typeof item.rating === 'number'
                        ? ` | Rating: ${item.rating.toFixed(1)}`
                        : ''}
                    </div>
                    {item.skills?.length ? (
                      <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap' }}>
                        {item.skills.map((skill) => (
                          <Chip
                            key={`${item.fileUrl}:${skill}`}
                            label={skill}
                            color={C.teal}
                            bg={C.tealBg}
                            border={C.tealBorder}
                          />
                        ))}
                      </div>
                    ) : null}
                    {item.summary ? (
                      <div
                        style={{ marginTop: 6, fontSize: 13, color: C.textMuted, lineHeight: 1.65 }}
                      >
                        {item.summary}
                      </div>
                    ) : null}
                    <div style={{ marginTop: 8, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                      <a
                        href={item.fileUrl}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 12,
                          color: C.blue,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        Open verified file
                      </a>
                      {item.fileUrls && item.fileUrls.length > 1 ? (
                        <span style={{ fontSize: 12, color: C.textLight }}>
                          {item.fileUrls.length} files synced
                        </span>
                      ) : null}
                      {item.completedAt ? (
                        <span style={{ fontSize: 12, color: C.textLight }}>
                          Completed {fmtDate(item.completedAt)}
                        </span>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Hint text="Verified freelance deliveries will appear here automatically after escrow release and client approval." />
            )}
          </SectionCard>

          {/* Certifications */}
          <SectionCard
            icon={<Award size={15} />}
            title="Certifications"
            filled={profile.certifications.length > 0}
          >
            {profile.certifications.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {profile.certifications.map((cert, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                    <div
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: C.blue,
                        marginTop: 5,
                        flexShrink: 0,
                      }}
                    />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                        {cert.name}
                      </div>
                      <div style={{ fontSize: 12, color: C.textLight }}>
                        {cert.issuedBy}
                        {cert.issueDate ? ` · ${fmtDate(cert.issueDate)}` : ''}
                      </div>
                      {cert.credentialUrl && (
                        <a
                          href={cert.credentialUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 11,
                            color: C.blue,
                            fontWeight: 600,
                            textDecoration: 'none',
                          }}
                        >
                          View credential →
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <Hint text="No certifications — add completed professional certs." />
            )}
          </SectionCard>

          {/* Completed Courses */}
          <SectionCard
            icon={<BookOpen size={15} />}
            title="Completed Courses"
            filled={profile.completedCourses.length > 0}
          >
            {profile.completedCourses.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {profile.completedCourses.map((c) => (
                  <Chip key={c} label={c} color={C.textMuted} bg="#F8FAFC" border={C.border} />
                ))}
              </div>
            ) : (
              <Hint text="No courses added — add courses from your academic record." />
            )}
          </SectionCard>

          {/* Online Presence */}
          <SectionCard
            icon={<Globe size={15} />}
            title="Online Presence"
            filled={!!(profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl)}
          >
            {profile.linkedinUrl || profile.githubUrl || profile.portfolioUrl ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'LinkedIn', url: profile.linkedinUrl },
                  { label: 'GitHub', url: profile.githubUrl },
                  { label: 'Portfolio', url: profile.portfolioUrl },
                ]
                  .filter((l) => l.url)
                  .map(({ label, url }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.textLight,
                          width: 58,
                          textTransform: 'uppercase',
                          letterSpacing: 0.5,
                        }}
                      >
                        {label}
                      </span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          fontSize: 13,
                          color: C.blue,
                          fontWeight: 600,
                          textDecoration: 'none',
                        }}
                      >
                        {url!.replace(/^https?:\/\/(www\.)?/, '')}
                      </a>
                    </div>
                  ))}
              </div>
            ) : (
              <Hint text="No links — LinkedIn and GitHub strengthen your resume significantly." />
            )}
          </SectionCard>

          {/* Platform Activity */}
          <SectionCard
            icon={<Layers size={15} />}
            title="Platform Activity (auto-included in PDF)"
            filled={jobApps.length > 0 || events.length > 0}
          >
            {jobApps.length > 0 || events.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {jobApps.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textMuted,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Briefcase size={13} /> Job Applications ({jobApps.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {jobApps.map(
                        (app) =>
                          app.job && (
                            <div
                              key={app._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                                gap: 12,
                                padding: '10px 14px',
                                background: C.bg,
                                borderRadius: 10,
                                border: `1px solid ${C.border}`,
                              }}
                            >
                              <div style={{ flex: 1, minWidth: 0 }}>
                                <div
                                  style={{
                                    fontSize: 13,
                                    fontWeight: 700,
                                    color: C.text,
                                    marginBottom: 2,
                                  }}
                                >
                                  {app.job.title}
                                </div>
                                <div style={{ fontSize: 12, color: C.textMuted }}>
                                  {app.job.companyName} · {jobTypeLabel(app.job.type)}
                                  {app.job.city ? `  ·  ${app.job.city}` : ''}
                                  {app.appliedAt ? `  ·  ${fmtDate(app.appliedAt)}` : ''}
                                </div>
                              </div>
                              <div
                                style={{
                                  display: 'flex',
                                  flexDirection: 'column',
                                  alignItems: 'flex-end',
                                  gap: 3,
                                  flexShrink: 0,
                                }}
                              >
                                <span
                                  style={{
                                    fontSize: 11,
                                    fontWeight: 700,
                                    color: STATUS_COLOR[app.status] ?? C.textMuted,
                                    background: `${STATUS_COLOR[app.status]}15`,
                                    border: `1px solid ${STATUS_COLOR[app.status]}25`,
                                    padding: '3px 9px',
                                    borderRadius: 6,
                                  }}
                                >
                                  {STATUS_LABEL[app.status] ?? app.status}
                                </span>
                                {app.fitScore != null && (
                                  <span style={{ fontSize: 11, fontWeight: 700, color: C.teal }}>
                                    {app.fitScore}% fit
                                  </span>
                                )}
                              </div>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
                {events.length > 0 && (
                  <div>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: C.textMuted,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CalendarDays size={13} /> Events & Webinars ({events.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                      {events.map(
                        (evt) =>
                          evt.job && (
                            <div
                              key={evt._id}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 12,
                                padding: '10px 14px',
                                background: C.tealBg,
                                borderRadius: 10,
                                border: `1px solid ${C.tealBorder}`,
                              }}
                            >
                              <div
                                style={{
                                  width: 7,
                                  height: 7,
                                  borderRadius: '50%',
                                  background: C.teal,
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                                  {evt.job.title}
                                </div>
                                <div style={{ fontSize: 12, color: C.textMuted }}>
                                  {evt.job.companyName} · {jobTypeLabel(evt.job.type)}
                                  {evt.appliedAt ? `  ·  ${fmtDate(evt.appliedAt)}` : ''}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: C.teal,
                                  background: C.white,
                                  border: `1px solid ${C.tealBorder}`,
                                  padding: '3px 9px',
                                  borderRadius: 6,
                                }}
                              >
                                Registered
                              </span>
                            </div>
                          )
                      )}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <Hint text="No platform activity yet — applied jobs and registered events will appear here and in your PDF." />
            )}
          </SectionCard>

          {/* Update profile CTA */}
          <div
            style={{
              background: C.blueLight,
              border: `1px solid ${C.blueBorder}`,
              borderRadius: 12,
              padding: '14px 18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 13, color: C.blue, fontWeight: 500 }}>
              📝 Changes to your profile automatically reflect in your next generated resume.
            </div>
            <Link
              href="/student/profile"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: C.blue,
                color: '#fff',
                padding: '9px 16px',
                borderRadius: 8,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={12} /> Update Profile
            </Link>
          </div>
        </div>

        {/* RIGHT — sticky sidebar */}
        <div style={{ width: 248, flexShrink: 0 }} className="resume-sidebar">
          <div
            style={{
              background: C.card,
              borderRadius: 16,
              border: `1px solid ${C.border}`,
              padding: '20px',
              boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
              position: 'sticky',
              top: 24,
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
            }}
          >
            {/* Readiness header */}
            <div
              style={{
                fontSize: 13,
                fontWeight: 800,
                color: C.text,
                marginBottom: 16,
                fontFamily: 'var(--font-display)',
              }}
            >
              Resume Readiness
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 }}>
              <ReadinessBar pct={resumeReadiness} label="Section coverage" />
              <ReadinessBar pct={profile.profileCompleteness} label="Profile completeness" />
              {profile.opportunityScore > 0 && (
                <ReadinessBar pct={profile.opportunityScore} label="Opportunity score" />
              )}
            </div>

            {/* Section checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 5, marginBottom: 18 }}>
              {sections.map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 15,
                      height: 15,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: s.filled ? C.successBg : '#F1F5F9',
                      border: `1.5px solid ${s.filled ? C.successBorder : C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {s.filled && <CheckCircle2 size={9} color={C.success} />}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: s.filled ? C.text : C.textLight,
                      fontWeight: s.filled ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Activity counts */}
            {(jobApps.length > 0 || events.length > 0) && (
              <div
                style={{
                  display: 'flex',
                  gap: 8,
                  marginBottom: 18,
                  paddingTop: 14,
                  borderTop: `1px solid ${C.border}`,
                }}
              >
                <div
                  style={{
                    flex: 1,
                    background: C.blueLight,
                    border: `1px solid ${C.blueBorder}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: C.blue,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {jobApps.length}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, fontWeight: 500 }}>
                    Jobs
                  </div>
                </div>
                <div
                  style={{
                    flex: 1,
                    background: C.tealBg,
                    border: `1px solid ${C.tealBorder}`,
                    borderRadius: 10,
                    padding: '10px 12px',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 900,
                      color: C.teal,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {events.length}
                  </div>
                  <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2, fontWeight: 500 }}>
                    Events
                  </div>
                </div>
              </div>
            )}

            {/* Sidebar action buttons */}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                paddingTop: 14,
                borderTop: `1px solid ${C.border}`,
              }}
            >
              <button
                onClick={() => setShowPreview(true)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '11px 0',
                  background: C.indigo,
                  color: '#E2E8F0',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                  fontFamily: 'var(--font-display)',
                }}
              >
                <Eye size={14} /> Preview In-Platform Resume
              </button>

              <button
                onClick={handleDownload}
                disabled={btnDisabled}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  width: '100%',
                  padding: '11px 0',
                  background: generating ? 'rgba(37,99,235,0.6)' : C.blue,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: btnDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)',
                  opacity: saving ? 0.5 : 1,
                  boxShadow: generating ? 'none' : '0 2px 8px rgba(37,99,235,0.25)',
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
                  width: '100%',
                  padding: '11px 0',
                  background: saving ? 'rgba(13,148,136,0.6)' : C.tealBg,
                  color: saving ? '#fff' : C.teal,
                  border: `1.5px solid ${C.tealBorder}`,
                  borderRadius: 10,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: btnDisabled ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)',
                  opacity: generating ? 0.5 : 1,
                }}
              >
                {saving ? (
                  <>
                    <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…
                  </>
                ) : (
                  <>
                    <Save size={13} /> Save to Profile
                  </>
                )}
              </button>

              {profile.resumeUrl && (
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    width: '100%',
                    padding: '9px 0',
                    background: C.successBg,
                    color: C.success,
                    border: `1px solid ${C.successBorder}`,
                    borderRadius: 10,
                    fontSize: 12,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> View Uploaded Resume
                </a>
              )}
            </div>
          </div>
        </div>
      </div>

      {showPreview && profile && (
        <ResumePreviewModal
          profile={profile}
          jobApps={jobApps}
          events={events}
          onClose={() => setShowPreview(false)}
        />
      )}

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 860px) {
          .resume-layout  { flex-direction: column !important; }
          .resume-sidebar { width: 100% !important; }
        }
      `}</style>
    </div>
  );
}
