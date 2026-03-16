// src/app/employer/premium/page.tsx
import { auth } from '@/lib/auth';
import { syncPremiumStatus } from '@/lib/premium';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage, DashboardSection } from '@/components/dashboard/DashboardContent';
import EmployerPremiumClient from './EmployerPremiumClient';

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
  { label: 'Premium', href: '/employer/premium', icon: 'shield' as const },
];

export default async function EmployerPremiumPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'employer') redirect('/login');
  const premiumStatus = await syncPremiumStatus(session.user.id);

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer"
      homeHref="/employer/dashboard"
      navItems={navItems}
      user={{
        name: session.user.name ?? '',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        subtitle: session.user.email ?? '',
        unreadNotifications: 0,
        unreadMessages: 0,
      }}
    >
      <DashboardPage>
        <DashboardSection
          title="Employer Premium"
          description="Unlock unlimited hiring tools, AI-powered shortlisting, and campus-wide campaigns."
        >
          <EmployerPremiumClient isPremium={premiumStatus.isPremium} />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
