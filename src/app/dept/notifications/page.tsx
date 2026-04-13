import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bell, CalendarDays, Users } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';
import { getDeptDashboardData } from '@/lib/role-dashboard';

const navItems = [
  { label: 'Overview', href: '/dept/dashboard', icon: 'dashboard' as const },
  {
    label: 'Events',
    icon: 'calendar' as const,
    items: [
      {
        label: 'Post Event',
        href: '/dept/events/new',
        description: 'Publish a webinar or workshop for your department.',
        icon: 'calendar' as const,
      },
      {
        label: 'My Events',
        href: '/dept/events',
        description: 'View and manage all posted events.',
        icon: 'file' as const,
      },
    ],
  },
  {
    label: 'Report',
    href: '/dept/report',
    icon: 'insights' as const,
  },
  { label: 'Badges', href: '/dept/badges', icon: 'shield' as const },
];

export default async function DepartmentNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getDeptDashboardData({ userId: session.user.id });

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={navItems}
      user={data.chromeUser}
    >
      <NotificationsPageClient
        dashboardHref="/dept/dashboard"
        title="Department notifications"
        subtitle="Track important updates and event activity for your department."
        filterTabs={[
          { value: 'all', label: 'All', icon: <Bell size={13} /> },
          { value: 'application_received', label: 'Registrations', icon: <Users size={13} /> },
          { value: 'deadline_reminder', label: 'Deadlines', icon: <CalendarDays size={13} /> },
        ]}
      />
    </DashboardShell>
  );
}
