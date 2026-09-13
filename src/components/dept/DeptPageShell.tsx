'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

type DeptPageShellProps = {
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

export default function DeptPageShell({ user, children }: DeptPageShellProps) {
  const pathname = usePathname();

  if (!pathname?.startsWith('/dept')) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      hideFooter={pathname?.endsWith('/messages')}
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
