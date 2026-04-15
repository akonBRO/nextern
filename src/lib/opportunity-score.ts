import { connectDB } from '@/lib/db';
import { onOpportunityScoreGain } from '@/lib/events';
import { OpportunityScoreHistory, type ScoreEventType } from '@/models/OpportunityScoreHistory';
import { User } from '@/models/User';

function clampScore(value: number) {
  return Math.max(0, Math.min(100, Math.round(value)));
}

export async function awardOpportunityScore(params: {
  userId: string;
  delta: number;
  eventType: ScoreEventType;
  reason: string;
  meta?: Record<string, unknown>;
}) {
  await connectDB();

  if (!params.delta) {
    return { scoreAfter: null, appliedDelta: 0 };
  }

  const user = await User.findById(params.userId).select('opportunityScore');
  if (!user) {
    throw new Error('User not found');
  }

  const previousScore = user.opportunityScore ?? 0;
  const nextScore = clampScore(previousScore + params.delta);
  const appliedDelta = nextScore - previousScore;

  if (appliedDelta === 0) {
    return { scoreAfter: nextScore, appliedDelta: 0 };
  }

  user.opportunityScore = nextScore;
  await user.save();

  await OpportunityScoreHistory.create({
    userId: user._id,
    scoreAfter: nextScore,
    delta: appliedDelta,
    eventType: params.eventType,
    reason: params.reason,
    meta: params.meta ?? {},
  });

  await onOpportunityScoreGain(params.userId, nextScore).catch(console.error);

  return { scoreAfter: nextScore, appliedDelta };
}
