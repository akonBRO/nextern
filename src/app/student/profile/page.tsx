'use client';
// src/app/student/profile/page.tsx

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  Code2,
  Award,
  Globe,
  Github,
  Linkedin,
  User,
  Briefcase,
  Save,
  Plus,
  Trash2,
  FileText,
  Upload,
  ExternalLink,
  Eye,
  Layers,
  MapPin,
  Mail,
  Phone,
} from 'lucide-react';
import { useUploadThing } from '@/lib/uploadthing';

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
  muted: '#374151',
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

const inputBase: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '10px 14px',
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  color: C.text,
  background: C.white,
};

const BD_UNIS = [
  'BRAC University',
  'North South University (NSU)',
  'AIUB',
  'Independent University Bangladesh (IUB)',
  'East West University (EWU)',
  'Daffodil International University (DIU)',
  'ULAB',
  'United International University (UIU)',
  'KUET',
  'RUET',
  'CUET',
  'BUET',
  'SUST',
  'Dhaka University (DU)',
  'IUT',
];
const BD_DEPTS = [
  'CSE',
  'EEE',
  'BBA',
  'MBA',
  'ECE',
  'Civil',
  'Architecture',
  'Pharmacy',
  'Law',
  'English',
  'Economics',
  'Finance',
  'Marketing',
  'Accounting',
];

// ── Sub-components ─────────────────────────────────────────────────────────
function SectionHeader({ icon, label }: { icon: React.ReactNode; label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        paddingBottom: 12,
        borderBottom: `1px solid ${C.bg}`,
      }}
    >
      <div style={{ color: C.blue }}>{icon}</div>
      <div
        style={{ fontSize: 15, fontWeight: 800, color: C.text, fontFamily: 'var(--font-display)' }}
      >
        {label}
      </div>
    </div>
  );
}

function Field({
  label,
  required = false,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{
          display: 'block',
          fontSize: 12,
          fontWeight: 700,
          color: C.muted,
          marginBottom: 6,
          textTransform: 'uppercase',
          letterSpacing: 0.5,
        }}
      >
        {label}
        {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
      </label>
      {children}
    </div>
  );
}

function TagInput({
  tags,
  onChange,
  placeholder,
  color = C.blue,
  bg = C.blueBg,
  border = C.blueBorder,
}: {
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
  color?: string;
  bg?: string;
  border?: string;
}) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  }
  return (
    <div
      style={{
        border: `1.5px solid ${C.border}`,
        borderRadius: 10,
        padding: '8px 10px',
        background: C.white,
        minHeight: 44,
      }}
    >
      <div
        style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: tags.length > 0 ? 8 : 0 }}
      >
        {tags.map((t) => (
          <span
            key={t}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 5,
              background: bg,
              color,
              border: `1px solid ${border}`,
              padding: '3px 10px',
              borderRadius: 999,
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            {t}
            <button
              type="button"
              onClick={() => onChange(tags.filter((x) => x !== t))}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                color,
                fontSize: 14,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 6 }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), add())}
          placeholder={placeholder ?? 'Type and press Enter'}
          style={{
            flex: 1,
            border: 'none',
            outline: 'none',
            fontSize: 13,
            color: C.text,
            background: 'transparent',
            fontFamily: 'var(--font-body)',
          }}
        />
        <button
          type="button"
          onClick={add}
          style={{
            background: bg,
            color,
            border: 'none',
            borderRadius: 7,
            padding: '3px 9px',
            cursor: 'pointer',
            fontSize: 12,
            fontWeight: 700,
          }}
        >
          Add
        </button>
      </div>
    </div>
  );
}

const RS = ({ title }: { title: string }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8, margin: '14px 0 8px' }}>
    <div style={{ width: 3, height: 13, background: C.teal, borderRadius: 2, flexShrink: 0 }} />
    <div
      style={{
        fontSize: 9,
        fontWeight: 800,
        color: C.teal,
        letterSpacing: 1.1,
        textTransform: 'uppercase' as const,
      }}
    >
      {title}
    </div>
    <div style={{ flex: 1, height: 0.75, background: C.border }} />
  </div>
);

const Pill = ({
  label,
  color,
  bg,
  border,
}: {
  label: string;
  color: string;
  bg: string;
  border: string;
}) => (
  <span
    style={{
      display: 'inline-block',
      background: bg,
      color,
      border: `0.75px solid ${border}`,
      padding: '2px 8px',
      borderRadius: 999,
      fontSize: 8,
      fontWeight: 600,
      marginRight: 4,
      marginBottom: 4,
    }}
  >
    {label}
  </span>
);

