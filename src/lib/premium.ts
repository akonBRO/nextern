import { connectDB } from '@/lib/db';
import { PREMIUM_LIMITS, getPlanByRole, type PlanId } from '@/lib/subscription-plans';
import { Subscription } from '@/models/Subscription';
import { User } from '@/models/User';
import { MockInterviewSession } from '@/models/MockInterviewSession';
import { MentorSession } from '@/models/MentorSession';
import { Job } from '@/models/Job';
import { FeatureUsage } from '@/models/FeatureUsage';

type CountWindow = { start: Date; end: Date };

export type PremiumFeature =
  | 'skillGapAnalysis'
  | 'mockInterview'
  | 'mentorshipRequest'
  | 'jobPosting'
  | 'trainingPath'
  | 'advancedAnalytics'
  | 'priorityRecommendations';

export type PremiumStatus = {
  isPremium: boolean;
  planId: PlanId | null;
  premiumExpiresAt: string | null;
};

export type UsageSummary = {
  isPremium: boolean;
  planId: PlanId | null;
  premiumExpiresAt: string | null;
  counts: {
    skillGapAnalysis: number;
    mockInterview: number;
    mentorshipRequest: number;
    jobPosting: number;
  };
  limits: {
    skillGapAnalysis: number | null;
    mockInterview: number | null;
    mentorshipRequest: number | null;
    jobPosting: number | null;
  };
  remaining: {
    skillGapAnalysis: number | null;
    mockInterview: number | null;
    mentorshipRequest: number | null;
    jobPosting: number | null;
  };
};

export function getCurrentMonthWindow(now = new Date()): CountWindow {
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  return { start, end };
}

function normalizeLimit(limit: number): number | null {
  return Number.isFinite(limit) ? limit : null;
}

function normalizeRemaining(limit: number, used: number): number | null {
  return Number.isFinite(limit) ? Math.max(0, limit - used) : null;
}

function getFeatureLimit(isPremium: boolean) {
  return isPremium ? PREMIUM_LIMITS.premium : PREMIUM_LIMITS.free;
}

export async function syncPremiumStatus(userId: string): Promise<PremiumStatus> {
  await connectDB();

  const now = new Date();
  const user = await User.findById(userId).select('role isPremium premiumExpiresAt').lean();

  if (!user) {
    throw new Error('User not found');
  }

  const activeSubscription = await Subscription.findOne({
    userId,
    status: { $in: ['active', 'cancelled'] },
    endDate: { $gt: now },
  })
    .sort({ endDate: -1 })
    .select('plan endDate')
    .lean();

  const shouldBePremium = !!activeSubscription;
  const premiumExpiresAt = activeSubscription?.endDate ?? null;

  if (
    user.isPremium !== shouldBePremium ||
    `${user.premiumExpiresAt ?? ''}` !== `${premiumExpiresAt ?? ''}`
  ) {
    await User.findByIdAndUpdate(userId, {
      isPremium: shouldBePremium,
      premiumExpiresAt,
    });
  }

  const inferredPlan = activeSubscription?.plan ?? getPlanByRole(user.role)?.id ?? null;

  return {
    isPremium: shouldBePremium,
    planId: activeSubscription?.plan ?? (shouldBePremium ? inferredPlan : null),
    premiumExpiresAt: premiumExpiresAt ? premiumExpiresAt.toISOString() : null,
  };
}

export async function getUsageSummary(userId: string): Promise<UsageSummary> {
  await connectDB();

  const [premiumStatus, window] = await Promise.all([
    syncPremiumStatus(userId),
    Promise.resolve(getCurrentMonthWindow()),
  ]);

  const [skillGapAnalysis, mockInterview, mentorshipRequest, jobPosting] = await Promise.all([
    FeatureUsage.countDocuments({
      userId,
      feature: 'skill_gap_analysis',
      createdAt: { $gte: window.start, $lt: window.end },
    }),
    MockInterviewSession.countDocuments({
      studentId: userId,
      createdAt: { $gte: window.start, $lt: window.end },
    }),
    MentorSession.countDocuments({
      studentId: userId,
      createdAt: { $gte: window.start, $lt: window.end },
    }),
    Job.countDocuments({
      employerId: userId,
      createdAt: { $gte: window.start, $lt: window.end },
    }),
  ]);

  const limits = getFeatureLimit(premiumStatus.isPremium);

  return {
    ...premiumStatus,
    counts: {
      skillGapAnalysis,
      mockInterview,
      mentorshipRequest,
      jobPosting,
    },
    limits: {
      skillGapAnalysis: normalizeLimit(limits.skillGapAnalysisPerMonth),
      mockInterview: normalizeLimit(limits.mockInterviewsPerMonth),
      mentorshipRequest: normalizeLimit(limits.mentorshipRequestsPerMonth),
      jobPosting: normalizeLimit(limits.jobPostingsPerMonth),
    },
    remaining: {
      skillGapAnalysis: normalizeRemaining(limits.skillGapAnalysisPerMonth, skillGapAnalysis),
      mockInterview: normalizeRemaining(limits.mockInterviewsPerMonth, mockInterview),
      mentorshipRequest: normalizeRemaining(limits.mentorshipRequestsPerMonth, mentorshipRequest),
      jobPosting: normalizeRemaining(limits.jobPostingsPerMonth, jobPosting),
    },
  };
}

export async function checkFeatureAccess(userId: string, feature: PremiumFeature) {
  const usage = await getUsageSummary(userId);

  if (usage.isPremium) {
    return { allowed: true, usage, reason: null as string | null };
  }

  if (
    feature === 'trainingPath' ||
    feature === 'advancedAnalytics' ||
    feature === 'priorityRecommendations'
  ) {
    return {
      allowed: false,
      usage,
      reason: 'This feature is available on Premium.',
    };
  }

  const remainingMap = {
    skillGapAnalysis: usage.remaining.skillGapAnalysis,
    mockInterview: usage.remaining.mockInterview,
    mentorshipRequest: usage.remaining.mentorshipRequest,
    jobPosting: usage.remaining.jobPosting,
  } as const;

  const humanLabels: Record<
    Exclude<PremiumFeature, 'trainingPath' | 'advancedAnalytics' | 'priorityRecommendations'>,
    string
  > = {
    skillGapAnalysis: 'skill gap analyses',
    mockInterview: 'mock interviews',
    mentorshipRequest: 'mentorship requests',
    jobPosting: 'job postings',
  };

  if (feature in remainingMap) {
    const remaining = remainingMap[feature as keyof typeof remainingMap];
    if (remaining !== null && remaining <= 0) {
      return {
        allowed: false,
        usage,
        reason: `You have used all free ${humanLabels[feature as keyof typeof humanLabels]} for this month. Upgrade to Premium for unlimited access.`,
      };
    }
  }

  return { allowed: true, usage, reason: null as string | null };
}
