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

export default function EmployerPageShell({ user, children }: EmployerPageShellProps) {
  const pathname = usePathname();

  if (!pathname?.startsWith('/employer')) {
    return <>{children}</>;
  }

  return (
    <DashboardShell
      hideFooter={pathname?.endsWith('/messages')}
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
