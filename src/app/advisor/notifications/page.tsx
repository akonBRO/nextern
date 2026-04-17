import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bell, CalendarDays, Users } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';
import { getAdvisorNavItems } from '@/lib/academic-navigation';
import { getAdvisorDashboardData } from '@/lib/role-dashboard';
const navItems = getAdvisorNavItems();

// Advisor-specific filter tabs — only what's relevant
const ADVISOR_FILTER_TABS = [
  { value: 'all', label: 'All', icon: <Bell size={13} /> },
  { value: 'application_received', label: 'Registrations', icon: <Users size={13} /> },
  { value: 'deadline_reminder', label: 'Deadlines', icon: <CalendarDays size={13} /> },
];

export default async function AdvisorNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getAdvisorDashboardData({ userId: session.user.id });

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={navItems}
      user={data.chromeUser}
    >
      <NotificationsPageClient
        dashboardHref="/advisor/dashboard"
        title="Notifications"
        subtitle="Track new event registrations and important advising updates."
        filterTabs={ADVISOR_FILTER_TABS}
      />
    </DashboardShell>
  );
}
