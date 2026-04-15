// src/app/api/badges/progress/route.ts
// GET /api/badges/progress — Calculates progress for all available badges for a user's role.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import {
  getBadgeDefinitions,
  type BadgeCategory,
  type BadgeCatalogDefinition,
} from '@/lib/badge-definitions';
import { BadgeAward } from '@/models/BadgeAward';
import { getEventCount } from '@/lib/badge-engine';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const userId = session.user.id;

    // Determine the user's role
    const userRole =
      session.user.role === 'student' ||
      session.user.role === 'employer' ||
      session.user.role === 'advisor' ||
      session.user.role === 'dept_head'
        ? (session.user.role as BadgeCategory)
        : 'student';

    // Find all badge definitions for the user's role
    const definitions = getBadgeDefinitions(userRole);

    // Get earned badges
    const earnedBadges = await BadgeAward.find({ userId }).select('badgeSlug awardedAt').lean();

    const earnedSlugs = new Set(
      earnedBadges.map((b: { badgeSlug: string; awardedAt?: Date }) => b.badgeSlug)
    );

    // Calculate progress for each badge
    const progressList = await Promise.all(
      definitions.map(async (def: BadgeCatalogDefinition) => {
        const isEarned = earnedSlugs.has(def.badgeSlug);
        let count = 0;

        if (isEarned) {
          count = def.thresholdValue; // Already earned, progress is complete
        } else {
          try {
            // Count current progress
            count = await getEventCount(userId, def.triggerEvent, def);
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

    // Badge points — all badge marksRewards sum to 100
    const totalPoints = definitions
      .filter((def) => earnedSlugs.has(def.badgeSlug))
      .reduce((sum: number, def) => sum + (def.marksReward || 0), 0);

    return NextResponse.json({
      progress: progressList,
      totalPoints,
    });
  } catch (error) {
    console.error('[GET BADGE PROGRESS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch badge progress' }, { status: 500 });
  }
}
