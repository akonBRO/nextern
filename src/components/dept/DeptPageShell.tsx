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

const PAGE_LEVEL_SHELL_PREFIXES = [
  '/dept/dashboard',
  '/dept/advisors',
  '/dept/students',
  '/dept/report',
  '/dept/calendar',
  '/dept/messages',
  '/dept/notifications',
  '/dept/profile',
  '/dept/badges',
  '/dept/recommendations',
  '/dept/events',
];

function hasPageLevelShell(pathname: string) {
  return PAGE_LEVEL_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function DeptPageShell({ user, children }: DeptPageShellProps) {
  const pathname = usePathname();

  if (!pathname?.startsWith('/dept') || hasPageLevelShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
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
