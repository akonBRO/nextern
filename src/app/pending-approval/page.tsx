import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { CheckCircle2, Circle, Clock3, Mail, XCircle } from 'lucide-react';
import { getDefaultAuthenticatedRoute } from '@/lib/role-routing';
import SignOutRedirectButton from '@/components/auth/SignOutRedirectButton';
import AuthShell from '@/components/site/AuthShell';
const ROLE_LABELS: Record<string, string> = {
  employer: 'employer account',
  advisor: 'advisor account',
  dept_head: 'department head account',
};
export default async function PendingApprovalPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const redirectTarget = getDefaultAuthenticatedRoute({
    role: session.user.role,
    verificationStatus: session.user.verificationStatus,
    mustChangePassword: session.user.mustChangePassword,
  });

  if (redirectTarget !== '/pending-approval') {
    redirect(redirectTarget);
  }

  const isRejected = session.user.verificationStatus === 'rejected';
  const roleLabel = ROLE_LABELS[session.user.role] ?? 'account';
  const userName = session.user.name?.split(' ')[0] ?? 'there';

  return (
    <AuthShell compact>
      <div className="auth-v2-status-icon">
        {isRejected ? <XCircle size={28} /> : <Clock3 size={28} />}
      </div>
      <h1>{isRejected ? 'Application not approved' : 'Your account is under review'}</h1>
      <p className="auth-v2-intro">
        {isRejected
          ? 'Your ' +
            roleLabel +
            ' application was not approved. Contact support if you need help with the next step.'
          : 'Hi ' +
            userName +
            ', we are reviewing your ' +
            roleLabel +
            '. We will email you once a decision is made.'}
      </p>
      {isRejected ? (
        <div className="auth-v2-notice auth-v2-error">
          Applications may be declined if information is incomplete, credentials cannot be verified,
          or eligibility requirements are not met.
        </div>
      ) : (
        <ol className="auth-v2-progress">
          <li>
            <CheckCircle2 size={20} />
            <span>
              <strong>Registration received</strong>Your email address has been verified.
            </span>
          </li>
          <li aria-current="step">
            <Clock3 size={20} />
            <span>
              <strong>Account review in progress</strong>Our team is checking your details.
            </span>
          </li>
          <li>
            <Circle size={20} />
            <span>
              <strong>Receive a decision by email</strong>Once approved, sign in to access your
              workspace.
            </span>
          </li>
        </ol>
      )}
      <a
        className="public-button public-button-outline"
        href="mailto:support@nextern.app"
        style={{ width: '100%' }}
      >
        <Mail size={16} /> Contact support
      </a>
      <p className="auth-v2-footnote">
        <SignOutRedirectButton
          redirectTo="/login"
          style={{
            color: '#087f72',
            background: 'transparent',
            border: 0,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            padding: '8px 0',
          }}
        >
          Sign out and return to sign in
        </SignOutRedirectButton>
      </p>
      <p className="auth-v2-footnote" style={{ marginTop: 10 }}>
        <Link href="/">Back to homepage</Link>
      </p>
    </AuthShell>
  );
}
