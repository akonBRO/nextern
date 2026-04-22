import type { ReactNode } from 'react';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { auth } from '@/lib/auth';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';
import { getDeptDashboardData } from '@/lib/role-dashboard';

export default async function DepartmentHeadShell({ children }: { children: ReactNode }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'dept_head') {
    redirect('/login');
  }

  const data = await getDeptDashboardData({
    userId: session.user.id,
    email: session.user.email ?? undefined,
  });

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      {children}
    </DashboardShell>
  );
}
