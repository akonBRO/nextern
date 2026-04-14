'use client';

import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import StudentNavbar from '@/components/student/StudentNavbar';

type UserProps = {
  name: string;
  email: string;
  image?: string;
  userId: string;
  opportunityScore: number;
  profileCompleteness: number;
  unreadNotifications: number;
  unreadMessages: number;
};

type StudentPageShellProps = {
  user: UserProps;
  children: ReactNode;
};

const DASHBOARD_SHELL_PATHS = new Set([
  '/student/dashboard',
  '/student/calendar',
  '/student/jobs',
  '/student/applications',
  '/student/badges',
  '/student/skills',
  '/student/subscription',
  '/student/mock-interview',
  '/student/messages',
]);

function isDashboardShellPath(pathname: string) {
  if (!pathname.startsWith('/student')) return false;
  if (pathname.startsWith('/student/jobs/')) return true;
  return DASHBOARD_SHELL_PATHS.has(pathname);
}

export default function StudentPageShell({ user, children }: StudentPageShellProps) {
  const pathname = usePathname();
  const showNavbar = !pathname || !isDashboardShellPath(pathname);

  return (
    <>
      {showNavbar && <StudentNavbar user={user} />}
      {children}
    </>
  );
}
