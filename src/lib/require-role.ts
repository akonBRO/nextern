import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import {
  getDashboardForRole,
  getDefaultAuthenticatedRoute,
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

  const redirectTarget = getDefaultAuthenticatedRoute({
    role: session.user.role,
    verificationStatus: session.user.verificationStatus,
  });

  if (redirectTarget === '/pending-approval') {
    redirect(redirectTarget);
  }

  if (session.user.role !== role) {
    redirect(redirectTarget);
  }

  return session;
}
