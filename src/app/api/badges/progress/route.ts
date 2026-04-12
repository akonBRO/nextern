// src/app/api/badges/progress/route.ts
// GET /api/badges/progress — Calculates progress for all available badges for a user's role.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { BadgeDefinition, type IBadgeDefinition } from '@/models/BadgeDefinition';
import { BadgeAward } from '@/models/BadgeAward';
import { getEventCount } from '@/lib/badge-engine';
import { User } from '@/models/User';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    // Determine the user's role
    const userRole = session.user.role || 'student';

    // Find all badge definitions for the user's role
    const definitions = await BadgeDefinition.find({ category: userRole })
      .sort({ opportunityScorePoints: -1 })
      .lean();

    // Get earned badges
    const earnedBadges = await BadgeAward.find({ userId }).select('badgeSlug awardedAt').lean();

    const earnedSlugs = new Set(
      earnedBadges.map((b: { badgeSlug: string; awardedAt?: Date }) => b.badgeSlug)
    );

    // Calculate progress for each badge
    const progressList = await Promise.all(
      definitions.map(async (def: IBadgeDefinition & Record<string, unknown>) => {
        const isEarned = earnedSlugs.has(def.badgeSlug);
        let count = 0;

        if (isEarned) {
          count = def.thresholdValue; // Already earned, progress is complete
        } else {
          try {
            // Count current progress
            count = await getEventCount(
              userId,
              def.triggerEvent,
              def as unknown as IBadgeDefinition
            );
            // Ensure count doesn't exceed threshold visually if it's not yet awarded (e.g. race condition)
            if (count > def.thresholdValue) count = def.thresholdValue;
          } catch (e) {
            console.error(`Error counting progress for ${def.badgeSlug}`, e);
          }
        }

        return {
          definition: def,
          currentCount: count,
          threshold: def.thresholdValue,
          isEarned,
          // Calculate percentage explicitly for the UI
          progressPercentage: Math.min(100, Math.round((count / def.thresholdValue) * 100)),
        };
      })
    );

    // Calculate badge GER contribution — badges contribute up to 13% of total GER
    // Each badge's share is proportional to its marksReward relative to total possible
    const totalPossibleMarks = definitions.reduce(
      (sum: number, def: IBadgeDefinition & Record<string, unknown>) =>
        sum + ((def.marksReward as number) || 0),
      0
    );
    const earnedMarks = definitions
      .filter((def: IBadgeDefinition & Record<string, unknown>) => earnedSlugs.has(def.badgeSlug))
      .reduce(
        (sum: number, def: IBadgeDefinition & Record<string, unknown>) =>
          sum + ((def.marksReward as number) || 0),
        0
      );
    const gerContribution =
      totalPossibleMarks > 0 ? parseFloat(((earnedMarks / totalPossibleMarks) * 13).toFixed(1)) : 0;

    return NextResponse.json({
      progress: progressList,
      totalMarks: earnedMarks,
      gerContribution,
    });
  } catch (error) {
    console.error('[GET BADGE PROGRESS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch badge progress' }, { status: 500 });
  }
}
