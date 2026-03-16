'use client';
// src/app/employer/jobs/new/page.tsx
// Multi-step job creation form — 4 steps, uses brand colors

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, AlertCircle, ChevronRight, ChevronLeft, Rocket } from 'lucide-react';

const C = {
  blue: '#2563EB',
  indigo: '#1E293B',
  cyan: '#22D3EE',
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
  warnBg: '#FFFBEB',
  warnBorder: '#FDE68A',
  blueBg: '#EFF6FF',
  blueBorder: '#BFDBFE',
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

function SectionLabel({ label }: { label: string }) {
  return (
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
      {label}
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
                background: C.blueBg,
                color: C.blue,
                border: `1px solid ${C.blueBorder}`,
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
                  color: C.blue,
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
              background: C.blueBg,
              color: C.blue,
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

function ChipGroup({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: string[];
  selected: string[];
  onChange: (v: string[]) => void;
}) {
  return (
    <Field label={label} required={false}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 7 }}>
        {options.map((opt) => {
          const on = selected.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(on ? selected.filter((x) => x !== opt) : [...selected, opt])}
              style={{
                padding: '6px 13px',
                borderRadius: 999,
                fontSize: 12,
                fontWeight: 600,
                border: `1.5px solid ${on ? C.blue : C.border}`,
                background: on ? C.blueBg : C.white,
                color: on ? C.blue : C.gray,
                cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </Field>
  );
}

export default function NewJobPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [form, setForm] = useState({
    title: '',
    type: 'internship',
    description: '',
    responsibilities: [] as string[],
    locationType: 'onsite',
    city: '',
    stipendBDT: '',
    isStipendNegotiable: false,
    applicationDeadline: '',
    startDate: '',
    durationMonths: '',
    targetUniversities: [] as string[],
    targetDepartments: [] as string[],
    targetYears: [] as number[],
    isBatchHiring: false,
    batchUniversities: [] as string[],
    requiredSkills: [] as string[],
    minimumCGPA: '',
    requiredCourses: [] as string[],
    experienceExpectations: '',
    preferredCertifications: [] as string[],
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

  const isEvent = form.type === 'webinar' || form.type === 'workshop';

  function validateStep(s: number) {
    const errs: Record<string, string> = {};
    if (s === 1) {
      if (!form.title.trim()) errs.title = 'Title is required';
      if (form.description.length < 20) errs.description = 'At least 20 characters required';
      if (!form.applicationDeadline) errs.applicationDeadline = 'Deadline is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  function next() {
    if (validateStep(step)) setStep((p) => Math.min(4, p + 1));
  }

  async function handleSubmit(isActive: boolean) {
    setLoading(true);
    setError('');
    try {
      const payload = {
        title: form.title,
        type: form.type,
        description: form.description,
        responsibilities: form.responsibilities,
        locationType: form.locationType,
        city: form.city || undefined,
        stipendBDT: form.stipendBDT ? parseInt(form.stipendBDT) : undefined,
        isStipendNegotiable: form.isStipendNegotiable,
        applicationDeadline: form.applicationDeadline,
        startDate: form.startDate || undefined,
        durationMonths: form.durationMonths ? parseInt(form.durationMonths) : undefined,
        targetUniversities: form.targetUniversities,
        targetDepartments: form.targetDepartments,
        targetYears: form.targetYears,
        isBatchHiring: form.isBatchHiring,
        batchUniversities: form.batchUniversities,
        requiredSkills: form.requiredSkills,
        minimumCGPA: form.minimumCGPA ? parseFloat(form.minimumCGPA) : undefined,
        requiredCourses: form.requiredCourses,
        experienceExpectations: form.experienceExpectations || undefined,
        preferredCertifications: form.preferredCertifications,
        academicSession: form.academicSession || undefined,
        isActive,
      };
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) {
        if (data.details) {
          const flat: Record<string, string> = {};
          Object.entries(data.details as Record<string, string[]>).forEach(([k, v]) => {
            flat[k] = v[0];
          });
          setErrors(flat);
          setStep(1);
        } else {
          setError(data.error ?? 'Failed to create job');
        }
        return;
      }
      router.push('/employer/jobs');
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  const STEPS = [
    { n: 1, label: 'Basic Info' },
    { n: 2, label: 'Targeting' },
    { n: 3, label: 'Requirements' },
    { n: 4, label: 'Review' },
  ];

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo})`,
          padding: '24px 0 0',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ marginBottom: 20 }}>
            <Link
              href="/employer/jobs"
              style={{ color: C.gray, textDecoration: 'none', fontSize: 14, fontWeight: 500 }}
            >
              ← Back to Jobs
            </Link>
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
            Post a New Job
          </h1>
          <p style={{ color: C.gray, fontSize: 13, marginBottom: 28 }}>
            Reach verified students across Bangladesh universities. Your requirement profile feeds
            the AI fit engine.
          </p>

          {/* Steps */}
          <div style={{ display: 'flex', alignItems: 'center' }}>
            {STEPS.map((s, idx) => (
              <div
                key={s.n}
                style={{ display: 'flex', alignItems: 'center', flex: idx < 3 ? 1 : 'none' }}
              >
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5 }}
                >
                  <div
                    style={{
                      width: 34,
                      height: 34,
                      borderRadius: '50%',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 13,
                      fontWeight: 800,
                      background:
                        s.n < step ? C.success : s.n === step ? C.blue : 'rgba(255,255,255,0.1)',
                      color: s.n <= step ? '#fff' : C.gray,
                      boxShadow: s.n === step ? `0 0 0 4px rgba(37,99,235,0.3)` : 'none',
                      transition: 'all 0.2s',
                    }}
                  >
                    {s.n < step ? <CheckCircle2 size={16} /> : s.n}
                  </div>
                  <span
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: s.n === step ? '#E2E8F0' : C.gray,
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {s.label}
                  </span>
                </div>
                {idx < 3 && (
                  <div
                    style={{
                      flex: 1,
                      height: 2,
                      background: s.n < step ? C.success : 'rgba(255,255,255,0.1)',
                      margin: '0 8px',
                      marginBottom: 20,
                      borderRadius: 999,
                      transition: 'background 0.2s',
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Form card */}
      <div style={{ maxWidth: 820, margin: '28px auto', padding: '0 24px' }}>
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
          {/* ── STEP 1: Basic Info ── */}
          {step === 1 && (
            <div style={{ padding: '32px 36px' }}>
              <SectionLabel label="Listing Type & Basic Details" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <Field label="Listing Type">
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                    {[
                      { v: 'internship', l: '🎓 Internship' },
                      { v: 'part-time', l: '⏰ Part-time' },
                      { v: 'full-time', l: '💼 Full-time' },
                      { v: 'campus-drive', l: '🏫 Campus Drive' },
                      { v: 'webinar', l: '🌐 Webinar' },
                      { v: 'workshop', l: '🔧 Workshop' },
                    ].map((t) => (
                      <button
                        key={t.v}
                        type="button"
                        onClick={() => set('type', t.v)}
                        style={{
                          padding: '12px',
                          borderRadius: 12,
                          border: `2px solid ${form.type === t.v ? C.blue : C.border}`,
                          background: form.type === t.v ? C.blueBg : C.white,
                          color: form.type === t.v ? C.blue : C.gray,
                          fontWeight: 700,
                          fontSize: 13,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                        }}
                      >
                        {t.l}
                      </button>
                    ))}
                  </div>
                </Field>

                <Field label="Job Title" error={errors.title}>
                  <input
                    type="text"
                    value={form.title}
                    onChange={(e) => set('title', e.target.value)}
                    placeholder="e.g. Frontend Developer Intern"
                    style={{ ...inputBase, borderColor: errors.title ? C.dangerBorder : C.border }}
                  />
                </Field>

                <Field label="Description" error={errors.description}>
                  <textarea
                    value={form.description}
                    onChange={(e) => set('description', e.target.value)}
                    placeholder="Describe the role, what the intern will work on, team size, tech stack…"
                    rows={5}
                    style={{
                      ...inputBase,
                      resize: 'vertical',
                      borderColor: errors.description ? C.dangerBorder : C.border,
                    }}
                  />
                </Field>

                <TagInput
                  label="Key Responsibilities"
                  tags={form.responsibilities}
                  onChange={(v) => set('responsibilities', v)}
                  placeholder="Add a responsibility and press Enter"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Work Mode">
                    <select
                      value={form.locationType}
                      onChange={(e) => set('locationType', e.target.value)}
                      style={{ ...inputBase, appearance: 'none' as const }}
                    >
                      <option value="onsite">Onsite</option>
                      <option value="remote">Remote</option>
                      <option value="hybrid">Hybrid</option>
                    </select>
                  </Field>
                  <Field label="City / District" required={false}>
                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => set('city', e.target.value)}
                      placeholder="e.g. Dhaka"
                      style={inputBase}
                    />
                  </Field>
                </div>

                {!isEvent && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16 }}>
                    <Field label="Stipend (BDT/month)" required={false}>
                      <input
                        type="number"
                        value={form.stipendBDT}
                        onChange={(e) => set('stipendBDT', e.target.value)}
                        placeholder="e.g. 10000"
                        min="0"
                        style={inputBase}
                      />
                    </Field>
                    <Field label="Duration (months)" required={false}>
                      <input
                        type="number"
                        value={form.durationMonths}
                        onChange={(e) => set('durationMonths', e.target.value)}
                        placeholder="e.g. 3"
                        min="1"
                        max="24"
                        style={inputBase}
                      />
                    </Field>
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
                )}

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Application Deadline" error={errors.applicationDeadline}>
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
                  {!isEvent && (
                    <Field label="Expected Start Date" required={false}>
                      <input
                        type="date"
                        value={form.startDate}
                        onChange={(e) => set('startDate', e.target.value)}
                        style={inputBase}
                      />
                    </Field>
                  )}
                </div>

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
                    checked={form.isStipendNegotiable}
                    onChange={(e) => set('isStipendNegotiable', e.target.checked)}
                    style={{ width: 16, height: 16, accentColor: C.blue }}
                  />
                  Stipend is negotiable
                </label>
              </div>
            </div>
          )}

          {/* ── STEP 2: Targeting ── */}
          {step === 2 && (
            <div style={{ padding: '32px 36px' }}>
              <SectionLabel label="Targeting — Who Should See This?" />
              <p style={{ color: C.gray, fontSize: 14, marginBottom: 24, marginTop: -10 }}>
                Leave blank to show to all students across all universities and departments.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* Batch hiring toggle */}
                <div
                  style={{
                    background: form.isBatchHiring ? C.blueBg : C.bg,
                    border: `1.5px solid ${form.isBatchHiring ? C.blueBorder : C.border}`,
                    borderRadius: 14,
                    padding: '16px 20px',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      marginBottom: form.isBatchHiring ? 20 : 0,
                    }}
                  >
                    <div>
                      <div
                        style={{
                          fontWeight: 800,
                          color: C.text,
                          fontSize: 14,
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        🏭 Batch Hiring Mode
                      </div>
                      <div style={{ color: C.gray, fontSize: 13, marginTop: 2 }}>
                        Distribute this role across multiple universities simultaneously
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => set('isBatchHiring', !form.isBatchHiring)}
                      style={{
                        width: 48,
                        height: 26,
                        borderRadius: 999,
                        background: form.isBatchHiring ? C.blue : C.border,
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
                          left: form.isBatchHiring ? 25 : 3,
                          transition: 'left 0.2s',
                          boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                        }}
                      />
                    </button>
                  </div>
                  {form.isBatchHiring && (
                    <ChipGroup
                      label="Select Universities for Batch Hiring"
                      options={BD_UNIS}
                      selected={form.batchUniversities}
                      onChange={(v) => set('batchUniversities', v)}
                    />
                  )}
                </div>

                {!form.isBatchHiring && (
                  <ChipGroup
                    label="Target Universities (leave blank = all)"
                    options={BD_UNIS}
                    selected={form.targetUniversities}
                    onChange={(v) => set('targetUniversities', v)}
                  />
                )}

                <ChipGroup
                  label="Target Departments (leave blank = all)"
                  options={BD_DEPTS}
                  selected={form.targetDepartments}
                  onChange={(v) => set('targetDepartments', v)}
                />

                <Field label="Target Year of Study (leave blank = all)" required={false}>
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
                            border: `1.5px solid ${on ? C.blue : C.border}`,
                            background: on ? C.blueBg : C.white,
                            color: on ? C.blue : C.gray,
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
          )}

          {/* ── STEP 3: Requirements ── */}
          {step === 3 && (
            <div style={{ padding: '32px 36px' }}>
              <SectionLabel label="Internship Requirement Profile" />
              <div
                style={{
                  background: C.blueBg,
                  border: `1px solid ${C.blueBorder}`,
                  borderRadius: 12,
                  padding: '12px 16px',
                  marginBottom: 24,
                  marginTop: -8,
                }}
              >
                <p style={{ color: C.blue, fontSize: 13, margin: 0, fontWeight: 600 }}>
                  💡 This data feeds directly into Sabbir&apos;s AI Skill Gap & Fit Scoring engine
                  (Module 2).
                </p>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <TagInput
                  label="Required Skills"
                  tags={form.requiredSkills}
                  onChange={(v) => set('requiredSkills', v)}
                  placeholder="e.g. React.js, Python — press Enter"
                />

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                  <Field label="Minimum CGPA" required={false}>
                    <input
                      type="number"
                      value={form.minimumCGPA}
                      onChange={(e) => set('minimumCGPA', e.target.value)}
                      placeholder="0.00"
                      min="0"
                      max="4"
                      step="0.1"
                      style={inputBase}
                    />
                  </Field>
                  <Field label="Experience Expectations" required={false}>
                    <input
                      type="text"
                      value={form.experienceExpectations}
                      onChange={(e) => set('experienceExpectations', e.target.value)}
                      placeholder="e.g. No experience needed"
                      style={inputBase}
                    />
                  </Field>
                </div>

                <TagInput
                  label="Required Completed Courses"
                  tags={form.requiredCourses}
                  onChange={(v) => set('requiredCourses', v)}
                  placeholder="e.g. CSE110, CSE220 — press Enter"
                />

                <TagInput
                  label="Preferred Certifications"
                  tags={form.preferredCertifications}
                  onChange={(v) => set('preferredCertifications', v)}
                  placeholder="e.g. AWS Cloud, Meta React — press Enter"
                />
              </div>
            </div>
          )}

          {/* ── STEP 4: Review ── */}
          {step === 4 && (
            <div style={{ padding: '32px 36px' }}>
              <SectionLabel label="Review & Publish" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 24 }}>
                {[
                  { l: 'Title', v: form.title },
                  { l: 'Type', v: form.type },
                  { l: 'Location', v: `${form.city || 'TBD'} (${form.locationType})` },
                  { l: 'Deadline', v: form.applicationDeadline },
                  {
                    l: 'Stipend',
                    v: form.stipendBDT
                      ? `৳${parseInt(form.stipendBDT).toLocaleString()}/mo`
                      : form.isStipendNegotiable
                        ? 'Negotiable'
                        : '—',
                  },
                  { l: 'Duration', v: form.durationMonths ? `${form.durationMonths} months` : '—' },
                  {
                    l: 'Batch Hiring',
                    v: form.isBatchHiring
                      ? `Yes — ${form.batchUniversities.length} universities`
                      : 'No',
                  },
                  {
                    l: 'Required Skills',
                    v: form.requiredSkills.length > 0 ? form.requiredSkills.join(', ') : '—',
                  },
                  { l: 'Min CGPA', v: form.minimumCGPA || '—' },
                  {
                    l: 'Target Universities',
                    v:
                      form.targetUniversities.length > 0
                        ? form.targetUniversities.slice(0, 3).join(', ') +
                          (form.targetUniversities.length > 3
                            ? ` +${form.targetUniversities.length - 3}`
                            : '')
                        : 'All',
                  },
                  {
                    l: 'Target Departments',
                    v:
                      form.targetDepartments.length > 0 ? form.targetDepartments.join(', ') : 'All',
                  },
                ].map((row) => (
                  <div
                    key={row.l}
                    style={{
                      display: 'flex',
                      gap: 16,
                      padding: '11px 14px',
                      background: C.bg,
                      borderRadius: 10,
                    }}
                  >
                    <div
                      style={{
                        width: 160,
                        flexShrink: 0,
                        fontSize: 13,
                        fontWeight: 700,
                        color: C.gray,
                      }}
                    >
                      {row.l}
                    </div>
                    <div style={{ fontSize: 13, color: C.text, wordBreak: 'break-word' }}>
                      {row.v}
                    </div>
                  </div>
                ))}
              </div>
              <div
                style={{
                  background: C.successBg,
                  border: `1px solid ${C.successBorder}`,
                  borderRadius: 12,
                  padding: '14px 16px',
                }}
              >
                <div style={{ fontWeight: 700, color: '#065F46', fontSize: 14, marginBottom: 3 }}>
                  ✅ Ready to publish
                </div>
                <div style={{ color: C.gray, fontSize: 13 }}>
                  This job will be immediately visible to matching students once published.
                </div>
              </div>
            </div>
          )}

          {/* Navigation */}
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
            <button
              onClick={() => setStep((p) => Math.max(1, p - 1))}
              disabled={step === 1}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 7,
                padding: '10px 20px',
                border: `1.5px solid ${C.border}`,
                borderRadius: 10,
                background: C.white,
                color: step === 1 ? C.light : C.gray,
                cursor: step === 1 ? 'not-allowed' : 'pointer',
                fontSize: 14,
                fontWeight: 600,
              }}
            >
              <ChevronLeft size={15} /> Previous
            </button>
            <div style={{ display: 'flex', gap: 10 }}>
              {step < 4 ? (
                <button
                  onClick={next}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    padding: '10px 24px',
                    background: `linear-gradient(135deg, ${C.blue}, #1D4ED8)`,
                    color: C.white,
                    border: 'none',
                    borderRadius: 10,
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    boxShadow: '0 4px 12px rgba(37,99,235,0.35)',
                  }}
                >
                  Next <ChevronRight size={15} />
                </button>
              ) : (
                <>
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
                        ? '#93C5FD'
                        : `linear-gradient(135deg, ${C.blue}, #1D4ED8)`,
                      color: C.white,
                      border: 'none',
                      borderRadius: 10,
                      cursor: loading ? 'not-allowed' : 'pointer',
                      fontSize: 14,
                      fontWeight: 700,
                      fontFamily: 'var(--font-display)',
                      boxShadow: loading ? 'none' : '0 4px 12px rgba(37,99,235,0.35)',
                    }}
                  >
                    <Rocket size={15} /> {loading ? 'Publishing…' : 'Publish Job'}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
