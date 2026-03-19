'use client';
// src/app/dept/events/[eventId]/edit/page.tsx
// Department Head edits their own posted event — mirrors advisor edit

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { AlertCircle, CheckCircle2, ChevronLeft } from 'lucide-react';

const C = {
  blue: '#2563EB',
  indigo: '#1E293B',
  bg: '#F1F5F9',
  gray: '#64748B',
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
  teal: '#0D9488',
  tealBg: '#F0FDFA',
  tealBorder: '#99F6E4',
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

export default function EditDeptEventPage() {
  const params = useParams();
  const router = useRouter();
  const eventId = params?.eventId as string;

  const [fetching, setFetching] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [saved, setSaved] = useState(false);

  const [form, setForm] = useState({
    title: '',
    type: 'webinar' as 'webinar' | 'workshop',
    description: '',
    locationType: 'remote' as 'onsite' | 'remote' | 'hybrid',
    city: '',
    applicationDeadline: '',
    targetUniversities: [] as string[],
    targetDepartments: [] as string[],
    targetYears: [] as number[],
    academicSession: '',
    isActive: true,
  });

  useEffect(() => {
    if (!eventId) return;
    fetch(`/api/jobs/${eventId}`)
      .then((r) => r.json())
      .then((data) => {
        const e = data.job;
        if (!e) return;
        setForm({
          title: e.title ?? '',
          type: e.type ?? 'webinar',
          description: e.description ?? '',
          locationType: e.locationType ?? 'remote',
          city: e.city ?? '',
          applicationDeadline: e.applicationDeadline
            ? new Date(e.applicationDeadline).toISOString().split('T')[0]
            : '',
          targetUniversities: e.targetUniversities ?? [],
          targetDepartments: e.targetDepartments ?? [],
          targetYears: e.targetYears ?? [],
          academicSession: e.academicSession ?? '',
          isActive: e.isActive ?? true,
        });
      })
      .catch(() => setError('Failed to load event'))
      .finally(() => setFetching(false));
  }, [eventId]);

  function set(field: string, value: unknown) {
    setForm((p) => ({ ...p, [field]: value }));
  }

  async function handleSave() {
    if (!form.title.trim()) {
      setError('Title is required');
      return;
    }
    if (!form.applicationDeadline) {
      setError('Deadline is required');
      return;
    }
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const res = await fetch(`/api/jobs/${eventId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: form.title,
          type: form.type,
          description: form.description,
          locationType: form.locationType,
          city: form.city || undefined,
          applicationDeadline: form.applicationDeadline,
          targetUniversities: form.targetUniversities,
          targetDepartments: form.targetDepartments,
          targetYears: form.targetYears,
          academicSession: form.academicSession || undefined,
          isActive: form.isActive,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Failed to update');
        return;
      }
      setSaved(true);
      setTimeout(() => router.push('/dept/events'), 1200);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
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
        Loading event…
      </div>
    );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo})`,
          padding: '24px 0 28px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 720, margin: '0 auto', padding: '0 24px' }}>
          <Link
            href="/dept/events"
            style={{ color: C.gray, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
          >
            ← Back to My Events
          </Link>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 14,
              marginBottom: 6,
            }}
          >
            <span
              style={{
                background: C.tealBg,
                border: `1px solid ${C.tealBorder}`,
                borderRadius: 10,
                padding: '3px 12px',
                fontSize: 12,
                fontWeight: 700,
                color: C.teal,
              }}
            >
              Department Head
            </span>
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
            Edit Event
          </h1>
          <p style={{ color: C.gray, fontSize: 13 }}>
            Update your event details. Changes are reflected immediately.
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
              marginBottom: 20,
            }}
          >
            <CheckCircle2 size={15} /> Saved! Redirecting…
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
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.light,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 18,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${C.bg}`,
                }}
              >
                Event Type
              </div>
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
                      border: `2px solid ${form.type === t.v ? C.teal : C.border}`,
                      background: form.type === t.v ? C.tealBg : C.white,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.15s',
                    }}
                  >
                    <div
                      style={{
                        fontWeight: 700,
                        fontSize: 14,
                        color: form.type === t.v ? C.teal : C.text,
                      }}
                    >
                      {t.l}
                    </div>
                    <div style={{ fontSize: 12, color: C.gray, marginTop: 3 }}>{t.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.light,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 18,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${C.bg}`,
                }}
              >
                Event Details
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Event Title" required>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    style={inputBase}
                  />
                </Field>
                <Field label="Description" required>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    rows={4}
                    style={{ ...inputBase, resize: 'vertical' }}
                  />
                </Field>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
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
                  <Field label="Venue / City">
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="e.g. Dhaka"
                      style={inputBase}
                    />
                  </Field>
                  <Field label="Registration Deadline" required>
                    <input
                      type="date"
                      value={form.applicationDeadline}
                      onChange={(e) => set('applicationDeadline', e.target.value)}
                      style={inputBase}
                    />
                  </Field>
                  <Field label="Academic Session">
                    <input
                      type="text"
                      value={form.academicSession}
                      onChange={(e) => set('academicSession', e.target.value)}
                      placeholder="e.g. Spring 2026"
                      style={inputBase}
                    />
                  </Field>
                </div>
              </div>
            </div>

            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  color: C.light,
                  letterSpacing: 1.2,
                  textTransform: 'uppercase',
                  marginBottom: 18,
                  paddingBottom: 10,
                  borderBottom: `1px solid ${C.bg}`,
                }}
              >
                Targeting
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <Field label="Target Universities (blank = all)">
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
                            border: `1.5px solid ${on ? C.teal : C.border}`,
                            background: on ? C.tealBg : C.white,
                            color: on ? C.teal : C.gray,
                            cursor: 'pointer',
                          }}
                        >
                          {u}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Target Departments (blank = all)">
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
                            border: `1.5px solid ${on ? C.teal : C.border}`,
                            background: on ? C.tealBg : C.white,
                            color: on ? C.teal : C.gray,
                            cursor: 'pointer',
                          }}
                        >
                          {d}
                        </button>
                      );
                    })}
                  </div>
                </Field>
                <Field label="Year of Study (blank = all)">
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
                            border: `1.5px solid ${on ? C.teal : C.border}`,
                            background: on ? C.tealBg : C.white,
                            color: on ? C.teal : C.gray,
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
              </div>
            </div>

            <div
              style={{
                background: form.isActive ? C.successBg : '#F8FAFC',
                border: `1.5px solid ${form.isActive ? C.successBorder : C.border}`,
                borderRadius: 14,
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
              }}
            >
              <div>
                <div style={{ fontWeight: 800, color: C.text, fontSize: 14 }}>Event Status</div>
                <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>
                  {form.isActive
                    ? 'Active — visible and open for registration'
                    : 'Closed — hidden from students'}
                </div>
              </div>
              <button
                type="button"
                onClick={() => set('isActive', !form.isActive)}
                style={{
                  width: 48,
                  height: 26,
                  borderRadius: 999,
                  background: form.isActive ? '#10B981' : C.border,
                  border: 'none',
                  cursor: 'pointer',
                  position: 'relative',
                  transition: 'background 0.2s',
                  flexShrink: 0,
                }}
              >
                <div
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: '50%',
                    background: C.white,
                    position: 'absolute',
                    top: 3,
                    left: form.isActive ? 25 : 3,
                    transition: 'left 0.2s',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                  }}
                />
              </button>
            </div>
          </div>

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
              href="/dept/events"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
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
              <ChevronLeft size={15} /> Cancel
            </Link>
            <button
              onClick={handleSave}
              disabled={loading || saved}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 28px',
                background:
                  loading || saved ? C.tealBorder : `linear-gradient(135deg, ${C.teal}, #0F766E)`,
                color: C.white,
                border: 'none',
                borderRadius: 10,
                cursor: loading || saved ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                boxShadow: loading || saved ? 'none' : '0 4px 12px rgba(13,148,136,0.35)',
              }}
            >
              <CheckCircle2 size={15} />
              {loading ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
