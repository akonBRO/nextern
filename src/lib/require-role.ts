import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getDashboardForRole,
  getDefaultAuthenticatedRoute,
  roleSatisfiesRequirement,
  type UserRole,
} from '@/lib/role-routing';

export async function requireRole(role: UserRole) {
  const session = await auth();
  const expectedDashboard = getDashboardForRole(role);

  if (!session?.user) {
    redirect(`/login?callbackUrl=${encodeURIComponent(expectedDashboard)}`);
  }

  if (!session.user.isVerified) {
    redirect(`/verify-email?email=${encodeURIComponent(session.user.email ?? '')}`);
  }

  if (session.user.mustChangePassword) {
    redirect('/setup-password');
  }

  const redirectTarget = getDefaultAuthenticatedRoute({
    role: session.user.role,
    verificationStatus: session.user.verificationStatus,
    mustChangePassword: session.user.mustChangePassword,
  });

  if (redirectTarget === '/pending-approval') {
    redirect(redirectTarget);
  }

  if (!roleSatisfiesRequirement(session.user.role, role)) {
    redirect(redirectTarget);
  }

  return session;
}
