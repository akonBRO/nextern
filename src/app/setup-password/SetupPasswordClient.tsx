'use client';
import { useState } from 'react';
import { signOut } from 'next-auth/react';
import { Check, Circle, KeyRound } from 'lucide-react';
import AuthShell from '@/components/site/AuthShell';
export default function SetupPasswordClient({ email }: { email: string }) {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const checks = [
    { label: 'At least 8 characters', ok: newPassword.length >= 8 },
    { label: 'One uppercase letter', ok: /[A-Z]/.test(newPassword) },
    { label: 'One number', ok: /[0-9]/.test(newPassword) },
    { label: 'One special character', ok: /[^A-Za-z0-9]/.test(newPassword) },
  ];

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/users/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'set_initial_password',
          newPassword,
        }),
      });

      const data = (await response.json().catch(() => ({}))) as { error?: string };
      if (!response.ok) {
        setError(data.error ?? 'Failed to update password.');
        return;
      }

      await signOut({ callbackUrl: '/login?passwordSet=1' });
      return;
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AuthShell compact>
      <div className="auth-v2-status-icon">
        <KeyRound size={27} />
      </div>
      <h1>Make this account yours</h1>
      <p className="auth-v2-intro">
        You signed in with a one-time password for{' '}
        <strong style={{ overflowWrap: 'anywhere' }}>{email}</strong>. Create your own password to
        finish setting up your account, then sign in again.
      </p>
      <form onSubmit={handleSubmit} className="auth-v2-fields">
        <div className="auth-v2-field">
          <label htmlFor="setup-password">New password</label>
          <input
            id="setup-password"
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Create a strong password"
            required
            aria-describedby="setup-password-rules"
          />
        </div>
        <div className="auth-v2-field">
          <label htmlFor="setup-confirm">Confirm password</label>
          <input
            id="setup-confirm"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            autoComplete="new-password"
            placeholder="Repeat your new password"
            required
          />
        </div>
        <ul id="setup-password-rules" className="auth-v2-rules">
          {checks.map((check) => (
            <li key={check.label} data-valid={check.ok}>
              {check.ok ? <Check size={13} /> : <Circle size={9} />}
              {check.label}
            </li>
          ))}
        </ul>
        {error && (
          <div role="alert" className="auth-v2-notice auth-v2-error" style={{ margin: 0 }}>
            {error}
          </div>
        )}
        <button className="public-button" type="submit" disabled={saving}>
          {saving ? 'Saving password…' : 'Save password and sign in'}
        </button>
      </form>
    </AuthShell>
  );
}
