import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bell, CalendarDays, Users } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';
import { getDepartmentNavItems } from '@/lib/academic-navigation';
import { getDeptDashboardData } from '@/lib/role-dashboard';
const navItems = getDepartmentNavItems();

const DEPT_FILTER_TABS = [
  { value: 'all', label: 'All', icon: <Bell size={13} /> },
  { value: 'application_received', label: 'Registrations', icon: <Users size={13} /> },
  { value: 'deadline_reminder', label: 'Deadlines', icon: <CalendarDays size={13} /> },
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
      navItems={navItems}
      user={data.chromeUser}
    >
      <NotificationsPageClient
        dashboardHref="/dept/dashboard"
        title="Notifications"
        subtitle="Track important updates for your department and student cohort."
        filterTabs={DEPT_FILTER_TABS}
      />
    </DashboardShell>
  );
}
