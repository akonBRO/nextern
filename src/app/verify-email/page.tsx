'use client';
import { useState, useRef, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MailOpen, CheckCircle2, RotateCw } from 'lucide-react';
import AuthShell from '@/components/site/AuthShell';
export default function VerifyEmailPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';
  const deliveryFailed = searchParams.get('delivery') === 'failed';

  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [shakeTrigger, setShakeTrigger] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => c - 1), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  // Auto-focus first input on mount
  useEffect(() => {
    setTimeout(() => inputRefs.current[0]?.focus(), 100);
  }, []);

  function handleOtpInput(index: number, value: string) {
    if (!/^\d*$/.test(value)) return;
    const next = [...otp];
    next[index] = value.slice(-1);
    setOtp(next);
    setError('');
    if (value && index < 5) inputRefs.current[index + 1]?.focus();
    if (next.every((d) => d) && !next.includes('')) {
      submitOtp(next.join(''));
    }
  }

  function handleKeyDown(index: number, e: React.KeyboardEvent) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  }

  function handlePaste(e: React.ClipboardEvent) {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    const next = [...otp];
    pasted.split('').forEach((char, i) => {
      next[i] = char;
    });
    setOtp(next);
    if (pasted.length === 6) submitOtp(pasted);
    else inputRefs.current[pasted.length]?.focus();
  }

  async function submitOtp(code: string) {
    if (!email) {
      setError('Email not found. Please register again.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error ?? 'Verification failed. Please try again.');
        setOtp(['', '', '', '', '', '']);
        setShakeTrigger(true);
        setTimeout(() => setShakeTrigger(false), 600);
        inputRefs.current[0]?.focus();
      } else {
        setVerified(true);
        setSuccess('Email verified successfully!');
        setTimeout(() => {
          router.push(data.requiresAdminApproval ? '/pending-approval' : '/login?verified=1');
        }, 2000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    if (cooldown > 0 || !email) return;
    setResending(true);
    setError('');
    try {
      const res = await fetch('/api/auth/resend-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, type: 'email_verify' }),
      });
      const data = await res.json();
      if (res.ok) {
        setSuccess('New code sent! Check your inbox.');
        setCooldown(60);
        setOtp(['', '', '', '', '', '']);
        inputRefs.current[0]?.focus();
        setTimeout(() => setSuccess(''), 4000);
      } else {
        setError(data.error ?? 'Failed to resend. Try again.');
      }
    } catch {
      setError('Network error.');
    } finally {
      setResending(false);
    }
  }

  return (
    <AuthShell compact>
      <div className="auth-v2-status-icon">
        {verified ? <CheckCircle2 size={29} /> : <MailOpen size={28} />}
      </div>
      <h1>{verified ? 'Email verified' : 'Check your inbox'}</h1>
      <p className="auth-v2-intro">
        {verified ? (
          'Your email is confirmed. We are taking you to the next step…'
        ) : (
          <>
            Enter the six-digit code sent to{' '}
            <strong style={{ color: '#344d59', overflowWrap: 'anywhere' }}>
              {email || 'your email address'}
            </strong>
            .
          </>
        )}
      </p>
      {!verified && (
        <>
          {!email && (
            <div role="alert" className="auth-v2-notice auth-v2-warning">
              An email address is needed to verify your account.{' '}
              <Link href="/register">Return to registration</Link>.
            </div>
          )}
          {error && (
            <div role="alert" className="auth-v2-notice auth-v2-error">
              {error}
            </div>
          )}
          {deliveryFailed && !error && (
            <div role="status" className="auth-v2-notice auth-v2-warning">
              Your account was created, but the first email did not send. Select Resend code to try
              again.
            </div>
          )}
          {success && (
            <div role="status" className="auth-v2-notice">
              {success}
            </div>
          )}
          <div
            className="auth-v2-otp"
            role="group"
            aria-label="Six-digit verification code"
            data-invalid={shakeTrigger}
          >
            {otp.map((digit, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputRefs.current[i] = el;
                }}
                type="text"
                inputMode="numeric"
                autoComplete={i === 0 ? 'one-time-code' : 'off'}
                maxLength={1}
                value={digit}
                aria-label={'Digit ' + (i + 1)}
                aria-invalid={!!error}
                onChange={(e) => handleOtpInput(i, e.target.value)}
                onKeyDown={(e) => handleKeyDown(i, e)}
                onPaste={i === 0 ? handlePaste : undefined}
                disabled={loading || !email}
              />
            ))}
          </div>
          <p className="auth-v2-help" role="status" aria-live="polite">
            {loading
              ? 'Verifying your code…'
              : 'Your code is verified automatically when all six digits are entered.'}
          </p>
          <p className="auth-v2-help">
            Did not receive an email? Check your spam folder, or{' '}
            <button
              className="auth-v2-link"
              type="button"
              onClick={resendOtp}
              disabled={resending || cooldown > 0 || !email}
            >
              <RotateCw size={13} />
              {resending
                ? 'Sending…'
                : cooldown > 0
                  ? 'Resend in ' + cooldown + 's'
                  : 'Resend code'}
            </button>
          </p>
          <p className="auth-v2-footnote">
            <Link href="/register">Use a different email address</Link>
          </p>
        </>
      )}
    </AuthShell>
  );
}
