'use client';
// src/app/advisor/events/new/page.tsx
// Advisor and dept_head can post webinars and workshops only

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, Rocket } from 'lucide-react';

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
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  purple: '#7C3AED',
  purpleBg: '#EDE9FE',
  purpleBorder: '#DDD6FE',
};

const inputBase: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '11px 14px',
  border: `1.5px solid ${C.border}`,
  borderRadius: 10,
  fontSize: 14,
  fontFamily: 'var(--font-body)',
  outline: 'none',
  color: C.text,
  background: C.white,
};

function Field({
  label,
  required = true,
  error,
  children,
}: {
  label: string;
  required?: boolean;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        style={{ display: 'block', fontSize: 13, fontWeight: 700, color: C.muted, marginBottom: 7 }}
      >
        {label}
        {required && <span style={{ color: C.danger, marginLeft: 2 }}>*</span>}
      </label>
      {children}
      {error && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 5,
            marginTop: 5,
            color: C.danger,
            fontSize: 12,
          }}
        >
          <AlertCircle size={13} />
          {error}
        </div>
      )}
    </div>
  );
}

function TagInput({
  label,
  tags,
  onChange,
  placeholder,
}: {
  label: string;
  tags: string[];
  onChange: (t: string[]) => void;
  placeholder?: string;
}) {
  const [input, setInput] = useState('');
  function add() {
    const v = input.trim();
    if (v && !tags.includes(v)) onChange([...tags, v]);
    setInput('');
  }
  return (
    <Field label={label} required={false}>
      <div
        style={{
          border: `1.5px solid ${C.border}`,
          borderRadius: 10,
          padding: '8px 10px',
          background: C.white,
          minHeight: 46,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: 6,
            marginBottom: tags.length > 0 ? 8 : 0,
          }}
        >
          {tags.map((t) => (
            <span
              key={t}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: C.purpleBg,
                color: C.purple,
                border: `1px solid ${C.purpleBorder}`,
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
                  color: C.purple,
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
              fontFamily: 'var(--font-body)',
              color: C.text,
              background: 'transparent',
            }}
          />
          <button
            type="button"
            onClick={add}
            style={{
              background: C.purpleBg,
              color: C.purple,
              border: 'none',
              borderRadius: 7,
              padding: '4px 10px',
              cursor: 'pointer',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Field>
  );
}

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

export default function NewEventPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    type: 'webinar' as 'webinar' | 'workshop',
    title: '',
    description: '',
    locationType: 'remote' as 'onsite' | 'remote' | 'hybrid',
    city: '',
    applicationDeadline: '',
    startDate: '',
    targetUniversities: [] as string[],
    targetDepartments: [] as string[],
    targetYears: [] as number[],
    requiredSkills: [] as string[],
    academicSession: '',
    isActive: true,
  });

  function set(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
    setErrors((p) => {
      const n = { ...p };
      delete n[field];
      return n;
    });
  }

  function validate() {
    const errs: Record<string, string> = {};
    if (!form.title.trim()) errs.title = 'Title is required';
    if (form.description.length < 20) errs.description = 'At least 20 characters required';
    if (!form.applicationDeadline) errs.applicationDeadline = 'Event deadline is required';
    if (!form.startDate) errs.startDate = 'Event date is required';
    if (form.applicationDeadline && form.startDate && form.startDate < form.applicationDeadline) {
      errs.startDate = 'Event date must be on or after the registration deadline';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(isActive: boolean) {
    if (!validate()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          description: form.description,
          locationType: form.locationType,
          city: form.city || undefined,
          applicationDeadline: form.applicationDeadline,
          startDate: form.startDate,
          targetUniversities: form.targetUniversities,
          targetDepartments: form.targetDepartments,
          targetYears: form.targetYears,
          requiredSkills: form.requiredSkills,
          academicSession: form.academicSession || undefined,
          isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to create event');
        return;
      }
      router.push('/advisor/dashboard');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo})`,
          padding: '24px 0 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 16 }}>
            <Link
              href="/advisor/dashboard"
              style={{ color: C.gray, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
            >
              ← Back to Dashboard
            </Link>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <div
              style={{
                background: C.purpleBg,
                border: `1px solid ${C.purpleBorder}`,
                borderRadius: 10,
                padding: '4px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: C.purple,
              }}
            >
              Advisor / Dept Head
            </div>
          </div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: '#F8FAFC',
              fontFamily: 'var(--font-display)',
              marginBottom: 4,
            }}
          >
            Post a Webinar or Workshop
          </h1>
          <p style={{ color: C.gray, fontSize: 13 }}>
            Publish academic events for students across your institution. Students can register
            directly from the job feed.
          </p>
        </div>
      </div>

      <div style={{ maxWidth: 720, margin: '28px auto', padding: '0 24px' }}>
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
              marginBottom: 20,
            }}
          >
            <AlertCircle size={15} />
            {error}
          </div>
        )}

        <div
          style={{
            background: C.white,
            borderRadius: 20,
            border: `1px solid ${C.border}`,
            boxShadow: '0 2px 16px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '32px 36px', display: 'flex', flexDirection: 'column', gap: 22 }}>
            {/* Event type */}
            <Field label="Event Type">
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  { v: 'webinar', l: '🌐 Webinar', desc: 'Online session, live or recorded' },
                  { v: 'workshop', l: '🔧 Workshop', desc: 'Hands-on skill building session' },
                ].map((t) => (
                  <button
                    key={t.v}
                    type="button"
                    onClick={() => set('type', t.v)}
                    style={{
                      padding: '14px 16px',
                      borderRadius: 12,
                      border: `2px solid ${form.type === t.v ? C.purple : C.border}`,
                      background: form.type === t.v ? C.purpleBg : C.white,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: form.type === t.v ? C.purple : C.text,
                      }}
                    >
                      {t.l}
                    </div>
                    <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </Field>

            {/* Title */}
            <Field label="Event Title" error={errors.title}>
              <input
                type="text"
                value={form.title}
                onChange={(e) => set('title', e.target.value)}
                placeholder="e.g. Introduction to Machine Learning — Spring Workshop"
                style={{ ...inputBase, borderColor: errors.title ? C.dangerBorder : C.border }}
              />
            </Field>

            {/* Description */}
            <Field label="Description" error={errors.description}>
              <textarea
                value={form.description}
                onChange={(e) => set('description', e.target.value)}
                placeholder="Describe what students will learn, prerequisites, agenda, speaker info…"
                rows={5}
                style={{
                  ...inputBase,
                  resize: 'vertical',
                  borderColor: errors.description ? C.dangerBorder : C.border,
                }}
              />
            </Field>

            {/* Location */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Format">
                <select
                  value={form.locationType}
                  onChange={(e) => set('locationType', e.target.value)}
                  style={{ ...inputBase, appearance: 'none' as const }}
                >
                  <option value="remote">Online / Remote</option>
                  <option value="onsite">In-Person</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </Field>
              <Field label="Venue / City" required={false}>
                <input
                  type="text"
                  value={form.city}
                  onChange={(e) => set('city', e.target.value)}
                  placeholder="e.g. Dhaka, BRAC University Campus"
                  style={inputBase}
                />
              </Field>
            </div>

            {/* Dates */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <Field label="Registration Deadline" error={errors.applicationDeadline}>
                <input
                  type="date"
                  value={form.applicationDeadline}
                  onChange={(e) => set('applicationDeadline', e.target.value)}
                  style={{
                    ...inputBase,
                    borderColor: errors.applicationDeadline ? C.dangerBorder : C.border,
                  }}
                />
              </Field>
              <Field label="Event Date" error={errors.startDate}>
                <input
                  type="date"
                  value={form.startDate}
                  onChange={(e) => set('startDate', e.target.value)}
                  style={{
                    ...inputBase,
                    borderColor: errors.startDate ? C.dangerBorder : C.border,
                  }}
                />
              </Field>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div />
              <Field label="Academic Session" required={false}>
                <input
                  type="text"
                  value={form.academicSession}
                  onChange={(e) => set('academicSession', e.target.value)}
                  placeholder="e.g. Spring 2026"
                  style={inputBase}
                />
              </Field>
            </div>

            {/* Targeting */}
            <div
              style={{
                background: '#FAFBFC',
                borderRadius: 14,
                border: `1px solid ${C.border}`,
                padding: '20px',
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.light,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 18,
                }}
              >
                Targeting — who should see this event
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
                {/* Universities */}
                <Field label="Target Universities (blank = all)" required={false}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {BD_UNIS.map((u) => {
                      const on = form.targetUniversities.includes(u);
                      return (
                        <button
                          key={u}
                          type="button"
                          onClick={() =>
                            set(
                              'targetUniversities',
                              on
                                ? form.targetUniversities.filter((x) => x !== u)
                                : [...form.targetUniversities, u]
                            )
                          }
                          style={{
                            padding: '5px 12px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            border: `1.5px solid ${on ? C.purple : C.border}`,
                            background: on ? C.purpleBg : C.white,
                            color: on ? C.purple : C.gray,
                            cursor: 'pointer',
                          }}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Departments */}
                <Field label="Target Departments (blank = all)" required={false}>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
                    {BD_DEPTS.map((d) => {
                      const on = form.targetDepartments.includes(d);
                      return (
                        <button
                          key={d}
                          type="button"
                          onClick={() =>
                            set(
                              'targetDepartments',
                              on
                                ? form.targetDepartments.filter((x) => x !== d)
                                : [...form.targetDepartments, d]
                            )
                          }
                          style={{
                            padding: '5px 12px',
                            borderRadius: 999,
                            fontSize: 11,
                            fontWeight: 600,
                            border: `1.5px solid ${on ? C.purple : C.border}`,
                            background: on ? C.purpleBg : C.white,
                            color: on ? C.purple : C.gray,
                            cursor: 'pointer',
                          }}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                {/* Year of study */}
                <Field label="Target Year of Study (blank = all)" required={false}>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {[1, 2, 3, 4, 5].map((y) => {
                      const on = form.targetYears.includes(y);
                      return (
                        <button
                          key={y}
                          type="button"
                          onClick={() =>
                            set(
                              'targetYears',
                              on
                                ? form.targetYears.filter((x) => x !== y)
                                : [...form.targetYears, y]
                            )
                          }
                          style={{
                            width: 52,
                            height: 44,
                            borderRadius: 10,
                            border: `1.5px solid ${on ? C.purple : C.border}`,
                            background: on ? C.purpleBg : C.white,
                            color: on ? C.purple : C.gray,
                            fontWeight: 700,
                            fontSize: 14,
                            cursor: 'pointer',
                          }}
                        >
                          Y{y}
                        </button>
                      );
                    })}
                  </div>
                </Field>

                <TagInput
                  label="Related Skills / Topics"
                  tags={form.requiredSkills}
                  onChange={(v) => set('requiredSkills', v)}
                  placeholder="e.g. Machine Learning, Python — press Enter"
                />
              </div>
            </div>

            {/* Info box */}
            <div
              style={{
                background: C.purpleBg,
                border: `1px solid ${C.purpleBorder}`,
                borderRadius: 12,
                padding: '12px 16px',
              }}
            >
              <p style={{ color: C.purple, fontSize: 13, margin: 0, fontWeight: 600 }}>
                📅 This event will appear in the student job feed under the Webinar / Workshop
                filter. Students register directly from the platform and their registration is
                tracked in their applications dashboard.
              </p>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              borderTop: `1px solid ${C.bg}`,
              padding: '20px 36px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: '#FAFBFC',
            }}
          >
            <Link
              href="/advisor/dashboard"
              style={{
                padding: '10px 20px',
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                background: C.white,
                color: C.gray,
                textDecoration: 'none',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              Cancel
            </Link>
            <div style={{ display: 'flex', gap: 10 }}>
              <button
                onClick={() => handleSubmit(false)}
                disabled={loading}
                style={{
                  padding: '10px 20px',
                  border: `1.5px solid ${C.border}`,
                  borderRadius: 10,
                  background: C.white,
                  color: C.gray,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 600,
                }}
              >
                Save as Draft
              </button>
              <button
                onClick={() => handleSubmit(true)}
                disabled={loading}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 7,
                  padding: '10px 28px',
                  background: loading
                    ? C.purpleBorder
                    : `linear-gradient(135deg, ${C.purple}, #6D28D9)`,
                  color: C.white,
                  border: 'none',
                  borderRadius: 10,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  fontSize: 14,
                  fontWeight: 700,
                  fontFamily: 'var(--font-display)',
                  boxShadow: loading ? 'none' : '0 4px 12px rgba(124,58,237,0.35)',
                }}
              >
                <Rocket size={15} />
                {loading ? 'Publishing…' : 'Publish Event'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
