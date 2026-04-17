'use client';

import { useEffect, useState, type ReactNode } from 'react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';

type EmployerShellUser = {
  name: string;
  email: string;
  image?: string;
  subtitle: string;
  isPremium?: boolean;
  unreadNotifications: number;
  unreadMessages: number;
  userId?: string;
};

const fallbackUser: EmployerShellUser = {
  name: 'Employer',
  email: '',
  subtitle: 'Employer workspace',
  unreadNotifications: 0,
  unreadMessages: 0,
};

export default function EmployerClientShell({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<EmployerShellUser>(fallbackUser);

  useEffect(() => {
    let cancelled = false;

    async function loadShellUser() {
      try {
        const [profileRes, premiumRes] = await Promise.all([
          fetch('/api/users/profile', { cache: 'no-store' }),
          fetch('/api/premium/status', { cache: 'no-store' }),
        ]);

        const profileData = profileRes.ok
          ? ((await profileRes.json()) as { user?: Record<string, unknown> })
          : {};
        const premiumData = premiumRes.ok
          ? ((await premiumRes.json()) as { isPremium?: boolean })
          : {};
        const profile = profileData.user;

        if (!cancelled && profile) {
          setUser({
            name: String(profile.name ?? 'Employer'),
            email: String(profile.email ?? ''),
            image: typeof profile.image === 'string' ? profile.image : undefined,
            subtitle:
              typeof profile.companyName === 'string' && profile.companyName
                ? profile.companyName
                : 'Employer workspace',
            isPremium: Boolean(premiumData.isPremium),
            unreadNotifications: 0,
            unreadMessages: 0,
            userId:
              typeof profile._id === 'string'
                ? profile._id
                : typeof profile.id === 'string'
                  ? profile.id
                  : undefined,
          });
        }
      } catch {
        // Keep client-only employer pages navigable even if the profile request fails.
      }
    }

    loadShellUser();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer workspace"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={user}
    >
      {children}
    </DashboardShell>
  );
}
