'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';

type EmployerPageShellProps = {
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
  '/employer/dashboard',
  '/employer/calendar',
  '/employer/jobs',
  '/employer/assessments',
  '/employer/interviews',
  '/employer/recommendations',
  '/employer/messages',
  '/employer/freelance',
  '/employer/ai',
  '/employer/profile',
  '/employer/badges',
  '/employer/premium',
  '/employer/subscription',
];

function hasPageLevelShell(pathname: string) {
  return PAGE_LEVEL_SHELL_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function EmployerPageShell({ user, children }: EmployerPageShellProps) {
  const pathname = usePathname();

  if (!pathname?.startsWith('/employer') || hasPageLevelShell(pathname)) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
