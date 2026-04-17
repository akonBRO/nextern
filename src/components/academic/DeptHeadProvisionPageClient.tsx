'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ACADEMIC_DEPARTMENTS, ACADEMIC_UNIVERSITIES } from '@/lib/academic-options';

type DeptHeadRecord = {
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

export default function DeptHeadProvisionPageClient({
  currentUser,
}: {
  currentUser: { name: string; email: string };
}) {
  const [deptHeads, setDeptHeads] = useState<DeptHeadRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [notice, setNotice] = useState<{ tone: 'success' | 'error'; text: string } | null>(null);
  const [form, setForm] = useState({
    name: '',
    email: '',
    institutionName: '',
    advisoryDepartment: '',
    designation: '',
    advisorStaffId: '',
    temporaryPassword: '',
  });

  async function loadDeptHeads() {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/dept-heads', { cache: 'no-store' });
      const data = (await response.json().catch(() => ({}))) as {
        deptHeads?: DeptHeadRecord[];
        error?: string;
      };
      if (!response.ok) {
        throw new Error(data.error ?? 'Failed to load department heads.');
      }
      setDeptHeads(data.deptHeads ?? []);
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to load department heads.',
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadDeptHeads();
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
      const response = await fetch('/api/admin/dept-heads', {
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
        throw new Error(
          firstError(data.details) || data.error || 'Failed to create department head.'
        );
      }

      setNotice({
        tone: 'success',
        text: data.message ?? 'Department head account created successfully.',
      });
      setForm({
        name: '',
        email: '',
        institutionName: '',
        advisoryDepartment: '',
        designation: '',
        advisorStaffId: '',
        temporaryPassword: '',
      });
      await loadDeptHeads();
    } catch (error) {
      setNotice({
        tone: 'error',
        text: error instanceof Error ? error.message : 'Failed to create department head.',
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F1F5F9',
        fontFamily: 'var(--font-body)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 55%, #2563EB 100%)',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
        }}
      >
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '28px 24px 34px' }}>
          <Link
            href="/admin/dashboard"
            style={{ color: '#94A3B8', fontSize: 13, textDecoration: 'none', fontWeight: 600 }}
          >
            Back to superadmin dashboard
          </Link>
          <div
            className="dept-head-admin-hero"
            style={{
              marginTop: 18,
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1.4fr) minmax(320px, 0.8fr)',
              gap: 18,
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 12px',
                  borderRadius: 999,
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.14)',
                  color: '#DBEAFE',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                Academic account provisioning
              </div>
              <h1
                style={{
                  margin: '16px 0 10px',
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-display)',
                  fontSize: 34,
                  lineHeight: 1.05,
                }}
              >
                Create department head accounts from superadmin
              </h1>
              <p style={{ margin: 0, color: '#BFDBFE', fontSize: 15, lineHeight: 1.8 }}>
                Public signup is disabled for department heads. Create the account here, assign the
                correct university name in the existing database format, and send the first-login
                one-time password by email automatically.
              </p>
            </div>

            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.14)',
                borderRadius: 22,
                padding: '22px 24px',
                color: '#E2E8F0',
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 700, color: '#93C5FD' }}>Signed in as</div>
              <div
                style={{
                  marginTop: 6,
                  fontSize: 18,
                  fontWeight: 800,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-display)',
                }}
              >
                {currentUser.name}
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#CBD5E1' }}>
                {currentUser.email}
              </div>
              <div
                style={{
                  marginTop: 18,
                  paddingTop: 16,
                  borderTop: '1px solid rgba(255,255,255,0.12)',
                  display: 'grid',
                  gap: 10,
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                <div>Only superadmin can provision department heads.</div>
                <div>New accounts are created as verified and approved.</div>
                <div>Users must change the temporary password on first login.</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div
        className="dept-head-admin-layout"
        style={{
          maxWidth: 1240,
          margin: '0 auto',
          padding: '28px 24px 40px',
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 420px) minmax(0, 1fr)',
          gap: 22,
        }}
      >
        <div
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
              New department head
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
              Provision account
            </h2>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 15 }}>
            <Field label="Full name">
              <input
                value={form.name}
                onChange={(event) => setField('name', event.target.value)}
                required
                placeholder="Department head name"
                style={inputStyle()}
              />
            </Field>

            <Field label="Email">
              <input
                type="email"
                value={form.email}
                onChange={(event) => setField('email', event.target.value)}
                required
                placeholder="name@university.edu"
                style={inputStyle()}
              />
            </Field>

            <Field label="University">
              <select
                value={form.institutionName}
                onChange={(event) => setField('institutionName', event.target.value)}
                required
                style={inputStyle()}
              >
                <option value="">Select university</option>
                {ACADEMIC_UNIVERSITIES.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
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
                  placeholder="Professor / Chair"
                  style={inputStyle()}
                />
              </Field>
              <Field label="Staff ID">
                <input
                  value={form.advisorStaffId}
                  onChange={(event) => setField('advisorStaffId', event.target.value)}
                  placeholder="STF-1001"
                  style={inputStyle()}
                />
              </Field>
            </div>

            <Field label="One-time password">
              <input
                type="text"
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
              The credential email is sent immediately after account creation. If email delivery
              fails, the account is rolled back to avoid half-created records.
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
              {saving ? 'Creating account...' : 'Create department head'}
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
                Existing accounts
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
                Department heads
              </h2>
            </div>
            <button
              type="button"
              onClick={() => void loadDeptHeads()}
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
            <div style={{ color: '#64748B', fontSize: 14 }}>Loading department heads...</div>
          ) : deptHeads.length === 0 ? (
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
              No department head accounts have been provisioned yet.
            </div>
          ) : (
            <div style={{ display: 'grid', gap: 14 }}>
              {deptHeads.map((deptHead) => (
                <div
                  key={deptHead._id}
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
                        {deptHead.name}
                      </div>
                      <div style={{ marginTop: 4, fontSize: 13, color: '#64748B' }}>
                        {deptHead.email}
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
                    <Chip label={deptHead.institutionName ?? 'No university'} tone="blue" />
                    <Chip label={deptHead.advisoryDepartment ?? 'No department'} tone="slate" />
                    {deptHead.designation ? (
                      <Chip label={deptHead.designation} tone="green" />
                    ) : null}
                    {deptHead.advisorStaffId ? (
                      <Chip label={`Staff ID: ${deptHead.advisorStaffId}`} tone="amber" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @media (max-width: 980px) {
          .dept-head-admin-hero,
          .dept-head-admin-layout {
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

function Chip({ label, tone }: { label: string; tone: 'blue' | 'slate' | 'green' | 'amber' }) {
  const palette = {
    blue: { bg: '#EFF6FF', border: '#BFDBFE', color: '#1D4ED8' },
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
