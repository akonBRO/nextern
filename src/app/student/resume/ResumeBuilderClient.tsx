'use client';
// src/app/student/resume/ResumeBuilderClient.tsx
// Full resume builder UI — live section preview, readiness sidebar, download & save.

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
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
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

// ── Palette ────────────────────────────────────────────────────────────────
const C = {
  blue: '#2563EB',
  teal: '#0D9488',
  navy: '#1E293B',
  bg: '#F1F5F9',
  gray: '#64748B',
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
  success: '#10B981',
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
  generatedResumeUrl?: string;
  projects: {
    title: string;
    description: string;
    techStack: string[];
    projectUrl?: string;
    repoUrl?: string;
  }[];
  certifications: {
    name: string;
    issuedBy: string;
    issueDate?: string;
    credentialUrl?: string;
  }[];
};

// ── Sub-components ─────────────────────────────────────────────────────────
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
          <CheckCircle2 size={15} color={C.success} />
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

function EmptyHint({ text }: { text: string }) {
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

function CompletionBar({ pct, label }: { pct: number; label: string }) {
  const color = pct >= 80 ? C.success : pct >= 50 ? C.blue : '#F59E0B';
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

// ── Main component ─────────────────────────────────────────────────────────
export default function ResumeBuilderClient() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [fetching, setFetching] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const { startUpload } = useUploadThing('resumeUploader');

  useEffect(() => {
    fetch('/api/users/profile')
      .then((r) => r.json())
      .then((d) => setProfile(d.user))
      .catch(() => setError('Failed to load profile'))
      .finally(() => setFetching(false));
  }, []);

  // ── Download ──────────────────────────────────────────────────────────
  async function handleDownload() {
    setGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/resume/generate');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to generate resume');
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

  // ── Save to profile ───────────────────────────────────────────────────
  async function handleSaveToProfile() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/resume/generate');
      if (!res.ok) {
        const d = await res.json();
        setError(d.error ?? 'Failed to generate resume');
        return;
      }
      const blob = await res.blob();
      const file = new File([blob], 'resume.pdf', { type: 'application/pdf' });
      const uploaded = await startUpload([file]);
      if (!uploaded?.[0]?.ufsUrl) {
        setError('Upload failed. Please try again.');
        return;
      }
      await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          generatedResumeUrl: uploaded[0].ufsUrl,
        }),
      });

      setProfile((prev) => (prev ? { ...prev, generatedResumeUrl: uploaded[0].ufsUrl } : prev));
      setSaved(true);
      setTimeout(() => setSaved(false), 4500);
    } catch {
      setError('Failed to save resume. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  // ── Loading ────────────────────────────────────────────────────────────
  if (fetching) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 10,
          color: C.gray,
          fontFamily: 'var(--font-body)',
        }}
      >
        <Loader2 size={20} style={{ animation: 'spin 0.8s linear infinite' }} />
        Loading your profile…
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          minHeight: '60vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'var(--font-body)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 8 }}>
            Could not load profile
          </div>
          <Link href="/student/profile" style={{ color: C.blue, fontSize: 13 }}>
            Go to Profile →
          </Link>
        </div>
      </div>
    );
  }

  // ── Section readiness ──────────────────────────────────────────────────
  const sections = [
    { key: 'bio', label: 'Summary', filled: !!profile.bio },
    { key: 'academic', label: 'Academic Info', filled: !!(profile.university && profile.cgpa) },
    { key: 'skills', label: 'Skills', filled: profile.skills.length > 0 },
    { key: 'projects', label: 'Projects', filled: profile.projects.length > 0 },
    { key: 'certs', label: 'Certifications', filled: profile.certifications.length > 0 },
    { key: 'courses', label: 'Courses', filled: profile.completedCourses.length > 0 },
    {
      key: 'links',
      label: 'Online Presence',
      filled: !!(profile.linkedinUrl || profile.githubUrl),
    },
  ];
  const filledCount = sections.filter((s) => s.filled).length;
  const resumeReadiness = Math.round((filledCount / sections.length) * 100);

  const busy = generating || saving;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* ── Page header ── */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.navy})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 1080, margin: '0 auto', padding: '24px 28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'flex-end',
              justifyContent: 'space-between',
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
                    borderRadius: 11,
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
              <p style={{ color: C.gray, fontSize: 13, margin: 0, maxWidth: 480 }}>
                Your resume is auto-generated from your Nextern profile. Keep your profile complete
                for the best output.
              </p>
            </div>

            {/* CTA buttons */}
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <ActionBtn
                onClick={handleDownload}
                disabled={busy}
                loading={generating}
                loadingLabel="Generating…"
                icon={<Download size={14} />}
                label="Download PDF"
                color="#2563EB"
                shadow="rgba(37,99,235,0.4)"
              />
              <ActionBtn
                onClick={handleSaveToProfile}
                disabled={busy}
                loading={saving}
                loadingLabel="Saving…"
                icon={<Save size={14} />}
                label="Save to Profile"
                color="#0D9488"
                shadow="rgba(13,148,136,0.4)"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          maxWidth: 1080,
          margin: '28px auto',
          padding: '0 28px 48px',
          display: 'flex',
          gap: 24,
          alignItems: 'flex-start',
        }}
        className="resume-layout"
      >
        {/* ── Left: section previews ── */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 14, minWidth: 0 }}>
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
              <CheckCircle2 size={14} /> Resume saved to your profile — it is now attached to all
              job applications.
            </div>
          )}

          {/* Personal Info */}
          <SectionCard
            icon={<User size={15} />}
            title="Personal Information"
            filled={!!profile.name}
          >
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
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
                        textTransform: 'uppercase' as const,
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
                  marginTop: 12,
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
              <div style={{ marginTop: 10 }}>
                <EmptyHint text="No bio — add one in your profile for a stronger summary section." />
              </div>
            )}
          </SectionCard>

          {/* Academic */}
          <SectionCard
            icon={<GraduationCap size={15} />}
            title="Academic Information"
            filled={!!(profile.university && profile.cgpa)}
          >
            {profile.university || profile.cgpa != null ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 12 }}>
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
                          textTransform: 'uppercase' as const,
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
              <EmptyHint text="No academic info — add university, department and CGPA in your profile." />
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
              <EmptyHint text="No skills — skills are key to job matching and your resume." />
            )}
          </SectionCard>

          {/* Projects */}
          <SectionCard
            icon={<Briefcase size={15} />}
            title="Projects"
            filled={profile.projects.length > 0}
          >
            {profile.projects.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {profile.projects.map((proj, i) => (
                  <div key={i} style={{ borderLeft: `3px solid ${C.teal}`, paddingLeft: 14 }}>
                    <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>{proj.title}</div>
                    {proj.techStack?.length > 0 && (
                      <div style={{ marginTop: 5, display: 'flex', flexWrap: 'wrap' }}>
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
                    <div style={{ marginTop: 6, display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                      {proj.projectUrl && (
                        <a
                          href={proj.projectUrl}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            fontSize: 12,
                            color: C.teal,
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
              <EmptyHint text="No projects — showcase your work to stand out to employers." />
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
                        background: C.teal,
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
                        {cert.issueDate
                          ? ` · ${new Date(cert.issueDate).toLocaleDateString('en-BD', { month: 'short', year: 'numeric' })}`
                          : ''}
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
              <EmptyHint text="No certifications — add completed courses or professional certs." />
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
                  <Chip key={c} label={c} color={C.gray} bg="#F8FAFC" border={C.border} />
                ))}
              </div>
            ) : (
              <EmptyHint text="No courses — add completed courses from your academic record." />
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
                          color: C.light,
                          width: 58,
                          textTransform: 'uppercase' as const,
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
              <EmptyHint text="No links — LinkedIn and GitHub significantly strengthen your resume." />
            )}
          </SectionCard>

          {/* Update profile CTA */}
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
              marginBottom: 8,
            }}
          >
            <div style={{ fontSize: 13, color: C.blue, fontWeight: 600 }}>
              📝 Changes to your profile automatically reflect in the next generated resume.
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

        {/* ── Right: sticky readiness sidebar ── */}
        <div style={{ width: 256, flexShrink: 0 }} className="resume-sidebar">
          <div
            style={{
              background: C.white,
              borderRadius: 18,
              border: `1px solid ${C.border}`,
              padding: '20px',
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

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <CompletionBar pct={resumeReadiness} label="Section coverage" />
              <CompletionBar pct={profile.profileCompleteness} label="Profile completeness" />
              {profile.opportunityScore > 0 && (
                <CompletionBar pct={profile.opportunityScore} label="Opportunity score" />
              )}
            </div>

            <div
              style={{
                marginTop: 18,
                marginBottom: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 7,
              }}
            >
              {sections.map((s) => (
                <div key={s.key} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div
                    style={{
                      width: 16,
                      height: 16,
                      borderRadius: '50%',
                      background: s.filled ? C.successBg : C.bg,
                      border: `1.5px solid ${s.filled ? C.successBorder : C.border}`,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {s.filled && <CheckCircle2 size={9} color={C.success} />}
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

            {/* Sidebar buttons */}
            <ActionBtn
              onClick={handleDownload}
              disabled={busy}
              loading={generating}
              loadingLabel="Generating…"
              icon={<Download size={13} />}
              label="Download PDF"
              color="#2563EB"
              shadow="rgba(37,99,235,0.3)"
              fullWidth
            />
            <div style={{ marginTop: 8 }}>
              <ActionBtn
                onClick={handleSaveToProfile}
                disabled={busy}
                loading={saving}
                loadingLabel="Saving…"
                icon={<Save size={13} />}
                label="Save to Profile"
                color="#0D9488"
                shadow="rgba(13,148,136,0.3)"
                fullWidth
                outlined
              />
            </div>

            {(profile.resumeUrl || profile.generatedResumeUrl) && (
              <div style={{ marginTop: 14, paddingTop: 14, borderTop: `1px solid ${C.border}` }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.light,
                    textTransform: 'uppercase',
                    letterSpacing: 0.5,
                    marginBottom: 7,
                  }}
                >
                  Current resume
                </div>
                <a
                  href={profile.generatedResumeUrl || profile.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 5,
                    fontSize: 12,
                    color: C.blue,
                    fontWeight: 600,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={12} /> View saved resume
                </a>
              </div>
            )}
          </div>
        </div>
      </div>

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

// ── ActionBtn helper ───────────────────────────────────────────────────────
function ActionBtn({
  onClick,
  disabled,
  loading,
  loadingLabel,
  icon,
  label,
  color,
  shadow,
  fullWidth = false,
  outlined = false,
}: {
  onClick: () => void;
  disabled: boolean;
  loading: boolean;
  loadingLabel: string;
  icon: React.ReactNode;
  label: string;
  color: string;
  shadow: string;
  fullWidth?: boolean;
  outlined?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        padding: '11px 22px',
        width: fullWidth ? '100%' : undefined,
        background: outlined
          ? loading
            ? 'rgba(13,148,136,0.08)'
            : `${color}14`
          : loading
            ? `${color}80`
            : `linear-gradient(135deg, ${color}, ${color}cc)`,
        color: outlined ? color : '#fff',
        border: outlined ? `1.5px solid ${color}40` : 'none',
        borderRadius: 11,
        fontSize: 13,
        fontWeight: 700,
        cursor: disabled ? 'not-allowed' : 'pointer',
        fontFamily: 'var(--font-display)',
        boxShadow: !outlined && !loading ? `0 4px 14px ${shadow}` : 'none',
        transition: 'all 0.15s',
      }}
    >
      {loading ? (
        <>
          <Loader2 size={13} style={{ animation: 'spin 0.8s linear infinite' }} /> {loadingLabel}
        </>
      ) : (
        <>
          {icon} {label}
        </>
      )}
    </button>
  );
}
