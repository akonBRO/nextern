// src/lib/subscription-plans.ts
// Single source of truth for all subscription plan data.
// Imported by: pricing pages, API routes, premium guards.

export type PlanId = 'student_premium' | 'employer_premium';

export interface SubscriptionPlan {
  id: PlanId;
  name: string;
  price: number; // BDT/month
  durationDays: number; // 30 for monthly
  tagline: string;
  features: string[];
  highlighted: boolean;
  badge?: string;
}

export const PLANS: Record<PlanId, SubscriptionPlan> = {
  student_premium: {
    id: 'student_premium',
    name: 'Student Premium',
    price: 299, // BDT 299/month ≈ $2.70
    durationDays: 30,
    tagline: 'Unlock the full power of AI for your internship hunt',
    badge: 'Most Popular',
    highlighted: true,
    features: [
      'Unlimited AI Skill Gap Analysis (vs 5/month free)',
      'Full Internship Fit Score for all jobs',
      'AI-generated personalized training paths',
      'Unlimited Mock Interview sessions with Nextern AI',
      'Unlimited smart job recommendations',
      'AI-powered resume review & suggestions',
      'Unlimited mentorship requests (vs 2/month free)',
      'Advanced analytics on application performance',
      'Export Graduation Evaluation Report (GER) as PDF',
      'No ads',
    ],
  },
  employer_premium: {
    id: 'employer_premium',
    name: 'Employer Premium',
    price: 1499, // BDT 1499/month
    durationDays: 30,
    tagline: 'Hire smarter, faster across Bangladesh universities',
    highlighted: false,
    features: [
      'Unlimited job postings (vs 3/month free)',
      'Batch hiring across all 14+ universities',
      'Full applicant fit score breakdown',
      'AI-powered applicant shortlisting',
      'Priority listing — appear at top of student feeds',
      'Advanced pipeline analytics & reporting',
      'Unlimited assessment creation',
      'Edit and manage your reusable assessment library before dispatch',
      'AI-assisted grading for short answers and case studies',
      'Video interview recording with Agora',
      'Direct messaging with all applicants',
      'Employer analytics dashboard',
    ],
  },
};

export function getPlanByRole(role: string): SubscriptionPlan | null {
  if (role === 'student') return PLANS.student_premium;
  if (role === 'employer') return PLANS.employer_premium;
  return null;
}

// Premium feature gates — checked by API routes before running AI operations
export const PREMIUM_LIMITS = {
  free: {
    skillGapAnalysisPerMonth: 5,
    smartJobRecommendationsPerMonth: 10,
    mockInterviewsPerMonth: 2,
    mentorshipRequestsPerMonth: 20,
    jobPostingsPerMonth: 3, // employers
    aiApplicantShortlistsPerMonth: 5, // employers
  },
  premium: {
    skillGapAnalysisPerMonth: Infinity,
    smartJobRecommendationsPerMonth: Infinity,
    mockInterviewsPerMonth: Infinity,
    mentorshipRequestsPerMonth: Infinity,
    jobPostingsPerMonth: Infinity,
    aiApplicantShortlistsPerMonth: Infinity,
  },
};
