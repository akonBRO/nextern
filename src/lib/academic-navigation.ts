import type { DashboardNavItem } from '@/components/dashboard/DashboardShell';

export type AcademicRole = 'advisor' | 'dept_head';

export function getDashboardShellRoleForAcademicRole(role: AcademicRole) {
  return role === 'dept_head' ? 'departmentHead' : 'advisor';
}

export function getDashboardHomeHrefForAcademicRole(role: AcademicRole) {
  return role === 'dept_head' ? '/dept/dashboard' : '/advisor/dashboard';
}

export function getAdvisorNavItems(): DashboardNavItem[] {
  return [
    { label: 'Overview', href: '/advisor/dashboard', icon: 'dashboard' },
    {
      label: 'Students',
      icon: 'users',
      items: [
        {
          label: 'Student Directory',
          href: '/advisor/students',
          description: 'Filter advisees by semester, ID, readiness, or profile completion.',
          icon: 'users',
        },
        {
          label: 'Attention Queue',
          href: '/advisor/dashboard#students',
          description: 'Review the highest-priority students who need immediate support.',
          icon: 'target',
        },
        {
          label: 'Interview Watchlist',
          href: '/advisor/dashboard#interviews',
          description: 'See which students have interviews coming up and may need coaching.',
          icon: 'calendar',
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
          description: 'Publish a webinar or workshop for your students.',
          icon: 'calendar',
        },
        {
          label: 'My Events',
          href: '/advisor/events',
          description: 'Manage all advisor events and student registrations.',
          icon: 'file',
        },
      ],
    },
  ];
}

export function getDepartmentNavItems(): DashboardNavItem[] {
  return [
    { label: 'Overview', href: '/dept/dashboard', icon: 'dashboard' },
    {
      label: 'Students',
      icon: 'users',
      items: [
        {
          label: 'Student Directory',
          href: '/dept/students',
          description: 'Search students across your university by semester, ID, and department.',
          icon: 'users',
        },
        {
          label: 'Readiness Report',
          href: '/dept/report',
          description: 'Open the strategic career-readiness report for your cohort.',
          icon: 'file',
        },
      ],
    },
    {
      label: 'Advisors',
      icon: 'users',
      items: [
        {
          label: 'Manage Advisors',
          href: '/dept/advisors',
          description: 'Create advisor accounts and review existing advisors in your university.',
          icon: 'users',
        },
        {
          label: 'Create Advisor',
          href: '/dept/advisors#new-advisor',
          description: 'Provision an advisor with a one-time password and email delivery.',
          icon: 'shield',
        },
      ],
    },
    {
      label: 'Events',
      icon: 'calendar',
      items: [
        {
          label: 'Post Event',
          href: '/dept/events/new',
          description: 'Publish a webinar or workshop for your university cohort.',
          icon: 'calendar',
        },
        {
          label: 'My Events',
          href: '/dept/events',
          description: 'Track registrations and manage department-led events.',
          icon: 'file',
        },
      ],
    },
    {
      label: 'Analytics',
      icon: 'insights',
      items: [
        {
          label: 'Dashboard',
          href: '/dept/dashboard',
          description: 'Monitor readiness, hiring movement, and benchmark posture.',
          icon: 'insights',
        },
        {
          label: 'Benchmarks',
          href: '/dept/dashboard#benchmarks',
          description: 'Review the current benchmark thresholds for your department.',
          icon: 'target',
        },
      ],
    },
  ];
}
