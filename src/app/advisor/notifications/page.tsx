import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { Bell, CalendarDays, Users } from 'lucide-react';
import DashboardShell from '@/components/dashboard/DashboardShell';
import NotificationsPageClient from '@/components/notifications/NotificationsPageClient';
import { getAdvisorDashboardData } from '@/lib/role-dashboard';

const navItems = [
  { label: 'Overview', href: '/advisor/dashboard', icon: 'dashboard' as const },
  {
    label: 'My Students',
    icon: 'users' as const,
    items: [
      {
        label: 'Attention queue',
        href: '/advisor/dashboard#students',
        description: 'Students that need immediate coaching or intervention.',
        icon: 'users' as const,
      },
      {
        label: 'Upcoming interviews',
        href: '/advisor/dashboard#interviews',
        description: 'Students with approaching interviews that may need support.',
        icon: 'calendar' as const,
      },
      {
        label: 'Skill gaps',
        href: '/advisor/dashboard#skills',
        description: 'Repeated hard-skill gaps across your advisee cohort.',
        icon: 'target' as const,
      },
    ],
  },
  {
    label: 'Events',
    icon: 'calendar' as const,
    items: [
      {
        label: 'Post Event',
        href: '/advisor/events/new',
        description: 'Publish a webinar or workshop for students.',
        icon: 'calendar' as const,
      },
      {
        label: 'My Events',
        href: '/advisor/events',
        description: 'View and manage all your posted events.',
        icon: 'file' as const,
      },
    ],
  },
  { label: 'Badges', href: '/advisor/badges', icon: 'shield' as const },
];

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
      user={{ ...data.chromeUser, userId: session.user.id }}
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
