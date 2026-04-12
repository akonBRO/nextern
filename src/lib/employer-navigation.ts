// src/lib/employer-navigation.ts
import type { DashboardNavItem } from '@/components/dashboard/DashboardShell';

export const EMPLOYER_NAV_ITEMS: DashboardNavItem[] = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' },
  {
    label: 'Jobs',
    icon: 'briefcase',
    items: [
      {
        label: 'All Listings',
        href: '/employer/jobs',
        description: 'Manage active, draft, and closed job listings.',
        icon: 'briefcase',
      },
      {
        label: 'Post New Job',
        href: '/employer/jobs/new',
        description: 'Create a listing that feeds the AI fit scoring engine.',
        icon: 'file',
      },
      {
        label: 'Pipeline',
        href: '/employer/dashboard#pipeline',
        description: 'Track candidates across review, shortlist, interview, and hire stages.',
        icon: 'insights',
      },
    ],
  },
  {
    label: 'AI Hiring',
    icon: 'sparkles',
    items: [
      {
        label: 'AI Hiring Center',
        href: '/employer/ai',
        description: 'Use employer AI tools and monitor monthly usage limits.',
        icon: 'sparkles',
      },
      {
        label: 'Applicant Shortlist',
        href: '/employer/ai#shortlist',
        description: 'Generate AI-ranked candidate shortlists from applicant fit signals.',
        icon: 'target',
      },
      {
        label: 'Top Candidates',
        href: '/employer/dashboard#candidates',
        description: 'Review the strongest fit scores already in your pipeline.',
        icon: 'users',
      },
    ],
  },
  {
    label: 'Company',
    icon: 'building',
    items: [
      {
        label: 'Company Profile',
        href: '/employer/profile',
        description: 'Update employer identity, logo, contact, and verification details.',
        icon: 'building',
      },
    ],
  },
  { label: 'Badges', href: '/employer/badges', icon: 'shield' },
  {
    label: 'Premium',
    icon: 'shield',
    items: [
      {
        label: 'Upgrade',
        href: '/employer/premium',
        description: 'Unlock unlimited employer AI, postings, and premium listing visibility.',
        icon: 'shield',
      },
      {
        label: 'Billing',
        href: '/employer/subscription',
        description: 'Manage subscription status, payment method, and payment history.',
        icon: 'file',
      },
    ],
  },
];
