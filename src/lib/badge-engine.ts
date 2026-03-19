// src/lib/badge-engine.ts
// Core badge evaluation and awarding logic.
// Called by event hooks in lib/events.ts — never called directly by API routes.

import { connectDB } from '@/lib/db';
import { BadgeDefinition, type IBadgeDefinition } from '@/models/BadgeDefinition';
import { BadgeAward } from '@/models/BadgeAward';
import { Notification } from '@/models/Notification';
import { Application } from '@/models/Application';
import { Review } from '@/models/Review';
import { MentorSession } from '@/models/MentorSession';
import { User } from '@/models/User';
import { Job } from '@/models/Job';

// ── Helpers ────────────────────────────────────────────────────────────

/**
 * Count how many times a user has triggered a particular event.
 * Each event has its own counting logic.
 */
async function getEventCount(
  userId: string,
  triggerEvent: string,
  badge: IBadgeDefinition
): Promise<number> {
  switch (triggerEvent) {
    case 'onJobApplied': {
      // For students: count their applications
      // For employers (active-hirer): count their active job listings
      if (badge.category === 'employer') {
        return Job.countDocuments({ employerId: userId, isActive: true });
      }
      return Application.countDocuments({ studentId: userId });
    }

    case 'onSkillGapClosed': {
      const user = await User.findById(userId).select('closedSkillGaps').lean();
      return (user?.closedSkillGaps ?? []).length;
    }

    case 'onProfileVerified': {
      const user = await User.findById(userId).select('isVerified cgpa').lean();
      if (user?.isVerified && (user?.cgpa ?? 0) >= 3.5) return 1;
      return 0;
    }

    case 'onReviewSubmitted': {
      // For students (community-leader): count reviews they wrote
      return Review.countDocuments({ reviewerId: userId });
    }

    case 'onReviewReceived': {
      // For employers: count reviews received about them
      if (badge.badgeSlug === 'campus-favorite') {
        // Check average rating ≥ 4.5 AND at least threshold reviews
        const reviews = await Review.find({ revieweeId: userId }).select('overallRating').lean() as { overallRating?: number }[];
        if (reviews.length < badge.thresholdValue) return 0;
        const avg = reviews.reduce((s: number, r: { overallRating?: number }) => s + (r.overallRating ?? 0), 0) / reviews.length;
        return avg >= 4.5 ? badge.thresholdValue : 0;
      }
      // trusted-recruiter: count positive reviews (rating ≥ 4)
      return Review.countDocuments({ revieweeId: userId, overallRating: { $gte: 4 } });
    }

    case 'onMentorSessionComplete': {
      return MentorSession.countDocuments({ studentId: userId, status: 'completed' });
    }

    case 'onOpportunityScoreGain': {
      const user = await User.findById(userId).select('opportunityScore').lean();
      return user?.opportunityScore ?? 0;
    }

    case 'onApplicationStatusChanged': {
      // For employers (fast-responder): count status updates they made
      if (badge.category === 'employer') {
        return Application.countDocuments({
          employerId: userId,
          status: { $ne: 'applied' },
        });
      }
      return 0;
    }

    case 'onJobPosted': {
      return Job.countDocuments({ employerId: userId, isActive: true });
    }

    default:
      return 0;
  }
}

// ── Main evaluator ────────────────────────────────────────────────────

/**
 * Evaluate and award badges for a user after a specific event fires.
 * Safe to call multiple times — already-awarded badges are skipped.
 *
 * @param userId   The user who triggered the event
 * @param triggerEvent  The event name (e.g. 'onJobApplied')
 * @param category  Optional — 'student' or 'employer' to filter definitions
 */
export async function evaluateBadges(
  userId: string,
  triggerEvent: string,
  category?: 'student' | 'employer'
): Promise<void> {
  await connectDB();

  // Find all badge definitions that fire on this event
  const query: Record<string, unknown> = { triggerEvent };
  if (category) query.category = category;

  const definitions = await BadgeDefinition.find(query).lean();
  if (definitions.length === 0) return;

  // Check which badges the user already has
  const existingSlugs = new Set(
    (
      await BadgeAward.find({
        userId,
        badgeSlug: { $in: definitions.map((d: { badgeSlug: string }) => d.badgeSlug) },
      })
        .select('badgeSlug')
        .lean()
    ).map((a: { badgeSlug: string }) => a.badgeSlug)
  );

  for (const badge of definitions) {
    // Skip if already awarded
    if (existingSlugs.has(badge.badgeSlug)) continue;

    // Skip if category doesn't match (safety check)
    if (category && badge.category !== category) continue;

    try {
      const count = await getEventCount(userId, triggerEvent, badge);

      if (count >= badge.thresholdValue) {
        // Award the badge
        await BadgeAward.create({
          userId,
          badgeSlug: badge.badgeSlug,
          badgeName: badge.name,
          badgeIcon: badge.icon,
          awardedAt: new Date(),
          evidenceData: { triggerEvent, countAtAward: count },
          isDisplayed: true,
        });

        // Send notification
        await Notification.create({
          userId,
          type: 'badge_earned',
          title: `Badge earned: ${badge.name}`,
          body: badge.description,
          isRead: false,
          meta: { badgeSlug: badge.badgeSlug, badgeIcon: badge.icon },
        });

        console.log(`[BADGE] Awarded "${badge.name}" to user ${userId}`);
      }
    } catch (err) {
      // Duplicate key error means badge was already awarded (race condition) — safe to skip
      if ((err as { code?: number }).code === 11000) continue;
      console.error(`[BADGE ERROR] Failed to evaluate "${badge.badgeSlug}" for ${userId}:`, err);
    }
  }
}
