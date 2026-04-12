import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';

import Inbox from '@/components/messaging/Inbox';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { getEmployerDashboardData } from '@/lib/role-dashboard';

export default async function EmployerMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'employer') {
    redirect('/login');
  }

  const params = await searchParams;
  const initiateUser = typeof params?.user === 'string' ? params.user : undefined;

  const data = await getEmployerDashboardData(session.user.id);

  return (
    <DashboardShell
      role="employer"
      roleLabel="Company overview"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={{
        ...data.chromeUser,
        isPremium: false,
      }}
      hideFooter
    >
      <div
        style={{
          height: '100%',
          padding: '16px 24px',
          boxSizing: 'border-box',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Inbox
          currentUserId={session.user.id}
          currentUserRole="employer"
          initiateUserId={initiateUser}
        />
      </div>
    </DashboardShell>
  );
}
