import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage, DashboardSection } from '@/components/dashboard/DashboardContent';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import MockInterviewClient from './MockInterviewClient';

export default async function StudentMockInterviewPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'student') redirect('/login');

  return (
    <DashboardShell
      role="student"
      roleLabel="Student"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: session.user.name ?? 'Student',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        subtitle: session.user.email ?? '',
        unreadNotifications: 0,
        unreadMessages: 0,
      }}
    >
      <DashboardPage>
        <DashboardSection
          title="AI Mock Interview"
          description="Practice role-specific interviews with AI guidance and receive instant feedback after each session."
        >
          <MockInterviewClient />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
