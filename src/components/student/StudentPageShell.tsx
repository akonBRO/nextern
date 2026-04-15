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

const STANDALONE_NAVBAR_PATHS = new Set([
  '/student/profile',
  '/student/resume',
  '/student/ger',
  '/student/notifications',
  '/student/premium',
]);

function shouldUseStandaloneNavbar(pathname: string) {
  if (!pathname.startsWith('/student')) return false;
  if (pathname.startsWith('/student/profile/')) return true;
  if (pathname.startsWith('/student/resume/')) return true;
  if (pathname.startsWith('/student/ger/')) return true;
  if (pathname.startsWith('/student/notifications/')) return true;
  if (pathname.startsWith('/student/premium/')) return true;
  return STANDALONE_NAVBAR_PATHS.has(pathname);
}

export default function StudentPageShell({ user, children }: StudentPageShellProps) {
  const pathname = usePathname();
  const showNavbar = !pathname || shouldUseStandaloneNavbar(pathname);

  return (
    <>
      {showNavbar && <StudentNavbar user={user} />}
      {children}
    </>
  );
}
