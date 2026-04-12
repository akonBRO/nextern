'use client';
// src/app/student/resume/page.tsx

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
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  blue: '#2563EB',
  blueDark: '#1D4ED8',
  teal: '#0D9488',
  tealDark: '#0F766E',
  indigo: '#1E293B',
  bg: '#F1F5F9',
  gray: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#fff',
  dark: '#0F172A',
  mid: '#334155',
  border: '#E2E8F0',
  text: '#0F172A',
  light: '#94A3B8',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
  tealBg: '#F0FDFA',
  tealBorder: '#99F6E4',
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

const STATUS_COLOR: Record<string, string> = {
  hired: C.success,
  shortlisted: C.blue,
  interview_scheduled: C.blue,
  under_review: C.warning,
  applied: C.gray,
  rejected: C.danger,
  withdrawn: C.light,
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

// ── Sidebar ──────────────────────────────────────────────────────────
const SBSection = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <div style={{ marginBottom: 20 }}>
    <div
      style={{
        fontSize: 8,
        fontWeight: 800,
        letterSpacing: 1.5,
        color: '#93C5FD',
        textTransform: 'uppercase',
        marginBottom: 6,
        paddingBottom: 4,
        borderBottom: '1px solid rgba(255,255,255,0.10)',
      }}
    >
      {title}
    </div>
    {children}
  </div>
);

const SBRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ marginBottom: 8 }}>
    <div
      style={{
        fontSize: 7,
        fontWeight: 700,
        color: 'rgba(255,255,255,0.35)',
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginBottom: 2,
      }}
    >
      {label}
    </div>
    <div style={{ fontSize: 8.5, color: '#E2E8F0', lineHeight: 1.4 }}>{value}</div>
  </div>
);

// ── Main section heading ──────────────────────────────────────────────
const Section = ({ title, color = C.teal }: { title: string; color?: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10, marginTop: 4 }}>
    <div style={{ width: 3, height: 14, background: color, borderRadius: 2, flexShrink: 0 }} />
    <div
      style={{
        fontSize: 8.5,
        fontWeight: 800,
        color,
        letterSpacing: 1.2,
        textTransform: 'uppercase',
      }}
    >
      {title}
    </div>
    <div style={{ flex: 1, height: 0.75, background: '#E2E8F0', marginLeft: 4 }} />
  </div>
);

