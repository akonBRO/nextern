import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bell, CalendarDays, SendToBack, Users } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';

import { getDeptDashboardData } from '@/lib/role-dashboard';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

const DEPT_FILTER_TABS = [
  { value: 'all', label: 'All', icon: <Bell size={13} /> },
  { value: 'recommendation_request', label: 'Requests', icon: <SendToBack size={13} /> },
  { value: 'application_received', label: 'Registrations', icon: <Users size={13} /> },
  { value: 'deadline_reminder', label: 'Calendar Alerts', icon: <CalendarDays size={13} /> },
];

export default async function DeptNotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const data = await getDeptDashboardData({
    userId: session.user.id,
    email: session.user.email ?? undefined,
  });

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <NotificationsPageClient
        dashboardHref="/dept/dashboard"
        title="Notifications"
        subtitle="Track student registrations and hosted-event calendar reminders."
        filterTabs={DEPT_FILTER_TABS}
      />
    </DashboardShell>
  );
}
