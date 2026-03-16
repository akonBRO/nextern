'use client';
// src/app/student/profile/page.tsx
// Student profile — view + edit all academic and career fields

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
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
} from 'lucide-react';

const C = {
  blue: '#2563EB',
  indigo: '#1E293B',
  bg: '#F1F5F9',
  gray: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#fff',
  dark: '#0F172A',
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

export default function StudentProfilePage() {
  // ✅ router removed — it was assigned but never used
  const [user, setUser] = useState<UserData | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
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
        setForm({
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
  }, []);

  function set(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  function addProject() {
    setForm((p) => ({
      ...p,
      projects: [
        ...p.projects,
        { title: '', description: '', techStack: [], projectUrl: '', repoUrl: '' },
      ],
    }));
  }
  function removeProject(i: number) {
    setForm((p) => ({ ...p, projects: p.projects.filter((_, idx) => idx !== i) }));
  }
  function setProject(i: number, field: string, value: unknown) {
    setForm((p) => {
      const updated = [...p.projects];
      updated[i] = { ...updated[i], [field]: value };
      return { ...p, projects: updated };
    });
  }

  function addCert() {
    setForm((p) => ({
      ...p,
      certifications: [...p.certifications, { name: '', issuedBy: '', credentialUrl: '' }],
    }));
  }
  function removeCert(i: number) {
    setForm((p) => ({ ...p, certifications: p.certifications.filter((_, idx) => idx !== i) }));
  }
  function setCert(i: number, field: string, value: string) {
    setForm((p) => {
      const updated = [...p.certifications];
      updated[i] = { ...updated[i], [field]: value };
      return { ...p, certifications: updated };
    });
  }

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
      setUser(data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  if (fetching)
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

  const completeness = user?.profileCompleteness ?? 0;

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
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
              {/* ✅ Avatar: <Image> instead of <img> */}
              <div
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 28,
                  fontWeight: 900,
                  color: '#fff',
                  fontFamily: 'var(--font-display)',
                  flexShrink: 0,
                  border: '3px solid rgba(255,255,255,0.15)',
                  overflow: 'hidden',
                }}
              >
                {user?.image ? (
                  <Image
                    src={user.image}
                    alt={user.name ?? ''}
                    width={72}
                    height={72}
                    style={{ objectFit: 'cover' }}
                  />
                ) : (
                  (user?.name?.charAt(0) ?? 'S')
                )}
              </div>
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
                        ? 'linear-gradient(90deg, #10B981, #34D399)'
                        : 'linear-gradient(90deg, #F59E0B, #FBBF24)',
                    borderRadius: 999,
                    transition: 'width 0.4s ease',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

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

        {/* ── Section 1: Personal Info ── */}
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

        {/* ── Section 2: Academic Info ── */}
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

        {/* ── Section 3: Skills ── */}
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

        {/* ── Section 4: Projects ── */}
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

        {/* ── Section 5: Certifications ── */}
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

        {/* ── Section 6: Online Presence ── */}
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
              background: saving ? '#93C5FD' : `linear-gradient(135deg, ${C.blue}, #1D4ED8)`,
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
    </div>
  );
}
