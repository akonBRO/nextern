'use client';

import DashboardShell from '@/components/dashboard/DashboardShell';
import { ALUMNI_NAV_ITEMS, STUDENT_NAV_ITEMS } from '@/lib/student-navigation';

type NavbarProps = {
  user: {
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
};

export default function StudentNavbar({ user }: NavbarProps) {
  const mentor = user.role === 'alumni';
  return (
    <DashboardShell
      embedded
      role={mentor ? 'alumni' : 'student'}
      roleLabel={mentor ? 'Mentor workspace' : 'Student workspace'}
      homeHref={mentor ? '/student/mentorship/dashboard' : '/student/dashboard'}
      navItems={mentor ? ALUMNI_NAV_ITEMS : STUDENT_NAV_ITEMS}
      user={{
        ...user,
        subtitle: mentor
          ? 'Alumni mentor workspace'
          : `${user.opportunityScore} score · ${user.profileCompleteness}% profile complete`,
      }}
      navigationOnly
    >
      {null}
    </DashboardShell>
  );
}
