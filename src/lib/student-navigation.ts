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
    label: 'Resume & GER',
    icon: 'file',
    items: [
      {
        label: 'Resume Builder',
        href: '/student/resume',
        description: 'Generate and download your professional resume as a PDF.',
        icon: 'file',
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
    label: 'Growth',
    icon: 'insights',
    items: [
      {
        label: 'Score trend',
        href: '/student/dashboard#score',
        description: 'Track your opportunity score movement over time.',
        icon: 'insights',
      },
      {
        label: 'Skill dashboard',
        href: '/student/dashboard#skills',
        description: 'Review the gaps and strengths shaping your readiness.',
        icon: 'target',
      },
      {
        label: 'Badges',
        href: '/student/dashboard#badges',
        description: 'Check the milestones and achievements you have earned.',
        icon: 'shield',
      },
    ],
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