// ── In-Platform Resume Preview Card ───────────────────────────────────────
function InPlatformResume({ user }: { user: UserData | null }) {
  if (!user) return null;

  const hasContent =
    user.bio || user.university || user.skills.length > 0 || user.projects.length > 0;

  return (
    <div
      style={{
        border: `1px solid ${C.border}`,
        borderRadius: 14,
        overflow: 'hidden',
        background: C.white,
        boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
      }}
    >
      {/* Resume header band */}
      <div
        style={{
          background: `linear-gradient(135deg, ${C.dark}, ${C.indigo})`,
          padding: '20px 24px 16px',
          borderBottom: `3px solid ${C.blue}`,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          {/* Avatar */}
          <div
            style={{
              width: 52,
              height: 52,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #2563EB, #0D9488)',
              border: '2px solid rgba(255,255,255,0.15)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 20,
              fontWeight: 900,
              color: '#fff',
              fontFamily: 'var(--font-display)',
              flexShrink: 0,
            }}
          >
            {user.image ? (
              <Image
                src={user.image}
                alt={user.name}
                width={52}
                height={52}
                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
              />
            ) : (
              user.name.charAt(0).toUpperCase()
            )}
          </div>
          <div>
            <div
              style={{
                fontSize: 17,
                fontWeight: 900,
                color: '#F8FAFC',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.2px',
              }}
            >
              {user.name}
            </div>
            {(user.department || user.university) && (
              <div style={{ fontSize: 9.5, color: '#93C5FD', marginTop: 2 }}>
                {[user.department, user.university].filter(Boolean).join('  ·  ')}
              </div>
            )}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 6 }}>
              {user.email && (
                <span
                  style={{
                    fontSize: 8,
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Mail size={9} />
                  {user.email}
                </span>
              )}
              {user.phone && (
                <span
                  style={{
                    fontSize: 8,
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <Phone size={9} />
                  {user.phone}
                </span>
              )}
              {user.city && (
                <span
                  style={{
                    fontSize: 8,
                    color: '#94A3B8',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 3,
                  }}
                >
                  <MapPin size={9} />
                  {user.city}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Resume body */}
      <div style={{ padding: '4px 24px 20px', fontFamily: 'var(--font-body)' }}>
        {!hasContent && (
          <div style={{ textAlign: 'center', padding: '28px 0', color: C.light, fontSize: 13 }}>
            Fill in your profile details above and save — your in-platform resume will appear here.
          </div>
        )}

        {/* Summary */}
        {user.bio && (
          <>
            <RS title="Professional Summary" />
            <p style={{ fontSize: 9.5, color: C.mid, lineHeight: 1.75, margin: 0 }}>{user.bio}</p>
          </>
        )}

        {/* Education */}
        {(user.university || user.cgpa != null) && (
          <>
            <RS title="Education" />
            <div
              style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}
            >
              <div>
                <div style={{ fontSize: 10.5, fontWeight: 800, color: C.dark }}>
                  {user.university}
                </div>
                <div style={{ fontSize: 9, color: C.gray, marginTop: 2 }}>
                  {[
                    user.department,
                    user.yearOfStudy ? `Year ${user.yearOfStudy}` : '',
                    user.currentSemester,
                  ]
                    .filter(Boolean)
                    .join('  ·  ')}
                </div>
              </div>
              {user.cgpa != null && (
                <div
                  style={{
                    background: C.blueBg,
                    border: `1px solid ${C.blueBorder}`,
                    borderRadius: 7,
                    padding: '4px 10px',
                    fontSize: 9,
                    fontWeight: 800,
                    color: C.blue,
                  }}
                >
                  CGPA {user.cgpa.toFixed(2)} / 4.00
                </div>
              )}
            </div>
          </>
        )}

        {/* Skills */}
        {user.skills.length > 0 && (
          <>
            <RS title="Skills" />
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {user.skills.map((s) => (
                <Pill key={s} label={s} color={C.tealDark} bg={C.tealBg} border={C.tealBorder} />
              ))}
            </div>
          </>
        )}

        {/* Projects */}
        {user.projects.length > 0 && (
          <>
            <RS title="Projects" />
            {user.projects.map((proj, i) => (
              <div
                key={i}
                style={{
                  marginBottom: 10,
                  paddingBottom: 10,
                  borderBottom: i < user.projects.length - 1 ? `1px solid ${C.border}` : 'none',
                }}
              >
                <div style={{ fontSize: 10.5, fontWeight: 800, color: C.dark }}>{proj.title}</div>
                {proj.techStack?.length > 0 && (
                  <div style={{ fontSize: 8, color: C.teal, fontWeight: 600, margin: '3px 0' }}>
                    {proj.techStack.join('  ·  ')}
                  </div>
                )}
                {proj.description && (
                  <div style={{ fontSize: 9, color: C.gray, lineHeight: 1.65 }}>
                    {proj.description}
                  </div>
                )}
              </div>
            ))}
          </>
        )}

        {/* Certifications */}
        {user.certifications.length > 0 && (
          <>
            <RS title="Certifications" />
            {user.certifications.map((cert, i) => (
              <div
                key={i}
                style={{ display: 'flex', alignItems: 'flex-start', gap: 8, marginBottom: 7 }}
              >
                <div
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: C.blue,
                    marginTop: 4,
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div style={{ fontSize: 10, fontWeight: 700, color: C.dark }}>{cert.name}</div>
                  <div style={{ fontSize: 8.5, color: C.light }}>{cert.issuedBy}</div>
                </div>
              </div>
            ))}
          </>
        )}

        {/* Completed Courses */}
        {user.completedCourses.length > 0 && (
          <>
            <RS title="Completed Courses" />
            <div style={{ display: 'flex', flexWrap: 'wrap' }}>
              {user.completedCourses.map((c) => (
                <Pill key={c} label={c} color={C.gray} bg="#F8FAFC" border={C.border} />
              ))}
            </div>
          </>
        )}

        {/* Online Presence */}
        {(user.linkedinUrl || user.githubUrl || user.portfolioUrl) && (
          <>
            <RS title="Online Presence" />
            <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
              {user.linkedinUrl && (
                <span style={{ fontSize: 9, color: C.blue }}>
                  {user.linkedinUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              )}
              {user.githubUrl && (
                <span style={{ fontSize: 9, color: C.blue }}>
                  {user.githubUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              )}
              {user.portfolioUrl && (
                <span style={{ fontSize: 9, color: C.blue }}>
                  {user.portfolioUrl.replace(/^https?:\/\/(www\.)?/, '')}
                </span>
              )}
            </div>
          </>
        )}

        {/* Footer */}
        {hasContent && (
          <div
            style={{
              marginTop: 16,
              paddingTop: 12,
              borderTop: `1px solid ${C.border}`,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div style={{ fontSize: 7.5, color: C.light }}>Generated by Nextern</div>
            <div style={{ fontSize: 7.5, color: C.light }}>
              {new Date().toLocaleDateString('en-US', {
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Types ──────────────────────────────────────────────────────────────────
type UserData = {
  name: string;
  email: string;
  image?: string;
  phone?: string;
  bio?: string;
  studentId?: string;
  university?: string;
  department?: string;
  yearOfStudy?: number;
  currentSemester?: string;
  cgpa?: number;
  skills: string[];
  completedCourses: string[];
  linkedinUrl?: string;
  githubUrl?: string;
  portfolioUrl?: string;
  city?: string;
  resumeUrl?: string;
  generatedResumeUrl?: string;
  isGraduated?: boolean;
  profileCompleteness?: number;
  opportunityScore?: number;
  projects: {
    title: string;
    description: string;
    techStack: string[];
    projectUrl?: string;
    repoUrl?: string;
  }[];
  certifications: { name: string; issuedBy: string; credentialUrl?: string }[];
};

// ── Main page ──────────────────────────────────────────────────────────────
export default function StudentProfilePage() {
  const [user, setUser] = useState<UserData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [badges, setBadges] = useState<
    { badgeName: string; badgeIcon: string; awardedAt: string; badgeSlug: string }[]
  >([]);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  // ── Resume upload state ──
  const { startUpload, isUploading } = useUploadThing('resumeUploader');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [resumeUploading, setResumeUploading] = useState(false);
  const [resumeError, setResumeError] = useState('');
  const [resumeSaved, setResumeSaved] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const uploading = resumeUploading || isUploading;

  const resumeUrlRef = useRef<string | undefined>(undefined);

  useEffect(() => {
    resumeUrlRef.current = user?.resumeUrl;
  }, [user?.resumeUrl]);

  // ── Live preview of in-platform resume (updates on save) ──
  const [previewUser, setPreviewUser] = useState<UserData | null>(null);

  const [form, setFormState] = useState({
    name: '',
    phone: '',
    bio: '',
    studentId: '',
    university: '',
    department: '',
    yearOfStudy: '',
    currentSemester: '',
    cgpa: '',
    skills: [] as string[],
    completedCourses: [] as string[],
    linkedinUrl: '',
    githubUrl: '',
    portfolioUrl: '',
    city: '',
    isGraduated: false,
    projects: [] as {
      title: string;
      description: string;
      techStack: string[];
      projectUrl: string;
      repoUrl: string;
    }[],
    certifications: [] as { name: string; issuedBy: string; credentialUrl: string }[],
  });

  useEffect(() => {
    fetch('/api/users/profile')
      .then((r) => r.json())
      .then((data) => {
        const u = data.user;
        setUser(u);
        setPreviewUser(u); // initialise preview with saved data
        setFormState({
          name: u.name ?? '',
          phone: u.phone ?? '',
          bio: u.bio ?? '',
          studentId: u.studentId ?? '',
          university: u.university ?? '',
          department: u.department ?? '',
          yearOfStudy: u.yearOfStudy?.toString() ?? '',
          currentSemester: u.currentSemester ?? '',
          cgpa: u.cgpa?.toString() ?? '',
          skills: u.skills ?? [],
          completedCourses: u.completedCourses ?? [],
          linkedinUrl: u.linkedinUrl ?? '',
          githubUrl: u.githubUrl ?? '',
          portfolioUrl: u.portfolioUrl ?? '',
          city: u.city ?? '',
          isGraduated: u.isGraduated ?? false,
          projects: (u.projects ?? []).map((p: UserData['projects'][0]) => ({
            title: p.title ?? '',
            description: p.description ?? '',
            techStack: p.techStack ?? [],
            projectUrl: p.projectUrl ?? '',
            repoUrl: p.repoUrl ?? '',
          })),
          certifications: (u.certifications ?? []).map((c: UserData['certifications'][0]) => ({
            name: c.name ?? '',
            issuedBy: c.issuedBy ?? '',
            credentialUrl: c.credentialUrl ?? '',
          })),
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setFetching(false));

    fetch('/api/badges')
      .then((r) => r.json())
      .then((data) => {
        if (data.badges) setBadges(data.badges);
      })
      .catch(console.error);
  }, []);

  function set(field: string, value: unknown) {
    setFormState((p) => ({ ...p, [field]: value }));
  }

  // Projects
  function addProject() {
    setFormState((p) => ({
      ...p,
      projects: [
        ...p.projects,
        { title: '', description: '', techStack: [], projectUrl: '', repoUrl: '' },
      ],
    }));
  }
  function removeProject(i: number) {
    setFormState((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));
  }
  function setProject(i: number, field: string, value: unknown) {
    setFormState((p) => {
      const u = [...p.projects];
      u[i] = { ...u[i], [field]: value };
      return { ...p, projects: u };
    });
  }

  // Certifications
  function addCert() {
    setFormState((p) => ({
      ...p,
      certifications: [...p.certifications, { name: '', issuedBy: '', credentialUrl: '' }],
    }));
  }
  function removeCert(i: number) {
    setFormState((p) => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }));
  }
  function setCert(i: number, field: string, value: string) {
    setFormState((p) => {
      const u = [...p.certifications];
      u[i] = { ...u[i], [field]: value };
      return { ...p, certifications: u };
    });
  }

  // Resume upload
  function handleFileSelect(file: File) {
    setResumeError('');
    setResumeSaved(false);
    if (file.type !== 'application/pdf') {
      setResumeError('Only PDF files are allowed.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setResumeError('File size must be under 8MB.');
      return;
    }
    setResumeFile(file);
  }

  async function handleResumeUpload() {
    if (!resumeFile) return;
    setResumeUploading(true);
    setResumeError('');
    setResumeSaved(false);
    try {
      const res = await startUpload([resumeFile]);
      if (!res || res.length === 0) {
        setResumeError('Upload failed. Please try again.');
        return;
      }
      setUser((prev) => (prev ? { ...prev, resumeUrl: res[0].ufsUrl } : prev));
      setResumeFile(null);
      setResumeSaved(true);
      setTimeout(() => setResumeSaved(false), 4000);
    } catch (err: unknown) {
      setResumeError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
    } finally {
      setResumeUploading(false);
    }
  }

  async function handleResumeDelete() {
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ resumeUrl: null }),
      });
      if (res.ok) {
        setUser((prev) => (prev ? { ...prev, resumeUrl: undefined } : prev));
        setShowDeleteConfirm(false);
      }
    } catch {
      setResumeError('Failed to delete resume. Please try again.');
      setShowDeleteConfirm(false);
    }
  }

  // ── Save profile ─────────────────────────────────────────────────────
  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const payload = {
        name: form.name,
        phone: form.phone || undefined,
        bio: form.bio || undefined,
        university: form.university || undefined,
        department: form.department || undefined,
        yearOfStudy: form.yearOfStudy ? parseInt(form.yearOfStudy) : undefined,
        currentSemester: form.currentSemester || undefined,
        cgpa: form.cgpa ? parseFloat(form.cgpa) : undefined,
        skills: form.skills,
        completedCourses: form.completedCourses,
        linkedinUrl: form.linkedinUrl || undefined,
        githubUrl: form.githubUrl || undefined,
        portfolioUrl: form.portfolioUrl || undefined,
        city: form.city || undefined,
        isGraduated: form.isGraduated,
      };
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to save');
        return;
      }

      // ── Preserve uploaded resumeUrl — Save Profile never touches it ──
      setUser((prev) => ({ ...data.user, resumeUrl: prev?.resumeUrl }));

      // ── Update the in-platform resume preview with the full saved data including projects/certs ──
      setPreviewUser((prev) => ({
        ...data.user,
        resumeUrl: prev?.resumeUrl ?? user?.resumeUrl,
        projects: form.projects,
        certifications: form.certifications,
      }));

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
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
        }}
      >
        <div style={{ textAlign: 'center', color: C.gray, fontFamily: 'var(--font-body)' }}>
          Loading profile…
        </div>
      </div>
    );
  }

  const completeness = user?.profileCompleteness ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* ── Header ── */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 900, margin: '0 auto', padding: '20px 24px' }}>
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
            <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
              <ProfilePictureUpload
                currentImage={user?.image ?? null}
                name={user?.name ?? ''}
                size={72}
                radius="50%"
                gradient="linear-gradient(135deg, #2563EB, #22D3EE)"
                onUploaded={(url) => {
                  setUser((p) => (p ? { ...p, image: url } : p));
                  setPreviewUser((p) => (p ? { ...p, image: url } : p));
                }}
                onRemoved={() => {
                  setUser((p) => (p ? { ...p, image: undefined } : p));
                  setPreviewUser((p) => (p ? { ...p, image: undefined } : p));
                }}
              />
              <div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 900,
                    color: '#F8FAFC',
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                  }}
                >
                  {user?.name}
                </h1>
                <div style={{ color: C.gray, fontSize: 13, marginTop: 3 }}>
                  {user?.university}
                  {user?.department ? ` · ${user.department}` : ''}
                  {user?.yearOfStudy ? ` · Year ${user.yearOfStudy}` : ''}
                </div>
              </div>
            </div>
            {/* Completeness */}
            <div
              style={{
                background: 'rgba(255,255,255,0.07)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: 14,
                padding: '12px 20px',
                minWidth: 160,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 8,
                }}
              >
                <span style={{ color: '#9FB4D0', fontSize: 12, fontWeight: 600 }}>
                  Profile completeness
                </span>
                <span
                  style={{
                    color: completeness >= 80 ? '#10B981' : '#F59E0B',
                    fontWeight: 800,
                    fontSize: 14,
                  }}
                >
                  {completeness}%
                </span>
              </div>
              <div
                style={{
                  height: 6,
                  background: 'rgba(255,255,255,0.1)',
                  borderRadius: 999,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: `${completeness}%`,
                    height: '100%',
                    background:
                      completeness >= 80
                        ? 'linear-gradient(90deg,#10B981,#34D399)'
                        : 'linear-gradient(90deg,#F59E0B,#FBBF24)',
                    borderRadius: 999,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
      <div
        style={{
          maxWidth: 900,
          margin: '28px auto',
          padding: '0 24px',
          display: 'flex',
          flexDirection: 'column',
          gap: 20,
        }}
      >
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
            <AlertCircle size={15} />
            {error}
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
            <CheckCircle2 size={15} /> Profile saved successfully!
          </div>
        )}

        {/* 1 — Personal Info */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<User size={18} />} label="Personal Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Full Name" required>
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                style={inputBase}
              />
            </Field>
            <Field label="Phone Number">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+8801XXXXXXXXX"
                style={inputBase}
              />
            </Field>
            <Field label="City / District">
              <input
                type="text"
                value={form.city}
                onChange={(e) => set('city', e.target.value)}
                placeholder="e.g. Dhaka"
                style={inputBase}
              />
            </Field>
            <Field label="Email">
              <input
                type="email"
                value={user?.email ?? ''}
                disabled
                style={{ ...inputBase, background: C.bg, color: C.gray, cursor: 'not-allowed' }}
              />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Bio / About Me">
              <textarea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Write a short professional bio about yourself…"
                rows={3}
                style={{ ...inputBase, resize: 'vertical' }}
              />
              <div style={{ fontSize: 11, color: C.light, marginTop: 4 }}>
                {form.bio.length}/500 characters
              </div>
            </Field>
          </div>
        </div>

        {/* 2 — Academic Info */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<GraduationCap size={18} />} label="Academic Information" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="University">
              <select
                value={form.university}
                onChange={(e) => set('university', e.target.value)}
                style={{ ...inputBase, appearance: 'none' as const }}
              >
                <option value="">Select university</option>
                {BD_UNIS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Department">
              <select
                value={form.department}
                onChange={(e) => set('department', e.target.value)}
                style={{ ...inputBase, appearance: 'none' as const }}
              >
                <option value="">Select department</option>
                {BD_DEPTS.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Student ID">
              <input
                type="text"
                value={form.studentId}
                onChange={(e) => set('studentId', e.target.value)}
                placeholder="e.g. 22301206"
                style={inputBase}
              />
            </Field>
            <Field label="Year of Study">
              <select
                value={form.yearOfStudy}
                onChange={(e) => set('yearOfStudy', e.target.value)}
                style={{ ...inputBase, appearance: 'none' as const }}
              >
                <option value="">Select year</option>
                {[1, 2, 3, 4, 5].map((y) => (
                  <option key={y} value={y}>
                    Year {y}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Current Semester">
              <input
                type="text"
                value={form.currentSemester}
                onChange={(e) => set('currentSemester', e.target.value)}
                placeholder="e.g. Spring 2026"
                style={inputBase}
              />
            </Field>
            <Field label="CGPA (out of 4.0)">
              <input
                type="number"
                value={form.cgpa}
                onChange={(e) => set('cgpa', e.target.value)}
                placeholder="e.g. 3.75"
                min="0"
                max="4"
                step="0.01"
                style={inputBase}
              />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <label
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                cursor: 'pointer',
                fontSize: 14,
                color: C.gray,
                fontWeight: 600,
              }}
            >
              <input
                type="checkbox"
                checked={form.isGraduated}
                onChange={(e) => set('isGraduated', e.target.checked)}
                style={{ width: 16, height: 16, accentColor: C.blue }}
              />
              I have graduated
            </label>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Completed Courses">
              <TagInput
                tags={form.completedCourses}
                onChange={(v) => set('completedCourses', v)}
                placeholder="e.g. CSE110, CSE220 — press Enter"
              />
            </Field>
          </div>
        </div>

        {/* 3 — Resume (PDF Upload) */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<FileText size={18} />} label="Resume" />

          {resumeSaved && (
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
                marginBottom: 16,
              }}
            >
              <CheckCircle2 size={15} /> Resume uploaded successfully!
            </div>
          )}

          {user?.resumeUrl ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#F0FDF4',
                border: '1px solid #A7F3D0',
                borderRadius: 14,
                padding: '14px 18px',
                marginBottom: 18,
                flexWrap: 'wrap',
                gap: 12,
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 10,
                    background: '#DCFCE7',
                    border: '1px solid #A7F3D0',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#16A34A',
                    flexShrink: 0,
                  }}
                >
                  <FileText size={18} />
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#065F46' }}>
                    Resume on file
                  </div>
                  <div style={{ fontSize: 12, color: '#16A34A', marginTop: 2 }}>
                    PDF · Attached to all your job applications
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                <a
                  href={user.resumeUrl}
                  target="_blank"
                  rel="noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: '#16A34A',
                    color: '#fff',
                    padding: '8px 14px',
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    textDecoration: 'none',
                  }}
                >
                  <ExternalLink size={13} /> View
                </a>
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(true)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 6,
                    background: C.dangerBg,
                    color: C.danger,
                    border: `1px solid ${C.dangerBorder}`,
                    padding: '8px 14px',
                    borderRadius: 9,
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: 'pointer',
                  }}
                >
                  <Trash2 size={13} /> Delete
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                background: '#F8FAFC',
                border: '1px dashed #CBD5E1',
                borderRadius: 14,
                padding: '14px 18px',
                marginBottom: 18,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  background: '#F1F5F9',
                  border: '1px solid #E2E8F0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: C.light,
                  flexShrink: 0,
                }}
              >
                <FileText size={18} />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text }}>
                  No resume uploaded yet
                </div>
                <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>
                  Upload a PDF to attach it automatically to your job applications
                </div>
              </div>
            </div>
          )}

          {/* Drop zone */}
          <label
            htmlFor="resume-upload"
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 12,
              padding: '32px 24px',
              border: `2px dashed ${dragOver ? C.blue : resumeFile ? C.blue : '#CBD5E1'}`,
              borderRadius: 16,
              background: dragOver ? C.blueBg : resumeFile ? '#F8FBFF' : '#FAFBFC',
              cursor: uploading ? 'not-allowed' : 'pointer',
              transition: 'all 0.2s ease',
              textAlign: 'center',
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault();
              setDragOver(false);
              const f = e.dataTransfer.files?.[0];
              if (f) handleFileSelect(f);
            }}
          >
            <input
              id="resume-upload"
              type="file"
              accept="application/pdf"
              disabled={uploading}
              style={{ display: 'none' }}
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFileSelect(f);
                e.target.value = '';
              }}
            />
            <div
              style={{
                width: 56,
                height: 56,
                borderRadius: 16,
                background: resumeFile ? C.blueBg : '#F1F5F9',
                border: `1.5px solid ${resumeFile ? C.blueBorder : C.border}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: resumeFile ? C.blue : C.light,
              }}
            >
              {resumeUploading ? (
                <span
                  style={{
                    width: 22,
                    height: 22,
                    border: `3px solid ${C.blueBorder}`,
                    borderTopColor: C.blue,
                    borderRadius: '50%',
                    display: 'inline-block',
                    animation: 'spin 0.7s linear infinite',
                  }}
                />
              ) : (
                <FileText size={24} />
              )}
            </div>
            {resumeFile ? (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.blue }}>
                  {resumeFile.name}
                </div>
                <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>
                  {(resumeFile.size / 1024 / 1024).toFixed(2)} MB · PDF · Ready to upload
                </div>
              </div>
            ) : (
              <div>
                <div style={{ fontSize: 15, fontWeight: 700, color: C.text }}>
                  {dragOver ? 'Drop your resume here' : 'Drag & drop your resume'}
                </div>
                <div style={{ fontSize: 13, color: C.light, marginTop: 4 }}>
                  or{' '}
                  <span style={{ color: C.blue, fontWeight: 700, textDecoration: 'underline' }}>
                    click to browse
                  </span>{' '}
                  — PDF only, max 8MB
                </div>
              </div>
            )}
          </label>

          {resumeError && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: C.dangerBg,
                border: `1px solid ${C.dangerBorder}`,
                borderRadius: 10,
                padding: '10px 14px',
                color: '#991B1B',
                fontSize: 13,
                marginTop: 12,
              }}
            >
              <AlertCircle size={14} /> {resumeError}
            </div>
          )}

          {resumeFile && (
            <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
              <button
                type="button"
                onClick={handleResumeUpload}
                disabled={uploading}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 7,
                  background: resumeUploading
                    ? '#93C5FD'
                    : `linear-gradient(135deg,${C.blue},#1D4ED8)`,
                  color: '#fff',
                  border: 'none',
                  borderRadius: 10,
                  padding: '10px 22px',
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                  fontFamily: 'var(--font-display)',
                  boxShadow: resumeUploading ? 'none' : '0 4px 12px rgba(37,99,235,0.3)',
                }}
              >
                {resumeUploading ? (
                  <>
                    <span
                      style={{
                        width: 13,
                        height: 13,
                        border: '2px solid rgba(255,255,255,0.3)',
                        borderTopColor: '#fff',
                        borderRadius: '50%',
                        display: 'inline-block',
                        animation: 'spin 0.7s linear infinite',
                      }}
                    />
                    Uploading…
                  </>
                ) : (
                  <>
                    <Upload size={14} /> Upload Resume
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => {
                  setResumeFile(null);
                  setResumeError('');
                }}
                disabled={uploading}
                style={{
                  padding: '10px 18px',
                  background: C.white,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 10,
                  color: C.gray,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: uploading ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          )}
          <div style={{ fontSize: 12, color: C.light, marginTop: 12 }}>
            📎 Your resume is automatically attached to every job application you submit on Nextern.
            {user?.resumeUrl ? ' Upload a new file to replace the current one.' : ''}
          </div>
        </div>

        {/* ── NEW: In-Platform Resume ── */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: `1px solid ${C.bg}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: C.teal }}>
                <Layers size={18} />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'var(--font-display)',
                }}
              >
                In-Platform Resume
              </div>
            </div>
            <Link
              href="/student/resume"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: C.tealBg,
                color: C.teal,
                border: `1px solid ${C.tealBorder}`,
                padding: '7px 14px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                textDecoration: 'none',
              }}
            >
              <Eye size={13} /> Full View & Download
            </Link>
          </div>
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16, lineHeight: 1.6 }}>
            This is your Nextern-generated resume — built from your profile data above. It updates
            every time you <strong>Save Profile</strong>. Use the Resume Builder to download it as a
            PDF.
          </div>
          <InPlatformResume user={previewUser} />
        </div>

        {/* 4 — Skills */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<Code2 size={18} />} label="Skills" />
          <TagInput
            tags={form.skills}
            onChange={(v) => set('skills', v)}
            placeholder="e.g. React, Python, Figma — press Enter"
            color="#7C3AED"
            bg="#EDE9FE"
            border="#DDD6FE"
          />
          <div style={{ fontSize: 12, color: C.light, marginTop: 8 }}>
            These skills feed directly into the AI fit scoring engine for job matching.
          </div>
        </div>

        {/* 5 — Projects */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: `1px solid ${C.bg}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: C.blue }}>
                <Briefcase size={18} />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Projects
              </div>
            </div>
            <button
              type="button"
              onClick={addProject}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: C.blueBg,
                color: C.blue,
                border: `1px solid ${C.blueBorder}`,
                padding: '7px 14px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Add Project
            </button>
          </div>
          {form.projects.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: C.light,
                fontSize: 14,
                border: '1px dashed #CBD5E1',
                borderRadius: 12,
              }}
            >
              No projects added yet. Click Add Project to get started.
            </div>
          )}
          {form.projects.map((proj, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '18px 20px',
                marginBottom: 12,
                background: '#FAFBFC',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gray }}>Project {i + 1}</div>
                <button
                  type="button"
                  onClick={() => removeProject(i)}
                  style={{
                    background: C.dangerBg,
                    color: C.danger,
                    border: `1px solid ${C.dangerBorder}`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Project Title" required>
                  <input
                    type="text"
                    value={proj.title}
                    onChange={(e) => setProject(i, 'title', e.target.value)}
                    placeholder="e.g. E-Commerce Platform"
                    style={inputBase}
                  />
                </Field>
                <Field label="Live URL">
                  <input
                    type="url"
                    value={proj.projectUrl}
                    onChange={(e) => setProject(i, 'projectUrl', e.target.value)}
                    placeholder="https://myproject.com"
                    style={inputBase}
                  />
                </Field>
                <Field label="GitHub Repo">
                  <input
                    type="url"
                    value={proj.repoUrl}
                    onChange={(e) => setProject(i, 'repoUrl', e.target.value)}
                    placeholder="https://github.com/..."
                    style={inputBase}
                  />
                </Field>
              </div>
              <div style={{ marginTop: 12 }}>
                <Field label="Description">
                  <textarea
                    value={proj.description}
                    onChange={(e) => setProject(i, 'description', e.target.value)}
                    placeholder="What did you build and what technologies did you use?"
                    rows={2}
                    style={{ ...inputBase, resize: 'vertical' }}
                  />
                </Field>
              </div>
              <div style={{ marginTop: 12 }}>
                <Field label="Tech Stack">
                  <TagInput
                    tags={proj.techStack}
                    onChange={(v) => setProject(i, 'techStack', v)}
                    placeholder="e.g. React, Node.js — press Enter"
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        {/* 6 — Certifications */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 20,
              paddingBottom: 12,
              borderBottom: `1px solid ${C.bg}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ color: C.blue }}>
                <Award size={18} />
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Certifications
              </div>
            </div>
            <button
              type="button"
              onClick={addCert}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                background: C.blueBg,
                color: C.blue,
                border: `1px solid ${C.blueBorder}`,
                padding: '7px 14px',
                borderRadius: 9,
                fontSize: 12,
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              <Plus size={13} /> Add Certificate
            </button>
          </div>
          {form.certifications.length === 0 && (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: C.light,
                fontSize: 14,
                border: '1px dashed #CBD5E1',
                borderRadius: 12,
              }}
            >
              No certifications added yet.
            </div>
          )}
          {form.certifications.map((cert, i) => (
            <div
              key={i}
              style={{
                border: `1px solid ${C.border}`,
                borderRadius: 14,
                padding: '18px 20px',
                marginBottom: 12,
                background: '#FAFBFC',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.gray }}>
                  Certificate {i + 1}
                </div>
                <button
                  type="button"
                  onClick={() => removeCert(i)}
                  style={{
                    background: C.dangerBg,
                    color: C.danger,
                    border: `1px solid ${C.dangerBorder}`,
                    borderRadius: 8,
                    padding: '4px 10px',
                    cursor: 'pointer',
                    fontSize: 12,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <Trash2 size={12} /> Remove
                </button>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Field label="Certificate Name" required>
                  <input
                    type="text"
                    value={cert.name}
                    onChange={(e) => setCert(i, 'name', e.target.value)}
                    placeholder="e.g. AWS Cloud Practitioner"
                    style={inputBase}
                  />
                </Field>
                <Field label="Issued By" required>
                  <input
                    type="text"
                    value={cert.issuedBy}
                    onChange={(e) => setCert(i, 'issuedBy', e.target.value)}
                    placeholder="e.g. Amazon Web Services"
                    style={inputBase}
                  />
                </Field>
                <Field label="Credential URL">
                  <input
                    type="url"
                    value={cert.credentialUrl}
                    onChange={(e) => setCert(i, 'credentialUrl', e.target.value)}
                    placeholder="https://credential.net/..."
                    style={inputBase}
                  />
                </Field>
              </div>
            </div>
          ))}
        </div>

        {/* 7 — Online Presence */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<Globe size={18} />} label="Online Presence" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="LinkedIn URL">
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#0A66C2',
                  }}
                >
                  <Linkedin size={15} />
                </div>
                <input
                  type="url"
                  value={form.linkedinUrl}
                  onChange={(e) => set('linkedinUrl', e.target.value)}
                  placeholder="https://linkedin.com/in/yourname"
                  style={{ ...inputBase, paddingLeft: 36 }}
                />
              </div>
            </Field>
            <Field label="GitHub URL">
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: C.dark,
                  }}
                >
                  <Github size={15} />
                </div>
                <input
                  type="url"
                  value={form.githubUrl}
                  onChange={(e) => set('githubUrl', e.target.value)}
                  placeholder="https://github.com/yourname"
                  style={{ ...inputBase, paddingLeft: 36 }}
                />
              </div>
            </Field>
            <Field label="Portfolio URL">
              <div style={{ position: 'relative' }}>
                <div
                  style={{
                    position: 'absolute',
                    left: 12,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: C.blue,
                  }}
                >
                  <Globe size={15} />
                </div>
                <input
                  type="url"
                  value={form.portfolioUrl}
                  onChange={(e) => set('portfolioUrl', e.target.value)}
                  placeholder="https://yourportfolio.com"
                  style={{ ...inputBase, paddingLeft: 36 }}
                />
              </div>
            </Field>
          </div>
        </div>

        {/* 8 — Badges */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<Award size={18} />} label="Badges & Achievements" />
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>
            Badges you earn on Nextern are permanently displayed here to showcase your verified
            achievements.
          </div>
          {badges.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '24px',
                color: C.light,
                fontSize: 14,
                border: '1px dashed #CBD5E1',
                borderRadius: 12,
              }}
            >
              No badges earned yet. Keep engaging with the platform to unlock achievements!
            </div>
          ) : (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))',
                gap: 12,
              }}
            >
              {badges.map((b) => (
                <div
                  key={`${b.badgeSlug}-${b.awardedAt}`}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    padding: '12px',
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    borderRadius: 12,
                  }}
                >
                  <div style={{ fontSize: 24 }}>{b.badgeIcon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                      {b.badgeName}
                    </div>
                    <div style={{ fontSize: 11, color: C.gray }}>
                      Earned {new Date(b.awardedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 32px',
              background: saving ? '#93C5FD' : `linear-gradient(135deg,${C.blue},#1D4ED8)`,
              color: C.white,
              border: 'none',
              borderRadius: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(37,99,235,0.35)',
            }}
          >
            <Save size={16} />
            {saving ? 'Saving…' : 'Save Profile'}
          </button>
        </div>
      </div>

      {/* Delete resume modal */}
      {showDeleteConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 999,
            background: 'rgba(15,23,42,0.55)',
            backdropFilter: 'blur(4px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
          }}
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 20,
              padding: '32px 28px',
              maxWidth: 400,
              width: '100%',
              boxShadow: '0 24px 60px rgba(15,23,42,0.18)',
              border: '1px solid #E2E8F0',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: 16,
                background: C.dangerBg,
                border: `1px solid ${C.dangerBorder}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: C.danger,
                margin: '0 auto 18px',
              }}
            >
              <Trash2 size={22} />
            </div>
            <h3
              style={{
                margin: 0,
                fontSize: 18,
                fontWeight: 800,
                color: C.text,
                fontFamily: 'var(--font-display)',
                textAlign: 'center',
              }}
            >
              Delete resume?
            </h3>
            <p
              style={{
                margin: '10px 0 24px',
                fontSize: 14,
                color: C.gray,
                lineHeight: 1.6,
                textAlign: 'center',
              }}
            >
              Your resume will be removed from your profile and will no longer be attached to future
              job applications. This cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: C.white,
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 12,
                  color: C.gray,
                  fontSize: 14,
                  fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResumeDelete}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  background: C.danger,
                  border: 'none',
                  borderRadius: 12,
                  color: '#fff',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 4px 12px rgba(239,68,68,0.3)',
                }}
              >
                Yes, delete it
              </button>
            </div>
          </div>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
