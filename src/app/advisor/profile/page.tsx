'use client';
// src/app/advisor/profile/page.tsx

import { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  AlertCircle,
  CheckCircle2,
  GraduationCap,
  User,
  Globe,
  Phone,
  Save,
  Linkedin,
  MapPin,
} from 'lucide-react';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';

const C = {
  blue: '#2563EB',
  indigo: '#1E293B',
  bg: '#F1F5F9',
  gray: '#64748B',
  success: '#10B981',
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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
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
      </label>
      {children}
    </div>
  );
}

export default function AdvisorProfilePage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '',
    phone: '',
    bio: '',
    city: '',
    institutionName: '',
    advisorStaffId: '',
    designation: '',
    advisoryDepartment: '',
    linkedinUrl: '',
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
          city: u.city ?? '',
          institutionName: u.institutionName ?? '',
          advisorStaffId: u.advisorStaffId ?? '',
          designation: u.designation ?? '',
          advisoryDepartment: u.advisoryDepartment ?? '',
          linkedinUrl: u.linkedinUrl ?? '',
        });
      })
      .catch(() => setError('Failed to load'))
      .finally(() => setFetching(false));
  }, []);

  function set(field: string, value: string) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: form.name,
          phone: form.phone || undefined,
          bio: form.bio || undefined,
          city: form.city || undefined,
          institutionName: form.institutionName || undefined,
          advisorStaffId: form.advisorStaffId || undefined,
          designation: form.designation || undefined,
          advisoryDepartment: form.advisoryDepartment || undefined,
          linkedinUrl: form.linkedinUrl || undefined,
        }),
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
      setError('Network error.');
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
          fontFamily: 'var(--font-body)',
          color: C.gray,
        }}
      >
        Loading…
      </div>
    );

  const role = user?.role as string;
  const isDeptHead = role === 'dept_head';

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 24px' }}>
          <Link
            href={isDeptHead ? '/dept/dashboard' : '/advisor/dashboard'}
            style={{ color: C.gray, fontSize: 13, textDecoration: 'none', fontWeight: 500 }}
          >
            ← Back to Dashboard
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}>
            <ProfilePictureUpload
              currentImage={(user?.image as string) ?? null}
              name={form.name ?? ''}
              size={72}
              radius="50%"
              gradient="linear-gradient(135deg, #7C3AED, #6D28D9)"
              onUploaded={async (url) => {
                await fetch('/api/users/profile', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image: url }),
                });
                setUser((prev) => (prev ? { ...prev, image: url } : prev));
              }}
              onRemoved={async () => {
                await fetch('/api/users/profile', {
                  method: 'PATCH',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ image: null }),
                });
                setUser((prev) => (prev ? { ...prev, image: undefined } : prev));
              }}
            />
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <span
                  style={{
                    background: '#EDE9FE',
                    color: '#7C3AED',
                    border: '1px solid #DDD6FE',
                    padding: '2px 10px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {isDeptHead ? 'Department Head' : 'Academic Advisor'}
                </span>
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
                {form.name || 'Your Name'}
              </h1>
              <div style={{ color: C.gray, fontSize: 13, marginTop: 3 }}>
                {form.designation || 'Designation not set'}
                {form.institutionName ? ` · ${form.institutionName}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: 820,
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

        {/* Personal */}
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
            <Field label="Full Name">
              <input
                type="text"
                value={form.name}
                onChange={(e) => set('name', e.target.value)}
                style={inputBase}
              />
            </Field>
            <Field label="Phone">
              <input
                type="tel"
                value={form.phone}
                onChange={(e) => set('phone', e.target.value)}
                placeholder="+8801XXXXXXXXX"
                style={inputBase}
              />
            </Field>
            <Field label="City">
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
                value={(user?.email as string) ?? ''}
                disabled
                style={{ ...inputBase, background: C.bg, color: C.gray, cursor: 'not-allowed' }}
              />
            </Field>
          </div>
          <div style={{ marginTop: 16 }}>
            <Field label="Bio / Professional Summary">
              <textarea
                value={form.bio}
                onChange={(e) => set('bio', e.target.value)}
                placeholder="Your academic background, research interests, areas of expertise…"
                rows={3}
                style={{ ...inputBase, resize: 'vertical' }}
              />
            </Field>
          </div>
        </div>

        {/* Academic / Institution */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<GraduationCap size={18} />} label="Academic Position" />
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Institution / University">
              <select
                value={form.institutionName}
                onChange={(e) => set('institutionName', e.target.value)}
                style={{ ...inputBase, appearance: 'none' as const }}
              >
                <option value="">Select institution</option>
                {BD_UNIS.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </Field>
            <Field label={isDeptHead ? 'Department' : 'Advisory Department'}>
              <select
                value={form.advisoryDepartment}
                onChange={(e) => set('advisoryDepartment', e.target.value)}
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
            <Field label="Designation / Title">
              <input
                type="text"
                value={form.designation}
                onChange={(e) => set('designation', e.target.value)}
                placeholder={
                  isDeptHead
                    ? 'e.g. Head of Department, CSE'
                    : 'e.g. Assistant Professor, Academic Advisor'
                }
                style={inputBase}
              />
            </Field>
            <Field label="Staff ID">
              <input
                type="text"
                value={form.advisorStaffId}
                onChange={(e) => set('advisorStaffId', e.target.value)}
                placeholder="e.g. STF-2023-001"
                style={inputBase}
              />
            </Field>
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
          </div>
        </div>

        {/* Save */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 32px',
              background: saving ? '#C4B5FD' : 'linear-gradient(135deg, #7C3AED, #6D28D9)',
              color: C.white,
              border: 'none',
              borderRadius: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(124,58,237,0.35)',
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
