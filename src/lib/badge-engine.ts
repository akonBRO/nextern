// src/lib/badge-engine.ts
// Core badge evaluation and awarding logic.
// Called by event hooks in lib/events.ts — never called directly by API routes.

import { connectDB } from '@/lib/db';
import mongoose from 'mongoose';
import { BadgeDefinition, type IBadgeDefinition } from '@/models/BadgeDefinition';
import { BadgeAward } from '@/models/BadgeAward';
import { onBadgeEarned } from '@/lib/events';
import { createNotification } from '@/lib/notify';
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
export async function getEventCount(
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
      const user = await User.findById(userId).select('cgpa').lean();
      if ((user?.cgpa ?? 0) >= 3.5) return 1;
      return 0;
    }

    case 'onReviewSubmitted': {
      // For students (community-leader): count reviews they wrote
      return Review.countDocuments({ reviewerId: userId });
    }

    case 'onReviewReceived': {
      if (badge.badgeSlug === 'verified-work-record' && badge.category === 'student') {
        // Must have at least the threshold number of recommendations (isRecommended)
        // and an average overall/work quality rating >= 4.0
        const reviews = (await Review.find({
          revieweeId: userId,
          reviewType: 'employer_to_student',
        })
          .select('workQualityRating isRecommended')
          .lean()) as { workQualityRating?: number; isRecommended?: boolean }[];

        const recommendedCount = reviews.filter((r) => r.isRecommended).length;
        if (recommendedCount < badge.thresholdValue) return 0;

        const avg =
          reviews.reduce((s, r) => s + (r.workQualityRating ?? 0), 0) / (reviews.length || 1);

        return avg >= 4.0 ? badge.thresholdValue : 0;
      }

      // For employers: count reviews received about them
      if (badge.badgeSlug === 'campus-favorite') {
        // Check average rating ≥ 4.5 AND at least threshold reviews
        const reviews = (await Review.find({ revieweeId: userId })
          .select('overallRating')
          .lean()) as { overallRating?: number }[];
        if (reviews.length < badge.thresholdValue) return 0;
        const avg =
          reviews.reduce(
            (s: number, r: { overallRating?: number }) => s + (r.overallRating ?? 0),
            0
          ) / reviews.length;
        return avg >= 4.5 ? badge.thresholdValue : 0;
      }
      // trusted-recruiter: count positive reviews (rating ≥ 4)
      return Review.countDocuments({ revieweeId: userId, overallRating: { $gte: 4 } });
    }

    case 'onMentorSessionComplete': {
      if (badge.category === 'advisor') {
        const mentor = await mongoose.models.Mentor?.findOne({ userId }).select('_id').lean();
        if (!mentor) return 0;
        return MentorSession.countDocuments({ mentorId: mentor._id, status: 'completed' });
      }
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

    case 'onDepartmentScoreUpdate': {
      // Visionary Leader: Just check if the trigger value (which we can fake or we query users)
      // Actually, we need the average score. Since we don't have a direct "Department Score" collection here,
      // we can do an aggregate, but for now we could just check the user's personal opp score if they represent the dept,
      // or we can just expect the triggerEvent to provide the new average score as threshold check if possible?
      // Wait, getEventCount doesn't receive the event data. Let's do an aggregate check over students in their dept.
      const head = await User.findById(userId).select('advisoryDepartment').lean();
      if (!head || !head.advisoryDepartment) return 0;
      const deptStudents = await User.find({ department: head.advisoryDepartment, role: 'student' })
        .select('opportunityScore')
        .lean();
      if (deptStudents.length === 0) return 0;
      const avg =
        deptStudents.reduce(
          (sum: number, s: { opportunityScore?: number }) => sum + (s.opportunityScore || 0),
          0
        ) / deptStudents.length;
      return avg;
    }

    case 'onEventCreated': {
      // For Engagement Pro: we assume a generic Event/Workshop model exists, but if not we can query notifications or just return 0 for now.
      // Wait, AdvisorAction model exists? Yes, the analysis mentioned AdvisorAction. Let's check AdvisorAction.
      // If we don't have it imported, we'll try catching exceptions.
      try {
        const EventModel = mongoose.models.Event || mongoose.models.AdvisorAction;
        if (EventModel) {
          // AdvisorAction uses advisorId, a hypothetical Event model might use createdBy
          const query =
            EventModel.modelName === 'AdvisorAction'
              ? { advisorId: userId }
              : { createdBy: userId };
          return await EventModel.countDocuments(query);
        }
      } catch {
        // ignore
      }
      return 0; // fallback
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
  category?: 'student' | 'employer' | 'advisor' | 'dept_head'
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
    // Skip if category doesn't match (safety check)
    if (category && badge.category !== category) continue;

    const hasBadge = existingSlugs.has(badge.badgeSlug);

    try {
      const count = await getEventCount(userId, triggerEvent, badge);

      if (count >= badge.thresholdValue) {
        if (!hasBadge) {
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

          await onBadgeEarned(userId, badge.name, badge.icon, badge.badgeSlug);

          console.log(`[BADGE] Awarded "${badge.name}" to user ${userId}`);
        }
      } else {
        if (hasBadge) {
          // Revoke the badge
          await BadgeAward.deleteOne({ userId, badgeSlug: badge.badgeSlug });

          await createNotification({
            userId,
            type: 'score_update',
            title: `Badge lost: ${badge.name}`,
            body: `You no longer meet the criteria for the "${badge.name}" badge.`,
            meta: { badgeSlug: badge.badgeSlug, badgeIcon: badge.icon },
          });

          console.log(`[BADGE] Revoked "${badge.name}" from user ${userId}`);
        }
      }
    } catch (err) {
      // Duplicate key error means badge was already awarded (race condition) — safe to skip
      if ((err as { code?: number }).code === 11000) continue;
      console.error(`[BADGE ERROR] Failed to evaluate "${badge.badgeSlug}" for ${userId}:`, err);
    }
  }
}
