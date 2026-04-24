import type { DashboardNavItem } from '@/components/dashboard/DashboardShell';

export const ADVISOR_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Overview', href: '/advisor/dashboard', icon: 'dashboard' },
  { label: 'Recommendations', href: '/advisor/recommendations', icon: 'target' },
  { label: 'Calendar', href: '/advisor/calendar', icon: 'calendar' },
  {
    label: 'My Students',
    icon: 'users',
    items: [
      {
        label: 'Attention queue',
        href: '/advisor/dashboard#students',
        description: 'Students that need immediate coaching or intervention.',
        icon: 'users',
      },
      {
        label: 'Upcoming interviews',
        href: '/advisor/dashboard#interviews',
        description: 'Students with approaching interviews that may need support.',
        icon: 'calendar',
      },
      {
        label: 'Skill gaps',
        href: '/advisor/dashboard#skills',
        description: 'Repeated hard-skill gaps across your advisee cohort.',
        icon: 'target',
      },
      {
        label: 'Cohort Reputation',
        href: '/advisor/dashboard#reputation',
        description: 'Aggregated reviews and formal recommendations from employers.',
        icon: 'star',
      },
    ],
  },
  {
    label: 'Events',
    icon: 'calendar',
    items: [
      {
        label: 'Post Event',
        href: '/advisor/events/new',
        description: 'Publish a webinar or workshop for students.',
        icon: 'calendar',
      },
      {
        label: 'My Events',
        href: '/advisor/events',
        description: 'View and manage all your posted events.',
        icon: 'file',
      },
    ],
  },
  { label: 'Messages', href: '/advisor/messages', icon: 'messages' },
];