// ─────────────────────────────────────────────────────────────────────────
// IN-PLATFORM RESUME PREVIEW MODAL
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
        background: 'rgba(0,0,0,0.75)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '32px 16px',
        overflowY: 'auto',
      }}
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 820,
          background: C.white,
          borderRadius: 20,
          boxShadow: '0 40px 100px rgba(0,0,0,0.4)',
          overflow: 'hidden',
          fontFamily: 'Georgia, "Times New Roman", serif',
        }}
      >
        {/* Modal top bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 20px',
            background: C.dark,
            borderBottom: '1px solid rgba(255,255,255,0.07)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
            <FileText size={15} color={C.teal} />
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F8FAFC' }}>
              In-Platform Resume Preview
            </span>
            <span style={{ fontSize: 11, color: C.light, marginLeft: 4 }}>— {profile.name}</span>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.12)',
              borderRadius: '50%',
              width: 30,
              height: 30,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              color: '#fff',
            }}
          >
            <X size={14} />
          </button>
        </div>

        {/* Resume body */}
        <div style={{ display: 'flex', minHeight: 900 }}>
          {/* ── SIDEBAR ── */}
          <div
            style={{
              width: 200,
              flexShrink: 0,
              background: '#0F172A',
              padding: '28px 18px',
            }}
          >
            {/* Avatar */}
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #0D9488)',
                margin: '0 auto 16px',
                overflow: 'hidden',
                border: '3px solid rgba(255,255,255,0.12)',
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
                  width={72}
                  height={72}
                  style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                />
              ) : (
                (profile.name?.charAt(0)?.toUpperCase() ?? 'U')
              )}
            </div>

            {/* Contact */}
            <SBSection title="Contact">
              {profile.email && <SBRow label="Email" value={profile.email} />}
              {profile.phone && <SBRow label="Phone" value={profile.phone} />}
              {profile.city && <SBRow label="City" value={profile.city} />}
            </SBSection>

            {/* Links */}
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

            {/* Education */}
            <SBSection title="Education">
              {profile.university && (
                <div style={{ fontSize: 9, fontWeight: 700, color: '#F8FAFC', marginBottom: 3 }}>
                  {profile.university}
                </div>
              )}
              {profile.department && (
                <div style={{ fontSize: 8.5, color: '#CBD5E1', marginBottom: 3 }}>
                  {profile.department}
                </div>
              )}
              {(profile.yearOfStudy || profile.currentSemester) && (
                <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.4)', marginBottom: 6 }}>
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
                    background: C.blue,
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
              {profile.studentId && (
                <div style={{ fontSize: 7.5, color: 'rgba(255,255,255,0.3)' }}>
                  ID: {profile.studentId}
                </div>
              )}
            </SBSection>

            {/* Skills */}
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

            {/* Courses */}
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
                        background: '#64748B',
                        flexShrink: 0,
                      }}
                    />
                    <span style={{ fontSize: 8, color: '#94A3B8' }}>{c}</span>
                  </div>
                ))}
              </SBSection>
            )}

            {/* Nextern Score */}
            {profile.opportunityScore > 0 && (
              <SBSection title="Nextern Score">
                <div
                  style={{
                    height: 7,
                    background: 'rgba(255,255,255,0.1)',
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

          {/* ── MAIN CONTENT ── */}
          <div style={{ flex: 1, minWidth: 0 }}>
            {/* Header band */}
            <div
              style={{
                background: `linear-gradient(135deg, ${C.dark}, ${C.indigo})`,
                padding: '24px 28px 20px',
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
                  width: 120,
                  height: 120,
                  background: 'radial-gradient(circle, rgba(37,99,235,0.15) 0%, transparent 70%)',
                  borderRadius: '50%',
                }}
              />
              <h1
                style={{
                  fontSize: 22,
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

            {/* Content sections */}
            <div style={{ padding: '20px 28px', fontFamily: 'var(--font-body)' }}>
              {/* Professional Summary */}
              {profile.bio && (
                <div style={{ marginBottom: 20 }}>
                  <Section title="Professional Summary" />
                  <p style={{ fontSize: 9.5, color: C.mid, lineHeight: 1.75, margin: 0 }}>
                    {profile.bio}
                  </p>
                </div>
              )}

              {/* Projects */}
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
                        style={{ fontSize: 10.5, fontWeight: 800, color: C.dark, marginBottom: 3 }}
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
                          style={{ fontSize: 9, color: C.gray, lineHeight: 1.65, marginBottom: 4 }}
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
                              color: C.gray,
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

              {/* Certifications */}
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
                        <div style={{ fontSize: 10, fontWeight: 700, color: C.dark }}>
                          {cert.name}
                        </div>
                        <div style={{ fontSize: 8, color: C.light }}>
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

              {/* ── Platform Activity ── */}
              {hasActivity && (
                <div
                  style={{
                    background: C.blueBg,
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

                  {/* Job Applications */}
                  {jobApps.length > 0 && (
                    <div style={{ marginBottom: 14 }}>
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: C.gray,
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
                                    color: C.dark,
                                    marginBottom: 1,
                                  }}
                                >
                                  {app.job.title}
                                </div>
                                <div style={{ fontSize: 8, color: C.gray }}>
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
                                    color: STATUS_COLOR[app.status] ?? C.gray,
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

                  {/* Event Registrations */}
                  {events.length > 0 && (
                    <div>
                      <div
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: C.gray,
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
                                <div style={{ fontSize: 9.5, fontWeight: 700, color: C.dark }}>
                                  {evt.job.title}
                                </div>
                                <div style={{ fontSize: 8, color: C.gray }}>
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

              {/* Footer */}
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
                <div style={{ fontSize: 7.5, color: C.light }}>
                  Generated by Nextern · nextern-virid.vercel.app
                </div>
                <div style={{ fontSize: 7.5, color: C.light }}>
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
// SMALL COMPONENTS
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
        background: C.white,
        borderRadius: 16,
        border: `1px solid ${filled ? C.successBorder : C.border}`,
        overflow: 'hidden',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '13px 20px',
          borderBottom: `1px solid ${C.border}`,
          background: filled ? C.successBg : '#FAFBFC',
        }}
      >
        <div style={{ color: filled ? C.success : C.gray }}>{icon}</div>
        <div style={{ fontSize: 14, fontWeight: 700, color: C.text, flex: 1 }}>{title}</div>
        {filled ? (
          <CheckCircle2 size={16} color={C.success} />
        ) : (
          <span
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: C.light,
              background: C.bg,
              border: `1px solid ${C.border}`,
              padding: '2px 8px',
              borderRadius: 999,
            }}
          >
            Empty
          </span>
        )}
      </div>
      <div style={{ padding: '14px 20px' }}>{children}</div>
    </div>
  );
}

function Hint({ text }: { text: string }) {
  return <div style={{ fontSize: 13, color: C.light, fontStyle: 'italic' }}>{text}</div>;
}

function Chip({
  label,
  color = C.blue,
  bg = C.blueBg,
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
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 600,
        marginRight: 6,
        marginBottom: 6,
      }}
    >
      {label}
    </span>
  );
}

function Bar({ pct, label }: { pct: number; label: string }) {
  const color = pct >= 80 ? C.success : pct >= 50 ? C.blue : C.warning;
  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
        <span style={{ fontSize: 12, color: C.gray, fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: 12, fontWeight: 800, color }}>{pct}%</span>
      </div>
      <div style={{ height: 7, background: C.bg, borderRadius: 999, overflow: 'hidden' }}>
        <div
          style={{
            width: `${pct}%`,
            height: '100%',
            borderRadius: 999,
            background: color,
            transition: 'width 0.4s ease',
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
  // This keeps the auto-generated resume completely separate from the student's
  // manually uploaded actual resume on their profile page.
  const { startUpload } = useUploadThing('generatedResumeUploader');

  useEffect(() => {
    Promise.all([
      fetch('/api/users/profile').then((r) => r.json()),
      fetch('/api/resume/platform-activity').then((r) => r.json()),
    ])
      .then(([profileData, activityData]) => {
        setProfile(profileData?.user ?? null);
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
      // 1. Generate the PDF
      const res = await fetch('/api/resume/generate');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed');
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], 'generated_resume.pdf', { type: 'application/pdf' });

      // 2. Upload via generatedResumeUploader
      //    The onUploadComplete hook saves directly to User.generatedResumeUrl in MongoDB.
      //    User.resumeUrl (the actual uploaded resume) is NEVER touched here.
      const uploaded = await startUpload([file]);
      if (!uploaded?.[0]?.ufsUrl) {
        setError('Upload failed. Please try again.');
        return;
      }

      // 3. Update local state — only generatedResumeUrl
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
          color: C.gray,
        }}
      >
        <Loader2 size={22} style={{ animation: 'spin 0.8s linear infinite', marginRight: 10 }} />
        Loading your profile…
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
          <div style={{ fontSize: 36, marginBottom: 12 }}>⚠️</div>
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
      {/* ── Header ── */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo})`,
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
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563EB, #0D9488)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#fff',
                  }}
                >
                  <FileText size={18} />
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
                  Resume Builder
                </h1>
              </div>
              <p style={{ color: C.gray, fontSize: 13, margin: 0 }}>
                Auto-generated from your Nextern profile. Includes your platform activity,
                applications, and events.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{ maxWidth: 1060, margin: '28px auto', padding: '0 24px', display: 'flex', gap: 22 }}
        className="resume-layout"
      >
        {/* ── Left: Sections ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
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
              }}
            >
              <CheckCircle2 size={15} /> In-platform resume saved successfully — viewable from your
              profile page.
            </div>
          )}

          {/* Personal */}
          <SectionCard
            icon={<User size={16} />}
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
                        fontSize: 11,
                        fontWeight: 700,
                        color: C.light,
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
                  color: C.gray,
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
            icon={<GraduationCap size={16} />}
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
                          fontSize: 11,
                          fontWeight: 700,
                          color: C.light,
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
          <SectionCard icon={<Code2 size={16} />} title="Skills" filled={profile.skills.length > 0}>
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
            icon={<Briefcase size={16} />}
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
                            bg={C.blueBg}
                            border={C.blueBorder}
                          />
                        ))}
                      </div>
                    )}
                    {proj.description && (
                      <div style={{ marginTop: 6, fontSize: 13, color: C.gray, lineHeight: 1.65 }}>
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
                            color: C.gray,
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

          {/* Certifications */}
          <SectionCard
            icon={<Award size={16} />}
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
                      <div style={{ fontSize: 12, color: C.light }}>
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
            icon={<BookOpen size={16} />}
            title="Completed Courses"
            filled={profile.completedCourses.length > 0}
          >
            {profile.completedCourses.length > 0 ? (
              <div style={{ display: 'flex', flexWrap: 'wrap' }}>
                {profile.completedCourses.map((c) => (
                  <Chip key={c} label={c} color={C.gray} bg="#F8FAFC" border={C.border} />
                ))}
              </div>
            ) : (
              <Hint text="No courses added — add courses from your academic record." />
            )}
          </SectionCard>

          {/* Online Presence */}
          <SectionCard
            icon={<Globe size={16} />}
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
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <span
                        style={{
                          fontSize: 12,
                          fontWeight: 700,
                          color: C.light,
                          width: 60,
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
            icon={<Layers size={16} />}
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
                        color: C.gray,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <Briefcase size={13} /> Job Applications ({jobApps.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
                                <div style={{ fontSize: 12, color: C.gray }}>
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
                                    color: STATUS_COLOR[app.status] ?? C.gray,
                                    background: `${STATUS_COLOR[app.status]}15`,
                                    border: `1px solid ${STATUS_COLOR[app.status]}25`,
                                    padding: '3px 9px',
                                    borderRadius: 999,
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
                        color: C.gray,
                        marginBottom: 10,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CalendarDays size={13} /> Events & Webinars ({events.length})
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
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
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  background: C.teal,
                                  flexShrink: 0,
                                }}
                              />
                              <div style={{ flex: 1 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                                  {evt.job.title}
                                </div>
                                <div style={{ fontSize: 12, color: C.gray }}>
                                  {evt.job.companyName} · {jobTypeLabel(evt.job.type)}
                                  {evt.appliedAt ? `  ·  ${fmtDate(evt.appliedAt)}` : ''}
                                </div>
                              </div>
                              <span
                                style={{
                                  fontSize: 11,
                                  fontWeight: 700,
                                  color: C.teal,
                                  background: '#fff',
                                  border: `1px solid ${C.tealBorder}`,
                                  padding: '3px 9px',
                                  borderRadius: 999,
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

          {/* CTA */}
          <div
            style={{
              background: C.blueBg,
              border: `1px solid ${C.blueBorder}`,
              borderRadius: 14,
              padding: '16px 20px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 14,
              flexWrap: 'wrap',
              marginBottom: 32,
            }}
          >
            <div style={{ fontSize: 14, color: C.blue, fontWeight: 600 }}>
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
                padding: '9px 18px',
                borderRadius: 9,
                fontSize: 13,
                fontWeight: 700,
                textDecoration: 'none',
                fontFamily: 'var(--font-display)',
                flexShrink: 0,
              }}
            >
              <RefreshCw size={13} /> Update Profile
            </Link>
          </div>
        </div>

        {/* ── Right: Stats sidebar ── */}
        <div
          style={{ width: 256, flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 14 }}
          className="resume-sidebar"
        >
          <div
            style={{
              background: C.white,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              padding: '20px 20px',
              boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
              position: 'sticky',
              top: 24,
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
              Resume Readiness
            </div>
            <Bar pct={resumeReadiness} label="Section coverage" />
            <div style={{ marginTop: 12 }}>
              <Bar pct={profile.profileCompleteness} label="Profile completeness" />
            </div>
            {profile.opportunityScore > 0 && (
              <div style={{ marginTop: 12 }}>
                <Bar pct={profile.opportunityScore} label="Opportunity score" />
              </div>
            )}

            {/* Checklist */}
            <div style={{ marginTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>
              {sections.map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      flexShrink: 0,
                      background: s.filled ? C.successBg : C.bg,
                      border: `1.5px solid ${s.filled ? C.successBorder : C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {s.filled && <CheckCircle2 size={10} color={C.success} />}
                  </div>
                  <span
                    style={{
                      fontSize: 12,
                      color: s.filled ? C.text : C.light,
                      fontWeight: s.filled ? 600 : 400,
                    }}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Activity summary */}
            {(jobApps.length > 0 || events.length > 0) && (
              <div style={{ marginTop: 16, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
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
                  Platform Activity
                </div>
                <div style={{ display: 'flex', gap: 8 }}>
                  <div
                    style={{
                      flex: 1,
                      background: C.blueBg,
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
                    <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>Jobs</div>
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
                    <div style={{ fontSize: 11, color: C.gray, marginTop: 2 }}>Events</div>
                  </div>
                </div>
              </div>
            )}

            {/* Buttons */}
            <button
              onClick={() => setShowPreview(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                width: '100%',
                marginTop: 16,
                padding: '12px 0',
                background: C.indigo,
                color: '#fff',
                border: 'none',
                borderRadius: 11,
                fontSize: 13,
                fontWeight: 700,
                cursor: 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              <Eye size={14} /> View Resume
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
                marginTop: 8,
                padding: '12px 0',
                background: generating ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
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
                  <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} />{' '}
                  Generating…
                </>
              ) : (
                <>
                  <Download size={14} /> Download PDF
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
                marginTop: 8,
                padding: '12px 0',
                background: saving ? 'rgba(13,148,136,0.4)' : C.tealBg,
                color: saving ? '#fff' : C.teal,
                border: `1.5px solid ${C.tealBorder}`,
                borderRadius: 11,
                fontSize: 13,
                fontWeight: 700,
                cursor: btnDisabled ? 'not-allowed' : 'pointer',
                fontFamily: 'var(--font-display)',
              }}
            >
              {saving ? (
                <>
                  <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> Saving…
                </>
              ) : (
                <>
                  <Save size={14} /> Save to Profile
                </>
              )}
            </button>

            {profile.resumeUrl && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.light,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 6,
                  }}
                >
                  Saved resume
                </div>
                <a
                  href={profile.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    fontSize: 12,
                    color: C.blue,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> View current PDF
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Preview Modal ── */}
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
