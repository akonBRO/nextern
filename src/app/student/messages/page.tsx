import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Inbox from '@/components/messaging/Inbox';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { STUDENT_NAV_ITEMS, ALUMNI_NAV_ITEMS } from '@/lib/student-navigation';
import { getStudentDashboardData } from '@/lib/student-dashboard';

export default async function StudentMessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student' && session.user.role !== 'alumni') redirect('/login');

  const isMentor = session.user.role === 'alumni';

  const params = await searchParams;
  const initiateUser = typeof params?.user === 'string' ? params.user : undefined;
  const initiateFreelanceOrder = typeof params?.order === 'string' ? params.order : undefined;

  const data = await getStudentDashboardData(session.user.id);

  return (
    <DashboardShell
      role={isMentor ? 'alumni' : 'student'}
      roleLabel={isMentor ? 'Mentor dashboard' : 'Student dashboard'}
      homeHref={isMentor ? '/student/mentorship/dashboard' : '/student/dashboard'}
      navItems={isMentor ? ALUMNI_NAV_ITEMS : STUDENT_NAV_ITEMS}
      user={{
        name: session.user.name ?? (isMentor ? 'Mentor' : 'Student'),
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        userId: session.user.id,
        subtitle: isMentor ? 'Mentor workspace' : 'Student workspace',
        unreadNotifications: data.profile.unreadNotifications,
        unreadMessages: data.profile.unreadMessages,
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
          currentUserRole={session.user.role as 'student' | 'alumni'}
          initiateUserId={initiateUser}
          initiateFreelanceOrderId={initiateFreelanceOrder}
        />
      </div>
    </DashboardShell>
  );
}
