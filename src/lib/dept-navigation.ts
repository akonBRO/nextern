import type { DashboardNavItem } from '@/components/dashboard/DashboardShell';

export const DEPT_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Overview', href: '/dept/dashboard', icon: 'dashboard' },
  { label: 'Calendar', href: '/dept/calendar', icon: 'calendar' },
  {
    label: 'Events',
    icon: 'calendar',
    items: [
      {
        label: 'Post Event',
        href: '/dept/events/new',
        description: 'Publish a webinar or workshop for students.',
        icon: 'calendar',
      },
      {
        label: 'My Events',
        href: '/dept/events',
        description: 'View and manage all your posted events.',
        icon: 'file',
      },
    ],
  },
  {
    label: 'Cohort',
    icon: 'users',
    items: [
      {
        label: 'Top students',
        href: '/dept/dashboard#students',
        description: 'Track the strongest students by opportunity score and profile readiness.',
        icon: 'users',
      },
      {
        label: 'Pipeline',
        href: '/dept/dashboard#pipeline',
        description: 'See the aggregate hiring journey for your department cohort.',
        icon: 'insights',
      },
    ],
  },
  {
    label: 'Analytics',
    icon: 'insights',
    items: [
      {
        label: 'Skill heatmap',
        href: '/dept/dashboard#heatmap',
        description: 'Most common skills across the department cohort.',
        icon: 'sparkles',
      },
      {
        label: 'Industry alignment',
        href: '/dept/dashboard#alignment',
        description: 'Student skills vs employer demand.',
        icon: 'insights',
      },
      {
        label: 'Semester trend',
        href: '/dept/dashboard#trend',
        description: 'Semester-over-semester readiness trajectory.',
        icon: 'target',
      },
      {
        label: 'Report',
        href: '/dept/report',
        description: 'Export strategic readiness and placement insights.',
        icon: 'file',
      },
    ],
  },
  {
    label: 'Opportunities',
    icon: 'briefcase',
    items: [
      {
        label: 'Openings',
        href: '/dept/dashboard#openings',
        description: 'Active roles relevant to your university and department.',
        icon: 'briefcase',
      },
      {
        label: 'Benchmarks',
        href: '/dept/dashboard#benchmarks',
        description: 'Department-level thresholds and readiness guardrails.',
        icon: 'target',
      },
    ],
  },
  { label: 'Badges', href: '/dept/badges', icon: 'shield' },
];
