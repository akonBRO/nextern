// src/scripts/seedBadges.ts
// Usage: npm run seed:badges
// Upserts all badge definitions into MongoDB.

import mongoose from 'mongoose';
import { BadgeDefinition } from '../models/BadgeDefinition';

const MONGODB_URI = process.env.MONGODB_URI ?? process.env.DATABASE_URL ?? '';

const BADGE_DEFINITIONS = [
  // ── Student badges ────────────────────────────────────────────────
  {
    badgeSlug: 'top-applicant',
    name: 'Top Applicant',
    description: 'Consistently applies to relevant opportunities — showing initiative and career focus.',
    icon: '🎯',
    category: 'student' as const,
    criteria: 'Apply to at least 10 jobs or internships',
    triggerEvent: 'onJobApplied',
    thresholdValue: 10,
    aiWeightBoost: 5,
    opportunityScorePoints: 10,
    marksReward: 50,
  },
  {
    badgeSlug: 'skill-champion',
    name: 'Skill Champion',
    description: 'Closed multiple skill gaps identified by the AI engine — proving adaptability.',
    icon: '🏅',
    category: 'student' as const,
    criteria: 'Close at least 5 skill gaps',
    triggerEvent: 'onSkillGapClosed',
    thresholdValue: 5,
    aiWeightBoost: 8,
    opportunityScorePoints: 15,
    marksReward: 75,
  },
  {
    badgeSlug: 'verified-scholar',
    name: 'Verified Scholar',
    description: 'Strong academic standing with a verified profile — a mark of academic excellence.',
    icon: '🎓',
    category: 'student' as const,
    criteria: 'Maintain CGPA ≥ 3.5 and have a verified account',
    triggerEvent: 'onProfileVerified',
    thresholdValue: 1,
    aiWeightBoost: 6,
    opportunityScorePoints: 10,
    marksReward: 60,
  },
  {
    badgeSlug: 'community-leader',
    name: 'Community Leader',
    description: 'Actively writes reviews and helps peers — contributing to a better community.',
    icon: '🌟',
    category: 'student' as const,
    criteria: 'Submit at least 3 reviews',
    triggerEvent: 'onReviewSubmitted',
    thresholdValue: 3,
    aiWeightBoost: 4,
    opportunityScorePoints: 8,
    marksReward: 40,
  },
  {
    badgeSlug: 'mentors-pick',
    name: "Mentor's Pick",
    description: 'Received positive endorsements from mentors — recognized for dedication.',
    icon: '⭐',
    category: 'student' as const,
    criteria: 'Complete at least 3 mentorship sessions',
    triggerEvent: 'onMentorSessionComplete',
    thresholdValue: 3,
    aiWeightBoost: 7,
    opportunityScorePoints: 12,
    marksReward: 80,
  },
  {
    badgeSlug: 'rising-star',
    name: 'Rising Star',
    description: 'Rapid growth in Opportunity Score — showing consistent platform engagement.',
    icon: '🚀',
    category: 'student' as const,
    criteria: 'Reach an Opportunity Score of 50 or higher',
    triggerEvent: 'onOpportunityScoreGain',
    thresholdValue: 50,
    aiWeightBoost: 5,
    opportunityScorePoints: 10,
    marksReward: 100,
  },

  // ── Employer badges ───────────────────────────────────────────────
  {
    badgeSlug: 'trusted-recruiter',
    name: 'Trusted Recruiter',
    description: 'Consistently receives positive reviews from hired students.',
    icon: '🤝',
    category: 'employer' as const,
    criteria: 'Receive at least 5 positive student reviews',
    triggerEvent: 'onReviewReceived',
    thresholdValue: 5,
    aiWeightBoost: 6,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
  {
    badgeSlug: 'campus-favorite',
    name: 'Campus Favorite',
    description: 'Top-rated employer with outstanding internship reviews.',
    icon: '🏆',
    category: 'employer' as const,
    criteria: 'Maintain an average review rating of 4.5 or higher',
    triggerEvent: 'onReviewReceived',
    thresholdValue: 3,
    aiWeightBoost: 8,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
  {
    badgeSlug: 'fast-responder',
    name: 'Fast Responder',
    description: 'Responds to applications promptly — valued by students.',
    icon: '⚡',
    category: 'employer' as const,
    criteria: 'Update application status for at least 10 candidates',
    triggerEvent: 'onApplicationStatusChanged',
    thresholdValue: 10,
    aiWeightBoost: 4,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
  {
    badgeSlug: 'active-hirer',
    name: 'Active Hirer',
    description: 'Consistently posts quality job listings on the platform.',
    icon: '📋',
    category: 'employer' as const,
    criteria: 'Post at least 5 active job listings',
    triggerEvent: 'onJobPosted',
    thresholdValue: 5,
    aiWeightBoost: 5,
    opportunityScorePoints: 0,
    marksReward: 0,
  },

  // ── Advisor Badges ───────────────────────────────────────────────
  {
    badgeSlug: 'guiding-light',
    name: 'Guiding Light',
    description: 'Actively mentors students, shaping their career trajectories.',
    icon: '💡',
    category: 'advisor' as const,
    criteria: 'Complete at least 10 mentorship sessions',
    triggerEvent: 'onMentorSessionComplete',
    thresholdValue: 10,
    aiWeightBoost: 10,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
  {
    badgeSlug: 'top-mentor',
    name: 'Top Mentor',
    description: 'Highly rated by students for insightful and helpful advice.',
    icon: '🏅',
    category: 'advisor' as const,
    criteria: 'Maintain a 4.5+ average rating on mentorship reviews',
    triggerEvent: 'onReviewReceived',
    thresholdValue: 3,
    aiWeightBoost: 15,
    opportunityScorePoints: 0,
    marksReward: 0,
  },

  // ── Dept Head Badges ──────────────────────────────────────────────
  {
    badgeSlug: 'visionary-leader',
    name: 'Visionary Leader',
    description: 'Fosters high student engagement, leading the department to excellence.',
    icon: '🔭',
    category: 'dept_head' as const,
    criteria: 'Department average Opportunity Score reaches 70+',
    triggerEvent: 'onDepartmentScoreUpdate',
    thresholdValue: 70,
    aiWeightBoost: 20,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
  {
    badgeSlug: 'engagement-pro',
    name: 'Engagement Pro',
    description: 'Consistently organizes and promotes department-wide career events.',
    icon: '📢',
    category: 'dept_head' as const,
    criteria: 'Create and lead 5 department events',
    triggerEvent: 'onEventCreated',
    thresholdValue: 5,
    aiWeightBoost: 10,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
];

async function seed() {
  if (!MONGODB_URI) {
    console.error('❌ MONGODB_URI is not set. Add it to your .env file.');
    process.exit(1);
  }

  console.log('🔌 Connecting to MongoDB…');
  await mongoose.connect(MONGODB_URI);
  console.log('✅ Connected.');

  console.log(`📦 Upserting ${BADGE_DEFINITIONS.length} badge definitions…`);

  for (const badge of BADGE_DEFINITIONS) {
    await BadgeDefinition.findOneAndUpdate({ badgeSlug: badge.badgeSlug }, badge, {
      upsert: true,
      new: true,
    });
    console.log(`   ✓ ${badge.name} (${badge.badgeSlug})`);
  }

  console.log('\n🎉 All badge definitions seeded successfully.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
