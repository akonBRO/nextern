'use client';

import { useEffect, useState } from 'react';
import { ACADEMIC_DEPARTMENTS } from '@/lib/academic-options';

type AdvisorRecord = {
  _id: string;
  name: string;
  email: string;
  institutionName?: string;
  advisoryDepartment?: string;
  designation?: string;
  advisorStaffId?: string;
  createdAt?: string;
};

function firstError(details?: Record<string, string[]>) {
  if (!details) return '';
  for (const value of Object.values(details)) {
    if (value?.[0]) return value[0];
  }
  return '';
}

export default function AdvisorProvisionClient({ institutionName }: { institutionName: string }) {
  const [advisors, setAdvisors] = useState<AdvisorRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    advisoryDepartment: '',
    designation: '',
    advisorStaffId: '',
    temporaryPassword: '',
  });

  async function loadAdvisors() {
    setLoading(true);
    try {
      const response = await fetch('/api/dept/advisors', { cache: 'no-store' });
      const data = (await response.json().catch(() => ({}))) as {
        advisors?: AdvisorRecord[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to load advisors.');
      }
      setAdvisors(data.advisors ?? []);
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load advisors.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAdvisors();
  }, []);

  function setField(field: keyof typeof form, value: string) {
    setForm((current) => ({ ...current, [field]: value }));
    if (notice?.tone === 'error') {
      setNotice(null);
    }
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);

    try {
      const response = await fetch('/api/dept/advisors', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = (await response.json().catch(() => ({}))) as {
        message?: string;
        error?: string;
        details?: Record<string, string[]>;
      };

      if (!response.ok) {
        throw new Error(firstError(data.details) || data.error || 'Failed to create advisor.');
      }

      setNotice({
        tone: 'success',
        text: data.message ?? 'Advisor account created successfully.',
      });
      setForm({
        name: '',
        email: '',
        advisoryDepartment: '',
        designation: '',
        advisorStaffId: '',
        temporaryPassword: '',
      });
      await loadAdvisors();
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to create advisor.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="advisor-provision-grid"
      style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 390px) minmax(0, 1fr)', gap: 22 }}
    >
      <div
        id="new-advisor"
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #D9E2EC',
          boxShadow: '0 16px 36px rgba(15,23,42,0.05)',
          padding: 24,
          alignSelf: 'start',
        }}
      >
        <div style={{ marginBottom: 18 }}>
          <div
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: '#64748B',
              letterSpacing: 0.8,
              textTransform: 'uppercase',
            }}
          >
            Create advisor
          </div>
          <h2
            style={{
              margin: '8px 0 0',
              fontSize: 24,
              fontWeight: 900,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
            }}
          >
            Provision advisor account
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 15 }}>
          <Field label="University">
            <input
              value={institutionName}
              readOnly
              style={{ ...inputStyle(), background: '#F8FAFC' }}
            />
          </Field>

          <Field label="Full name">
            <input
              value={form.name}
              onChange={(event) => setField('name', event.target.value)}
              required
              placeholder="Advisor name"
              style={inputStyle()}
            />
          </Field>

          <Field label="Email">
            <input
              type="email"
              value={form.email}
              onChange={(event) => setField('email', event.target.value)}
              required
              placeholder="advisor@university.edu"
              style={inputStyle()}
            />
          </Field>

          <Field label="Department">
            <select
              value={form.advisoryDepartment}
              onChange={(event) => setField('advisoryDepartment', event.target.value)}
              required
              style={inputStyle()}
            >
              <option value="">Select department</option>
              {ACADEMIC_DEPARTMENTS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </Field>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <Field label="Designation">
              <input
                value={form.designation}
                onChange={(event) => setField('designation', event.target.value)}
                placeholder="Lecturer / Professor"
                style={inputStyle()}
              />
            </Field>
            <Field label="Staff ID">
              <input
                value={form.advisorStaffId}
                onChange={(event) => setField('advisorStaffId', event.target.value)}
                placeholder="STF-2201"
                style={inputStyle()}
              />
            </Field>
          </div>

          <Field label="One-time password">
            <input
              value={form.temporaryPassword}
              onChange={(event) => setField('temporaryPassword', event.target.value)}
              required
              placeholder="Temporary login password"
              style={inputStyle()}
            />
          </Field>

          <div
            style={{
              background: '#EFF6FF',
              border: '1px solid #BFDBFE',
              borderRadius: 16,
              padding: '14px 16px',
              color: '#1D4ED8',
              fontSize: 13,
              lineHeight: 1.7,
            }}
          >
            The university scope is fixed automatically from your department head account and cannot
            be changed by the advisor later.
          </div>

          {notice && (
            <div
              style={{
                background: notice.tone === 'success' ? '#ECFDF5' : '#FEF2F2',
                border: `1px solid ${notice.tone === 'success' ? '#A7F3D0' : '#FECACA'}`,
                color: notice.tone === 'success' ? '#065F46' : '#B91C1C',
                borderRadius: 16,
                padding: '13px 15px',
                fontSize: 14,
                lineHeight: 1.6,
              }}
            >
              {notice.text}
            </div>
          )}

          <button
            type="submit"
            disabled={saving}
            style={{
              border: 'none',
              borderRadius: 16,
              padding: '14px 18px',
              background: saving ? '#93C5FD' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              fontSize: 15,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              cursor: saving ? 'not-allowed' : 'pointer',
              boxShadow: saving ? 'none' : '0 18px 30px rgba(37,99,235,0.18)',
            }}
          >
            {saving ? 'Creating account...' : 'Create advisor'}
          </button>
        </form>
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #D9E2EC',
          boxShadow: '0 16px 36px rgba(15,23,42,0.05)',
          padding: 24,
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 16,
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: '#64748B',
                letterSpacing: 0.8,
                textTransform: 'uppercase',
              }}
            >
              Your academic team
            </div>
            <h2
              style={{
                margin: '8px 0 0',
                fontSize: 24,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
              }}
            >
              Advisors in {institutionName}
            </h2>
          </div>
          <button
            type="button"
            onClick={() => void loadAdvisors()}
            style={{
              border: '1px solid #CBD5E1',
              background: '#FFFFFF',
              color: '#334155',
              borderRadius: 12,
              padding: '10px 14px',
              fontSize: 13,
              fontWeight: 700,
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>
        </div>

        {loading ? (
          <div style={{ color: '#64748B', fontSize: 14 }}>Loading advisors...</div>
        ) : advisors.length === 0 ? (
          <div
            style={{
              borderRadius: 18,
              border: '1px dashed #CBD5E1',
              background: '#F8FAFC',
              padding: '24px 20px',
              color: '#64748B',
              fontSize: 14,
              lineHeight: 1.7,
            }}
          >
            No advisors have been created for this university yet.
          </div>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {advisors.map((advisor) => (
              <div
                key={advisor._id}
                style={{
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  padding: '18px 18px',
                }}
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
                  <div>
                    <div
                      style={{
                        fontSize: 17,
                        fontWeight: 800,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      {advisor.name}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                      {advisor.email}
                    </div>
                  </div>
                  <div
                    style={{
                      background: '#ECFDF5',
                      color: '#065F46',
                      border: '1px solid #A7F3D0',
                      borderRadius: 999,
                      padding: '5px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    Approved
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 14 }}>
                  <Chip label={advisor.advisoryDepartment ?? 'No department'} tone="slate" />
                  {advisor.designation ? <Chip label={advisor.designation} tone="green" /> : null}
                  {advisor.advisorStaffId ? (
                    <Chip label={`Staff ID: ${advisor.advisorStaffId}`} tone="amber" />
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @media (max-width: 980px) {
          .advisor-provision-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label style={{ display: 'grid', gap: 8 }}>
      <span
        style={{
          fontSize: 12,
          fontWeight: 800,
          color: '#475569',
          textTransform: 'uppercase',
          letterSpacing: 0.8,
        }}
      >
        {label}
      </span>
      {children}
    </label>
  );
}

function Chip({ label, tone }: { label: string; tone: 'slate' | 'green' | 'amber' }) {
  const palette = {
    slate: { bg: '#F8FAFC', border: '#E2E8F0', color: '#334155' },
    green: { bg: '#ECFDF5', border: '#A7F3D0', color: '#166534' },
    amber: { bg: '#FFFBEB', border: '#FDE68A', color: '#92400E' },
  }[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '5px 11px',
        borderRadius: 999,
        background: palette.bg,
        border: `1px solid ${palette.border}`,
        color: palette.color,
        fontSize: 12,
        fontWeight: 700,
      }}
    >
      {label}
    </span>
  );
}

function inputStyle(): React.CSSProperties {
  return {
    width: '100%',
    boxSizing: 'border-box',
    borderRadius: 14,
    border: '1px solid #CBD5E1',
    padding: '12px 14px',
    fontSize: 14,
    color: '#0F172A',
    background: '#FFFFFF',
    outline: 'none',
  };
}
