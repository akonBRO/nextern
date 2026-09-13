'use client';
import { useEffect, useState } from 'react';
import { getSession, signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Eye, EyeOff, ArrowRight } from 'lucide-react';
import { getPostLoginRedirect } from '@/lib/role-routing';
import AuthShell from '@/components/site/AuthShell';

const ERROR_MESSAGES: Record<string, string> = {
  EMAIL_NOT_VERIFIED: 'Please verify your email before logging in.',
  CredentialsSignin: 'Invalid email or password.',
  OAuthAccountNotLinked: 'This email is linked to a different sign-in method.',
  AccessDenied: 'Google sign-in is not available for this account. Use email and password.',
};

function GoogleLogo() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path
        fill="#4285F4"
        d="M47.53 24.56c0-1.64-.15-3.22-.42-4.74H24v8.97h13.24c-.57 3.01-2.3 5.56-4.9 7.28v6.05h7.93c4.64-4.27 7.32-10.57 7.32-17.56z"
      />
      <path
        fill="#34A853"
        d="M24 48c6.64 0 12.21-2.2 16.28-5.96l-7.93-6.05C30.2 37.6 27.29 38.4 24 38.4c-6.42 0-11.86-4.33-13.8-10.16H2.04v6.26C6.1 42.88 14.44 48 24 48z"
      />
      <path
        fill="#FBBC05"
        d="M10.2 28.24A14.44 14.44 0 0 1 9.6 24c0-1.47.25-2.9.6-4.24v-6.26H2.04A23.95 23.95 0 0 0 0 24c0 3.88.93 7.56 2.04 10.5l8.16-6.26z"
      />
      <path
        fill="#EA4335"
        d="M24 9.6c3.62 0 6.86 1.24 9.42 3.68l7.06-7.07C36.2 2.38 30.63 0 24 0 14.44 0 6.1 5.12 2.04 13.5l8.16 6.26C12.14 13.93 17.58 9.6 24 9.6z"
      />
    </svg>
  );
}

async function waitForSession(maxAttempts = 6, delayMs = 150) {
  for (let attempt = 0; attempt < maxAttempts; attempt += 1) {
    const session = await getSession();
    if (session?.user) {
      return session;
    }

    await new Promise((resolve) => window.setTimeout(resolve, delayMs));
  }

  return null;
}

/* ── MAIN ──────────────────────────────────────────────────────────── */
export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const callbackUrl = searchParams.get('callbackUrl') ?? '';
  const urlError = searchParams.get('error');
  const passwordSet = searchParams.get('passwordSet') === '1';

  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState(
    urlError ? (ERROR_MESSAGES[urlError] ?? 'Sign-in error. Try again.') : ''
  );
  const [loading, setLoading] = useState(false);
  const [showPass, setShowPass] = useState(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) {
      return;
    }

    const redirectTarget = getPostLoginRedirect(session.user, callbackUrl);
    window.location.replace(redirectTarget);
  }, [callbackUrl, session, status]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const result = await signIn('credentials', {
        email: form.email.trim().toLowerCase(),
        password: form.password,
        redirect: false,
        callbackUrl: callbackUrl || '/',
      });
      if (result?.error) {
        setError(ERROR_MESSAGES[result.error] ?? 'Invalid email or password.');
        if (result.error === 'EMAIL_NOT_VERIFIED') {
          router.push(`/verify-email?email=${encodeURIComponent(form.email)}`);
          return;
        }
      } else {
        const freshSession = await waitForSession();
        const redirectTarget = freshSession?.user
          ? getPostLoginRedirect(freshSession.user, callbackUrl)
          : '/';

        window.location.replace(redirectTarget);
        return;
      }
    } catch {
      setError('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    setLoading(true);
    await signIn('google', { callbackUrl: callbackUrl || '/' });
  }

  return (
    <AuthShell>
      <h1>Welcome back</h1>
      <p className="auth-v2-intro">
        Sign in to pick up where you left off. New here?{' '}
        <Link href="/register">Create an account</Link>
      </p>
      {callbackUrl.startsWith('/student/jobs') && (
        <div className="auth-v2-notice">
          Sign in to explore available opportunities. We will take you straight to your search.
        </div>
      )}
      {passwordSet && (
        <div role="status" className="auth-v2-notice">
          Your password is set. Sign in with your email and new password.
        </div>
      )}
      {searchParams.get('verified') === '1' && (
        <div role="status" className="auth-v2-notice">
          Email verified. You can now sign in.
        </div>
      )}
      {error && (
        <div role="alert" className="auth-v2-notice auth-v2-error">
          {error}
        </div>
      )}
      <button type="button" className="auth-v2-google" disabled={loading} onClick={handleGoogle}>
        <GoogleLogo /> Continue with Google
      </button>
      <div className="auth-v2-divider">or sign in with email</div>
      <form onSubmit={handleSubmit} className="auth-v2-fields">
        <div className="auth-v2-field">
          <label htmlFor="login-email">Email address</label>
          <input
            id="login-email"
            type="email"
            autoComplete="email"
            required
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@email.com"
          />
        </div>
        <div className="auth-v2-field">
          <div className="auth-v2-field-label">
            <label htmlFor="login-password">Password</label>
            <Link href="/forgot-password">Forgot password?</Link>
          </div>
          <div className="auth-v2-password">
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              autoComplete="current-password"
              required
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="Enter your password"
            />
            <button
              type="button"
              className="auth-v2-eye"
              aria-label={showPass ? 'Hide password' : 'Show password'}
              aria-pressed={showPass}
              onClick={() => setShowPass((p) => !p)}
            >
              {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>
        <button type="submit" className="public-button" disabled={loading}>
          {loading ? (
            'Signing in…'
          ) : (
            <>
              Sign in <ArrowRight size={17} />
            </>
          )}
        </button>
      </form>
      <p className="auth-v2-footnote">
        By signing in, you agree to our <Link href="/terms">Terms of Service</Link> and{' '}
        <Link href="/privacy">Privacy Policy</Link>.
      </p>
    </AuthShell>
  );
}
