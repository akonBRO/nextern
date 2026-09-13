'use client';

import BrandLoader from '@/components/ui/BrandLoader';
import BadgeIcon from '@/components/ui/BadgeIcon';

import FormField from '@/components/ui/FormField';
// src/app/employer/profile/page.tsx

import { useEffect, useState } from 'react';

import EmployerClientShell from '@/components/employer/EmployerClientShell';
import ProfilePictureUpload from '@/components/profile/ProfilePictureUpload';
import ReputationHistory from '@/components/reviews/ReputationHistory';
import {
  AlertCircle,
  CheckCircle2,
  Building2,
  Globe,
  Phone,
  Save,
  Award,
  Bell,
  Mail,
} from 'lucide-react';

const C = {
  blue: '#087f72',
  indigo: '#243e4a',
  bg: '#f6f8f9',
  gray: '#60717d',
  success: '#168257',
  white: '#fff',
  dark: '#182c39',
  border: '#dfe6e9',
  text: '#182c39',
  muted: '#374151',
  light: '#60717d',
  danger: '#EF4444',
  dangerBg: '#FEF2F2',
  dangerBorder: '#FECACA',
  successBg: '#ECFDF5',
  successBorder: '#A7F3D0',
  blueBg: '#edf7f3',
  blueBorder: '#bdddd5',
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

const BD_INDUSTRIES = [
  'IT/Software',
  'Banking & Finance',
  'Telecom',
  'E-Commerce',
  'Healthcare',
  'Education',
  'NGO/Development',
  'Manufacturing',
  'Media & Marketing',
  'Consulting',
  'Real Estate',
  'Logistics',
  'Other',
];

const BD_CITIES = [
  'Dhaka',
  'Chittagong',
  'Sylhet',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Mymensingh',
  'Rangpur',
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
        style={{ fontSize: 15, fontWeight: 700, color: C.text, fontFamily: 'var(--font-display)' }}
      >
        {label}
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <FormField label={label}>{children}</FormField>;
}

export default function EmployerProfilePage() {
  const [user, setUser] = useState<Record<string, unknown> | null>(null);
  const [fetching, setFetching] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [badges, setBadges] = useState<
    { badgeName: string; badgeIcon: string; awardedAt: string; badgeSlug: string }[]
  >([]);

  const [form, setForm] = useState({
    name: '',
    phone: '',
    companyName: '',
    industry: '',
    companySize: '',
    companyWebsite: '',
    companyDescription: '',
    headquartersCity: '',
    tradeLicenseNo: '',
    notificationPreferences: {
      application_received: true,
      event_registrations: true,
    } as Record<string, boolean>,
    emailPreferences: {
      application_received: true,
      event_registrations: true,
    } as Record<string, boolean>,
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
          companyName: u.companyName ?? '',
          industry: u.industry ?? '',
          companySize: u.companySize ?? '',
          companyWebsite: u.companyWebsite ?? '',
          companyDescription: u.companyDescription ?? '',
          headquartersCity: u.headquartersCity ?? '',
          tradeLicenseNo: u.tradeLicenseNo ?? '',
          notificationPreferences: {
            application_received: true,
            event_registrations: true,
            ...(u.notificationPreferences ?? {}),
          },
          emailPreferences: {
            application_received: true,
            event_registrations: true,
            ...(u.emailPreferences ?? {}),
          },
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
          companyName: form.companyName,
          industry: form.industry || undefined,
          companySize: form.companySize || undefined,
          companyWebsite: form.companyWebsite || undefined,
          companyDescription: form.companyDescription || undefined,
          headquartersCity: form.headquartersCity || undefined,
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
      setError('Network error.');
    } finally {
      setSaving(false);
    }
  }

  async function handleLogoUploaded(url: string) {
    await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyLogo: url }),
    });

    setUser((prev) => (prev ? { ...prev, companyLogo: url } : prev));
  }

  async function handleLogoRemoved() {
    await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ companyLogo: null }),
    });

    setUser((prev) => (prev ? { ...prev, companyLogo: undefined } : prev));
  }

  function toggleNotificationPreference(key: string) {
    setForm((prev) => ({
      ...prev,
      notificationPreferences: {
        ...prev.notificationPreferences,
        [key]: prev.notificationPreferences[key] === false,
      },
    }));
  }

  function toggleEmailPreference(key: string) {
    setForm((prev) => ({
      ...prev,
      emailPreferences: {
        ...prev.emailPreferences,
        [key]: prev.emailPreferences[key] === false,
      },
    }));
  }

  if (fetching)
    return (
      <EmployerClientShell>
        <BrandLoader variant="page" label="Loading profile" />
      </EmployerClientShell>
    );

  const verificationStatus = user?.verificationStatus as string;

  return (
    <EmployerClientShell>
      <div style={{ minHeight: '100vh', background: C.bg, fontFamily: 'var(--font-body)' }}>
        {/* Header */}
        <div
          style={{
            background: 'var(--surface-muted)',
            padding: '0',
            borderBottom: '1px solid rgba(255,255,255,0.06)',
          }}
          className="v2-light-panel"
        >
          <div
            className="mobile-page-hero-inner"
            style={{ maxWidth: 860, margin: '0 auto', padding: '20px 24px' }}
          >
            <div
              className="mobile-page-stack"
              style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 16 }}
            >
              <div>
                <ProfilePictureUpload
                  currentImage={(user?.companyLogo as string) ?? null}
                  name={form.companyName ?? 'E'}
                  size={96}
                  radius="18px"
                  gradient="linear-gradient(135deg, #243e4a, #334155)"
                  uploaderType="companyLogoUploader"
                  label="Choose company profile picture"
                  imageLabel="company profile picture"
                  fileNamePrefix="CompanyProfilePicture"
                  onUploaded={handleLogoUploaded}
                  onRemoved={handleLogoRemoved}
                />
              </div>
              <div>
                <h1
                  style={{
                    fontSize: 22,
                    fontWeight: 700,
                    color: 'var(--deep)',
                    fontFamily: 'var(--font-display)',
                    margin: 0,
                  }}
                >
                  {form.companyName || 'Your Company'}
                </h1>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 5 }}>
                  <span style={{ fontSize: 13, color: C.gray }}>
                    {form.industry || 'Industry not set'}
                  </span>
                  <span
                    style={{
                      background: verificationStatus === 'approved' ? '#ECFDF5' : '#FFFBEB',
                      color: verificationStatus === 'approved' ? '#065F46' : '#92400E',
                      border: `1px solid ${verificationStatus === 'approved' ? '#A7F3D0' : '#FDE68A'}`,
                      padding: '2px 10px',
                      borderRadius: 999,
                      fontSize: 11,
                      fontWeight: 700,
                    }}
                  >
                    {verificationStatus === 'approved'
                      ? '✓ Verified'
                      : verificationStatus === 'pending'
                        ? '⏳ Pending'
                        : '✗ Rejected'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mobile-page-body"
          style={{
            maxWidth: 860,
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

          {/* Section 1: Contact */}
          <div
            className="nx-surface"
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <SectionHeader icon={<Phone size={18} />} label="Contact Information" />
            <div
              className="mobile-page-grid-2 v2-page-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              <Field label="Contact Person Name">
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
              <Field label="Email">
                <input
                  type="email"
                  value={(user?.email as string) ?? ''}
                  disabled
                  style={{ ...inputBase, background: C.bg, color: C.gray, cursor: 'not-allowed' }}
                />
              </Field>
            </div>
          </div>

          {/* Section 2: Company Info */}
          <div
            className="nx-surface"
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <SectionHeader icon={<Building2 size={18} />} label="Company Information" />
            <div
              className="mobile-page-grid-2 v2-page-grid"
              style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
            >
              <Field label="Company Name">
                <input
                  type="text"
                  value={form.companyName}
                  onChange={(e) => set('companyName', e.target.value)}
                  placeholder="Your company name"
                  style={inputBase}
                />
              </Field>
              <Field label="Industry">
                <select
                  value={
                    BD_INDUSTRIES.includes(form.industry)
                      ? form.industry
                      : form.industry === ''
                        ? ''
                        : 'Other'
                  }
                  onChange={(e) => {
                    if (e.target.value === 'Other') {
                      set('industry', '__other__');
                    } else {
                      set('industry', e.target.value);
                    }
                  }}
                  style={{ ...inputBase, appearance: 'none' as const }}
                >
                  <option value="">Select industry</option>
                  {BD_INDUSTRIES.map((i) => (
                    <option key={i} value={i}>
                      {i}
                    </option>
                  ))}
                </select>
                {!BD_INDUSTRIES.includes(form.industry) && form.industry !== '' && (
                  <input
                    type="text"
                    value={form.industry === '__other__' ? '' : form.industry}
                    onChange={(e) => set('industry', e.target.value || '__other__')}
                    placeholder="Type your industry…"
                    autoFocus
                    style={{ ...inputBase, marginTop: 8 }}
                  />
                )}
              </Field>
              <Field label="Company Size">
                <select
                  value={form.companySize}
                  onChange={(e) => set('companySize', e.target.value)}
                  style={{ ...inputBase, appearance: 'none' as const }}
                >
                  <option value="">Select size</option>
                  {['1-10', '11-50', '51-200', '201-500', '500+'].map((s) => (
                    <option key={s} value={s}>
                      {s} employees
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Headquarters City">
                <select
                  value={form.headquartersCity}
                  onChange={(e) => set('headquartersCity', e.target.value)}
                  style={{ ...inputBase, appearance: 'none' as const }}
                >
                  <option value="">Select city</option>
                  {BD_CITIES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Company Website">
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
                    value={form.companyWebsite}
                    onChange={(e) => set('companyWebsite', e.target.value)}
                    placeholder="https://yourcompany.com"
                    style={{ ...inputBase, paddingLeft: 36 }}
                  />
                </div>
              </Field>
              <Field label="Trade License No.">
                <input
                  type="text"
                  value={form.tradeLicenseNo}
                  onChange={(e) => set('tradeLicenseNo', e.target.value)}
                  placeholder="BD Trade License number"
                  style={inputBase}
                />
              </Field>
            </div>
            <div style={{ marginTop: 16 }}>
              <Field label="Company Description">
                <textarea
                  value={form.companyDescription}
                  onChange={(e) => set('companyDescription', e.target.value)}
                  placeholder="Describe your company — what you do, your culture, why students should work with you…"
                  rows={4}
                  style={{ ...inputBase, resize: 'vertical' }}
                />
                <div style={{ fontSize: 11, color: C.light, marginTop: 4 }}>
                  {form.companyDescription.length}/1000 characters
                </div>
              </Field>
            </div>
          </div>

          {/* Section 3: Badges & Achievements */}
          <div
            className="nx-surface"
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <SectionHeader icon={<Award size={18} />} label="Badges & Achievements" />
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>
              Top-performing employers earn verified badges that are displayed here and visible to
              students.
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
                No badges earned yet. Keep actively hiring and receiving good reviews to unlock
                them!
              </div>
            ) : (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                  gap: 12,
                  maxHeight: 400,
                  overflowY: 'auto',
                  paddingRight: 8,
                }}
                className="v2-page-grid"
              >
                {badges.map((b) => (
                  <div
                    key={`${b.badgeSlug}-${b.awardedAt}`}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 12,
                      padding: '12px',
                      background: '#f6f8f9',
                      border: '1px solid #dfe6e9',
                      borderRadius: 12,
                    }}
                  >
                    <div style={{ fontSize: 24 }}>
                      <BadgeIcon value={b.badgeIcon} label={b.badgeName} />
                    </div>
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

          {/* Section 4: Reputation & Reviews */}
          <div
            className="nx-surface"
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <SectionHeader icon={<Award size={18} />} label="Reputation & Verified Reviews" />
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 16 }}>
              Verified feedback from students who have worked at your company forms your public
              reputation.
            </div>
            {user && (user._id || user.id) ? (
              <ReputationHistory userId={(user._id || user.id) as string} userRole="employer" />
            ) : (
              <BrandLoader variant="inline" label="Loading reputation data" />
            )}
          </div>

          {/* Section 5: Notification Preferences */}
          <div
            className="nx-surface"
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <SectionHeader icon={<Bell size={18} />} label="Notification Preferences" />
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, lineHeight: 1.6 }}>
              Choose which real-time employer notifications you receive. Changes are saved when you
              click <strong>Save Profile</strong>.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  key: 'application_received',
                  label: 'Job Applications',
                  desc: 'When a student applies to one of your job postings',
                },
                {
                  key: 'event_registrations',
                  label: 'Workshop & Webinar Registrations',
                  desc: 'When a student registers for one of your events',
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
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleNotificationPreference(item.key)}
                      aria-pressed={isOn}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 999,
                        border: 'none',
                        background: isOn ? C.blue : C.border,
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
                          boxShadow: 'var(--shadow-card)',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 6: Email Preferences */}
          <div
            className="nx-surface"
            style={{
              background: C.white,
              borderRadius: 12,
              border: `1px solid ${C.border}`,
              padding: '24px 28px',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <SectionHeader icon={<Mail size={18} />} label="Email Preferences" />
            <div style={{ fontSize: 13, color: C.gray, marginBottom: 20, lineHeight: 1.6 }}>
              Decide which employer email updates should be delivered to your inbox. In-app
              notifications remain controlled separately above.
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {[
                {
                  key: 'application_received',
                  label: 'Job application emails',
                  desc: 'Email alerts when a student applies to one of your job postings',
                },
                {
                  key: 'event_registrations',
                  label: 'Workshop & webinar registration emails',
                  desc: 'Email alerts when a student registers for one of your hosted events',
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
                      gap: 16,
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: 12, color: C.light, marginTop: 2 }}>{item.desc}</div>
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleEmailPreference(item.key)}
                      aria-pressed={isOn}
                      style={{
                        width: 44,
                        height: 24,
                        borderRadius: 999,
                        border: 'none',
                        background: isOn ? C.blue : C.border,
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
                          boxShadow: 'var(--shadow-card)',
                        }}
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Save */}
          <div
            className="mobile-page-action-row"
            style={{ display: 'flex', justifyContent: 'flex-end', paddingBottom: 32 }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '13px 32px',
                background: saving ? '#93C5FD' : `linear-gradient(135deg, ${C.blue}, #06665d)`,
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
    </EmployerClientShell>
  );
}
