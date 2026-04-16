import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getDashboardForRole } from '@/lib/role-routing';
import SetupPasswordClient from './SetupPasswordClient';

export default async function SetupPasswordPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.role) {
    redirect('/login');
  }

  if (!session.user.mustChangePassword) {
    redirect(getDashboardForRole(session.user.role));
  }

  return <SetupPasswordClient email={session.user.email ?? ''} />;
}
