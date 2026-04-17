'use client';
// src/app/dept/profile/page.tsx
// Department Head profile — standalone page with teal accent

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  AlertCircle,
  Bell,
  Calendar,
  CheckCircle2,
  GraduationCap,
  Mail,
  User,
  Save,
  Linkedin,
} from 'lucide-react';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import CalendarConnectButton from '@/components/calendar/CalendarConnectButton';

const C = {
  teal: '#0D9488',
  tealBg: '#F0FDFA',
  tealBorder: '#99F6E4',
  tealDark: '#0F766E',
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
      <div style={{ color: C.teal }}>{icon}</div>
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

export default function DeptProfilePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const hasTriggeredCalendarSync = useRef(false);
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
    notificationPreferences: {} as Record<string, boolean>,
    emailPreferences: {} as Record<string, boolean>,
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
          notificationPreferences: u.notificationPreferences ?? {},
          emailPreferences: u.emailPreferences ?? {},
        });
      })
      .catch(() => setError('Failed to load profile'))
      .finally(() => setFetching(false));
  }, []);

  useEffect(() => {
    if (!Boolean(user?.googleCalendarConnected)) return;
    if (searchParams.get('calendar') !== 'connected') return;
    if (hasTriggeredCalendarSync.current) return;

    hasTriggeredCalendarSync.current = true;
    let isActive = true;

    void (async () => {
      try {
        await fetch('/api/calendar/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ resync: true }),
        });
      } catch {
        // silent
      } finally {
        if (!isActive) return;
        router.replace('/dept/profile#calendar');
        router.refresh();
      }
    })();

    return () => {
      isActive = false;
    };
  }, [router, searchParams, user]);

  function set(field: string, value: unknown) {
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
          advisorStaffId: form.advisorStaffId || undefined,
          designation: form.designation || undefined,
          linkedinUrl: form.linkedinUrl || undefined,
          notificationPreferences: form.notificationPreferences,
          emailPreferences: form.emailPreferences,
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
          fontFamily: 'var(--font-body)',
          color: C.gray,
        }}
      >
        Loading profile…
      </div>
    );

  return (
    <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
      {/* ── Header ── */}
      <div
        style={{
          background: `linear-gradient(145deg, ${C.dark}, ${C.indigo})`,
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div style={{ maxWidth: 820, margin: '0 auto', padding: '20px 24px' }}>
          <Link
            href="/dept/dashboard"
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
              gradient={`linear-gradient(135deg, ${C.teal}, ${C.tealDark})`}
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
              {/* Role badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                <span
                  style={{
                    background: C.tealBg,
                    color: C.teal,
                    border: `1px solid ${C.tealBorder}`,
                    padding: '2px 12px',
                    borderRadius: 999,
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  Department Head
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
                {form.advisoryDepartment ? ` · ${form.advisoryDepartment}` : ''}
                {form.institutionName ? ` · ${form.institutionName}` : ''}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Body ── */}
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
            <CheckCircle2 size={15} /> Profile saved successfully!
          </div>
        )}

        {/* ── Section 1: Personal Information ── */}
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
                placeholder="Your full name"
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
                placeholder="Your academic background, research focus, and leadership experience…"
                rows={3}
                style={{ ...inputBase, resize: 'vertical' }}
              />
              <div style={{ fontSize: 11, color: C.light, marginTop: 4 }}>
                {form.bio.length}/500 characters
              </div>
            </Field>
          </div>
        </div>

        {/* ── Section 2: Academic Position ── */}
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

          {/* Info note */}
          <div
            style={{
              background: C.tealBg,
              border: `1px solid ${C.tealBorder}`,
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              fontSize: 13,
              color: C.teal,
              fontWeight: 600,
            }}
          >
            🎓 Your institution and department are used to match your account with the correct
            cohort of students in the analytics dashboard.
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <Field label="Institution / University">
              <input
                type="text"
                value={form.institutionName}
                readOnly
                style={{ ...inputBase, background: C.bg, color: C.gray, cursor: 'not-allowed' }}
              />
            </Field>
            <Field label="Department">
              <input
                type="text"
                value={form.advisoryDepartment}
                readOnly
                style={{ ...inputBase, background: C.bg, color: C.gray, cursor: 'not-allowed' }}
              />
            </Field>
            <Field label="Designation / Title">
              <input
                type="text"
                value={form.designation}
                onChange={(e) => set('designation', e.target.value)}
                placeholder="e.g. Head of Department, CSE"
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

        <div
          id="calendar"
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<Calendar size={18} />} label="Google Calendar" />
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 16, lineHeight: 1.6 }}>
            Connect your Google Calendar to keep department-hosted webinar and workshop schedules,
            registration deadlines, and key planning reminders visible in one timeline.
          </div>
          <CalendarConnectButton
            isConnected={Boolean(user?.googleCalendarConnected)}
            callbackUrl="/dept/profile?calendar=connected#calendar"
            description="Sync hosted department events and calendar reminders to your Google Calendar automatically."
            connectedDescription="Hosted events and department reminders sync automatically"
          />
        </div>

        {/* Notification Preferences */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<Bell size={18} />} label="Notification Preferences" />
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, lineHeight: 1.6 }}>
            Control which department notifications you receive. All options are enabled by default.
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              {
                key: 'event_registrations',
                label: 'Event registrations',
                desc: 'When a student registers for your event.',
              },
              {
                key: 'deadline_reminders',
                label: 'Registration deadline reminders',
                desc: 'When one of your hosted events is approaching its registration deadline.',
              },
              {
                key: 'event_reminders',
                label: 'Event start reminders',
                desc: 'When one of your hosted webinars or workshops is about to begin.',
              },
              {
                key: 'badge_earned',
                label: 'Badge earned',
                desc: 'When your department head account earns a new platform badge.',
              },
            ].map((item) => {
              const isOn = form.notificationPreferences[item.key] !== false;
              return (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#FAFBFC',
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      set('notificationPreferences', {
                        ...form.notificationPreferences,
                        [item.key]: !isOn,
                      })
                    }
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      border: 'none',
                      background: isOn ? C.tealDark : C.border,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: C.white,
                        position: 'absolute',
                        top: 3,
                        left: isOn ? 23 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        {/* ── Save button ── */}
        <div
          style={{
            background: C.white,
            borderRadius: 18,
            border: `1px solid ${C.border}`,
            padding: '24px 28px',
            boxShadow: '0 1px 6px rgba(0,0,0,0.04)',
          }}
        >
          <SectionHeader icon={<Mail size={18} />} label="Email Preferences" />
          <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, lineHeight: 1.6 }}>
            Decide which department email reminders should be delivered to your inbox. In-app
            notifications remain controlled separately above.
          </div>
          <div style={{ display: 'grid', gap: 10 }}>
            {[
              {
                key: 'deadline_reminders',
                label: 'Registration deadline emails',
                desc: 'Email reminders to students before registration closes for one of your hosted events.',
              },
              {
                key: 'event_reminders',
                label: 'Event date emails',
                desc: 'Email reminders to students before one of your hosted webinars or workshops begins.',
              },
            ].map((item) => {
              const isOn = form.emailPreferences[item.key] !== false;
              return (
                <div
                  key={item.key}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: '#FAFBFC',
                    border: `1px solid ${C.border}`,
                    borderRadius: 12,
                  }}
                >
                  <div>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{item.label}</div>
                    <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>{item.desc}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      set('emailPreferences', {
                        ...form.emailPreferences,
                        [item.key]: !isOn,
                      })
                    }
                    style={{
                      width: 44,
                      height: 24,
                      borderRadius: 999,
                      border: 'none',
                      background: isOn ? C.tealDark : C.border,
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'background 0.2s',
                      flexShrink: 0,
                    }}
                  >
                    <div
                      style={{
                        width: 18,
                        height: 18,
                        borderRadius: '50%',
                        background: C.white,
                        position: 'absolute',
                        top: 3,
                        left: isOn ? 23 : 3,
                        transition: 'left 0.2s',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.2)',
                      }}
                    />
                  </button>
                </div>
              );
            })}
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '13px 32px',
              background: saving
                ? C.tealBorder
                : `linear-gradient(135deg, ${C.teal}, ${C.tealDark})`,
              color: C.white,
              border: 'none',
              borderRadius: 12,
              cursor: saving ? 'not-allowed' : 'pointer',
              fontSize: 15,
              fontWeight: 700,
              fontFamily: 'var(--font-display)',
              boxShadow: saving ? 'none' : '0 4px 16px rgba(13,148,136,0.35)',
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
