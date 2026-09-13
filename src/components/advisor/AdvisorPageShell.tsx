'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

type AdvisorPageShellProps = {
  role: 'advisor' | 'departmentHead';
  roleLabel: string;
  homeHref: string;
  user: {
    name: string;
    email: string;
    image?: string;
    subtitle: string;
    unreadNotifications: number;
    unreadMessages: number;
    userId: string;
  };
  children: ReactNode;
};

export default function AdvisorPageShell({
  role,
  roleLabel,
  homeHref,
  user,
  children,
}: AdvisorPageShellProps) {
  const pathname = usePathname();

  if (!pathname?.startsWith('/advisor')) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      hideFooter={pathname?.endsWith('/messages')}
      role={role}
      roleLabel={roleLabel}
      homeHref={homeHref}
      navItems={role === 'departmentHead' ? DEPT_NAV_ITEMS : ADVISOR_NAV_ITEMS}
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
