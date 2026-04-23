// src/lib/student-navigation.ts
import type { DashboardNavItem } from '@/components/dashboard/DashboardShell';

export const STUDENT_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Overview', href: '/student/dashboard', icon: 'dashboard' },
  {
    label: 'Opportunities',
    icon: 'briefcase',
    items: [
      {
        label: 'Browse Jobs',
        href: '/student/jobs',
        description: 'Explore matched internships and entry-level opportunities.',
        icon: 'briefcase',
      },
      {
        label: 'Applications',
        href: '/student/applications',
        description: 'Track submitted applications and event registrations.',
        icon: 'file',
      },
      {
        label: 'Recommended roles',
        href: '/student/jobs',
        description: 'See the strongest live matches for your profile.',
        icon: 'sparkles',
      },
    ],
  },
  {
    label: 'Mentors',
    icon: 'users',
    items: [
      {
        label: 'Find a Mentor',
        href: '/student/mentorship',
        description: 'Browse the alumni directory to find professional guidance.',
        icon: 'users',
      },
      {
        label: 'My Sessions',
        href: '/student/mentorship/sessions',
        description: 'Track your upcoming and past mentorship sessions.',
        icon: 'calendar',
      },
    ],
  },
  {
    label: 'Hiring Suite',
    icon: 'target',
    items: [
      {
        label: 'Assessments',
        href: '/student/assessments',
        description: 'Open employer tests, timed assessments, and coding challenges in one place.',
        icon: 'file',
      },
      {
        label: 'Interviews',
        href: '/student/interviews',
        description:
          'Join scheduled interviews, manage recording consent, and track session status.',
        icon: 'messages',
      },
      {
        label: 'Application Tracker',
        href: '/student/applications',
        description:
          'Return to the job tracker with direct links to active assessments and interviews.',
        icon: 'briefcase',
      },
    ],
  },
  {
    label: 'Freelance',
    icon: 'briefcase',
    items: [
      {
        label: 'Marketplace',
        href: '/student/freelance?view=board',
        description:
          'Browse the board, request client work, and review the live service marketplace.',
        icon: 'briefcase',
      },
      {
        label: 'My Services',
        href: '/student/freelance?view=services',
        description: 'Publish, edit, pause, and manage your student freelance service packages.',
        icon: 'file',
      },
      {
        label: 'Client Orders',
        href: '/student/freelance?view=clientOrders',
        description:
          'Track freelance work you ordered from other users and approve escrow release.',
        icon: 'messages',
      },
      {
        label: 'Freelancer Orders',
        href: '/student/freelance?view=freelancerOrders',
        description: 'Manage the orders you are delivering and build verified work history.',
        icon: 'target',
      },
      {
        label: 'Earnings & Invoices',
        href: '/student/freelance?view=finance',
        description: 'View account balance, total earnings, invoices, and withdrawal requests.',
        icon: 'insights',
      },
    ],
  },
  {
    label: 'AI Tools',
    icon: 'sparkles',
    items: [
      {
        label: 'Skill Gap Analysis',
        href: '/student/skills',
        description: 'Review fit analyses, missing skills, and learning plans.',
        icon: 'sparkles',
      },
      {
        label: 'Mock Interview',
        href: '/student/mock-interview',
        description: 'Practice with AI and get instant interview feedback.',
        icon: 'messages',
      },
    ],
  },
  {
    label: 'Portfolio',
    icon: 'file',
    items: [
      {
        label: 'In-platform Resume',
        href: '/student/resume',
        description: 'Generate and download your professional resume as a PDF.',
        icon: 'file',
      },
      {
        label: 'Verified Work',
        href: '/student/freelance?view=freelancerOrders',
        description: 'Track verified freelance projects that strengthen your portfolio builder.',
        icon: 'briefcase',
      },
      {
        label: 'Graduation Report',
        href: '/student/ger',
        description: 'View and download your Graduation Evaluation Report.',
        icon: 'graduation',
      },
    ],
  },
  {
    label: 'Badges',
    icon: 'shield',
    href: '/student/badges',
  },
  {
    label: 'Calendar',
    icon: 'calendar',
    href: '/student/calendar',
  },

  {
    label: 'Premium',
    icon: 'shield',
    items: [
      {
        label: 'Upgrade',
        href: '/student/premium',
        description: 'Unlock unlimited AI tools and premium recommendations.',
        icon: 'shield',
      },
      {
        label: 'Billing',
        href: '/student/subscription',
        description: 'Manage your subscription and payment history.',
        icon: 'file',
      },
    ],
  },
];

export const ALUMNI_NAV_ITEMS: DashboardNavItem[] = [
  {
    label: 'Sessions',
    icon: 'calendar',
    href: '/student/mentorship/dashboard',
  },
  {
    label: 'Achievements',
    icon: 'shield',
    href: '/student/mentorship/dashboard?tab=achievements',
  },
  {
    label: 'Edit Profile',
    icon: 'file',
    href: '/student/mentorship/dashboard?tab=profile',
  },
];
