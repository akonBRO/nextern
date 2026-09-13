'use client';
import { type FormEvent, useState } from 'react';
import Link from 'next/link';
import { KeyRound, CheckCircle2 } from 'lucide-react';
import AuthShell from '@/components/site/AuthShell';
type Step = 'request' | 'reset' | 'success';
export default function ForgotPasswordPage() {
  const [step, setStep] = useState<Step>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function requestCode(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError('');
    setMessage('');

    try {
      const response = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'password_reset' }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data.error ?? 'Could not send the reset code. Please try again.');
        return;
      }

      setMessage('If an account exists for that email, a reset code has been sent.');
      setStep('reset');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resetPassword(event: FormEvent) {
    event.preventDefault();
    setError('');

    if (newPassword !== confirmPassword) {
      setError('The passwords do not match.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp, newPassword }),
      });
      const data = await response.json();
      if (!response.ok) {
        const fieldErrors = data.details as Record<string, string[]> | undefined;
        setError(
          fieldErrors
            ? Object.values(fieldErrors).flat()[0]
            : (data.error ?? 'Password reset failed.')
        );
        return;
      }

      setStep('success');
      setMessage(data.message ?? 'Password reset successfully.');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell compact>
      <div className="auth-v2-status-icon">
        {step === 'success' ? <CheckCircle2 size={29} /> : <KeyRound size={27} />}
      </div>
      <h1>{step === 'success' ? 'Password updated' : 'Reset your password'}</h1>
      <p className="auth-v2-intro">
        {step === 'request'
          ? 'Enter your account email and we will send you a six-digit reset code.'
          : step === 'reset'
            ? 'Enter the code sent to ' + email + ' and choose a new password.'
            : 'You can now sign in using your new password.'}
      </p>
      {(error || message) && (
        <div
          role={error ? 'alert' : 'status'}
          className={'auth-v2-notice' + (error ? ' auth-v2-error' : '')}
        >
          {error || message}
        </div>
      )}
      {step === 'request' && (
        <form onSubmit={requestCode} className="auth-v2-fields">
          <div className="auth-v2-field">
            <label htmlFor="reset-email">Email address</label>
            <input
              id="reset-email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              autoComplete="email"
              required
            />
          </div>
          <button type="submit" className="public-button" disabled={loading}>
            {loading ? 'Sending code…' : 'Send reset code'}
          </button>
        </form>
      )}
      {step === 'reset' && (
        <form onSubmit={resetPassword} className="auth-v2-fields">
          <div className="auth-v2-field">
            <label htmlFor="reset-code">Six-digit code</label>
            <input
              id="reset-code"
              type="text"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              pattern="[0-9]{6}"
              required
            />
          </div>
          <div className="auth-v2-field">
            <label htmlFor="new-password">New password</label>
            <input
              id="new-password"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoComplete="new-password"
              required
              aria-describedby="reset-rules"
            />
            <small id="reset-rules" className="auth-v2-help" style={{ margin: 0 }}>
              At least 8 characters with an uppercase letter, a number, and a symbol.
            </small>
          </div>
          <div className="auth-v2-field">
            <label htmlFor="confirm-password">Confirm new password</label>
            <input
              id="confirm-password"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              autoComplete="new-password"
              required
            />
          </div>
          <button type="submit" className="public-button" disabled={loading}>
            {loading ? 'Updating password…' : 'Reset password'}
          </button>
          <button
            type="button"
            className="auth-v2-link"
            onClick={() => {
              setStep('request');
              setOtp('');
              setMessage('');
              setError('');
            }}
          >
            Use a different email
          </button>
        </form>
      )}
      {step === 'success' ? (
        <Link className="public-button" href="/login" style={{ width: '100%' }}>
          Return to sign in
        </Link>
      ) : (
        <p className="auth-v2-footnote">
          Remembered your password? <Link href="/login">Sign in</Link>
        </p>
      )}
    </AuthShell>
  );
}
