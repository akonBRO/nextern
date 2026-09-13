'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ALUMNI_NAV_ITEMS, STUDENT_NAV_ITEMS } from '@/lib/student-navigation';

type UserProps = {
  name: string;
  email: string;
  image?: string;
  userId: string;
  role?: string;
  opportunityScore: number;
  profileCompleteness: number;
  unreadNotifications: number;
  unreadMessages: number;
};

type StudentPageShellProps = {
  user: UserProps;
  children: ReactNode;
};

export default function StudentPageShell({ user, children }: StudentPageShellProps) {
  const pathname = usePathname();
  const isMentor = user.role === 'alumni';

  if (!pathname?.startsWith('/student')) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      hideFooter={pathname?.endsWith('/messages')}
      role={isMentor ? 'alumni' : 'student'}
      roleLabel={isMentor ? 'Mentor dashboard' : 'Student dashboard'}
      homeHref={isMentor ? '/student/mentorship/dashboard' : '/student/dashboard'}
      navItems={isMentor ? ALUMNI_NAV_ITEMS : STUDENT_NAV_ITEMS}
      user={{
        name: user.name,
        email: user.email,
        image: user.image,
        userId: user.userId,
        subtitle: isMentor ? 'Mentor workspace' : 'Student workspace',
        unreadNotifications: user.unreadNotifications,
        unreadMessages: user.unreadMessages,
      }}
    >
      {children}
    </DashboardShell>
  );
}
