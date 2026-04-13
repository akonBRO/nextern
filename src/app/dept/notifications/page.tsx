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
        description: 'Publish a webinar or workshop for students.',
        icon: 'calendar' as const,
      },
      {
        label: 'My Events',
        href: '/dept/events',
        description: 'View and manage all your posted events.',
        icon: 'file' as const,
      },
    ],
  },
  {
    label: 'Cohort',
    icon: 'users' as const,
    items: [
      {
        label: 'Top students',
        href: '/dept/dashboard#students',
        description: 'Track the strongest students by opportunity score and profile readiness.',
        icon: 'users' as const,
      },
      {
        label: 'Pipeline',
        href: '/dept/dashboard#pipeline',
        description: 'See the aggregate hiring journey for your department cohort.',
        icon: 'insights' as const,
      },
    ],
  },
  {
    label: 'Analytics',
    icon: 'insights' as const,
    items: [
      {
        label: 'Skill heatmap',
        href: '/dept/dashboard#heatmap',
        description: 'Most common skills across the department cohort.',
        icon: 'sparkles' as const,
      },
      {
        label: 'Industry alignment',
        href: '/dept/dashboard#alignment',
        description: 'Student skills vs employer demand.',
        icon: 'insights' as const,
      },
      {
        label: 'Semester trend',
        href: '/dept/dashboard#trend',
        description: 'Semester-over-semester readiness trajectory.',
        icon: 'target' as const,
      },
    ],
  },
  {
    label: 'Opportunities',
    icon: 'briefcase' as const,
    items: [
      {
        label: 'Openings',
        href: '/dept/dashboard#openings',
        description: 'Active roles relevant to your university and department.',
        icon: 'briefcase' as const,
      },
      {
        label: 'Benchmarks',
        href: '/dept/dashboard#benchmarks',
        description: 'Department-level thresholds and readiness guardrails.',
        icon: 'target' as const,
      },
    ],
  },
  { label: 'Badges', href: '/dept/badges', icon: 'shield' as const },
];

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
