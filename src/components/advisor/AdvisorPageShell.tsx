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

const ADVISOR_PAGE_LEVEL_SHELL_PREFIXES = [
  '/advisor/dashboard',
  '/advisor/calendar',
  '/advisor/students',
  '/advisor/recommendations',
  '/advisor/messages',
  '/advisor/notifications',
  '/advisor/profile',
  '/advisor/badges',
];

function hasPageLevelShell(pathname: string) {
  if (
    ADVISOR_PAGE_LEVEL_SHELL_PREFIXES.some(
      (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
    )
  ) {
    return true;
  }

  if (pathname === '/advisor/events') {
    return true;
  }

  if (!pathname.startsWith('/advisor/events/')) {
    return false;
  }

  return pathname.includes('/registrants') || pathname.includes('/applicants');
}

export default function AdvisorPageShell({
  role,
  roleLabel,
  homeHref,
  user,
  children,
}: AdvisorPageShellProps) {
  const pathname = usePathname();

  if (!pathname?.startsWith('/advisor') || hasPageLevelShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
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
