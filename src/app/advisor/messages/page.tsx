import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Inbox from '@/components/messaging/Inbox';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';
import { getAdvisorDashboardData } from '@/lib/role-dashboard';

export default async function AdvisorMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'advisor') redirect('/login');

  const params = await searchParams;
  const initiateUser = typeof params?.user === 'string' ? params.user : undefined;

  const data = await getAdvisorDashboardData({
    userId: session.user.id,
    email: session.user.email ?? undefined,
  });

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={ADVISOR_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
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
          currentUserRole="advisor"
          initiateUserId={initiateUser}
        />
      </div>
    </DashboardShell>
  );
}
