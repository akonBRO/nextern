export type BadgeCategory = 'student' | 'employer' | 'advisor' | 'dept_head';

export type BadgeCatalogDefinition = {
  badgeSlug: string;
  name: string;
  description: string;
  icon: string;
  category: BadgeCategory;
  criteria: string;
  triggerEvent: string;
  thresholdValue: number;
  aiWeightBoost: number;
  opportunityScorePoints: number;
  marksReward: number;
};

export const BADGE_DEFINITIONS: BadgeCatalogDefinition[] = [
  {
    badgeSlug: 'top-applicant',
    name: 'Top Applicant',
    description:
      'Consistently applies to relevant opportunities, showing initiative and career focus.',
    icon: '🎯',
    category: 'student',
    criteria: 'Apply to at least 10 jobs or internships',
    triggerEvent: 'onJobApplied',
    thresholdValue: 10,
    aiWeightBoost: 5,
    opportunityScorePoints: 10,
    marksReward: 10,
  },
  {
    badgeSlug: 'skill-champion',
    name: 'Skill Champion',
    description: 'Closed multiple skill gaps identified by the AI engine, proving adaptability.',
    icon: '🏅',
    category: 'student',
    criteria: 'Close at least 5 skill gaps',
    triggerEvent: 'onSkillGapClosed',
    thresholdValue: 5,
    aiWeightBoost: 8,
    opportunityScorePoints: 15,
    marksReward: 14,
  },
  {
    badgeSlug: 'verified-scholar',
    name: 'Verified Scholar',
    description: 'Strong academic standing, a mark of academic excellence.',
    icon: '🎓',
    category: 'student',
    criteria: 'Maintain CGPA >= 3.5',
    triggerEvent: 'onProfileVerified',
    thresholdValue: 1,
    aiWeightBoost: 6,
    opportunityScorePoints: 10,
    marksReward: 10,
  },
  {
    badgeSlug: 'community-leader',
    name: 'Community Leader',
    description: 'Actively writes reviews and helps peers, contributing to a better community.',
    icon: '🌟',
    category: 'student',
    criteria: 'Submit at least 3 reviews',
    triggerEvent: 'onReviewSubmitted',
    thresholdValue: 3,
    aiWeightBoost: 4,
    opportunityScorePoints: 8,
    marksReward: 8,
  },
  {
    badgeSlug: 'mentors-pick',
    name: "Mentor's Pick",
    description: 'Received positive endorsements from mentors, recognized for dedication.',
    icon: '⭐',
    category: 'student',
    criteria: 'Complete at least 3 mentorship sessions',
    triggerEvent: 'onMentorSessionComplete',
    thresholdValue: 3,
    aiWeightBoost: 7,
    opportunityScorePoints: 12,
    marksReward: 14,
  },
  {
    badgeSlug: 'rising-star',
    name: 'Rising Star',
    description: 'Rapid growth in Opportunity Score, showing consistent platform engagement.',
    icon: '🚀',
    category: 'student',
    criteria: 'Reach an Opportunity Score of 50 or higher',
    triggerEvent: 'onOpportunityScoreGain',
    thresholdValue: 50,
    aiWeightBoost: 5,
    opportunityScorePoints: 10,
    marksReward: 14,
  },
  {
    badgeSlug: 'verified-work-record',
    name: 'Verified Work Record',
    description:
      'Received at least one written recommendation and maintained an outstanding >4.0 average rating.',
    icon: '🏢',
    category: 'student',
    criteria: 'Written recommendation and >4.0 avg rating',
    triggerEvent: 'onReviewReceived',
    thresholdValue: 1,
    aiWeightBoost: 10,
    opportunityScorePoints: 15,
    marksReward: 14,
  },
  {
    badgeSlug: 'verified-freelancer',
    name: 'Verified Freelancer',
    description:
      'Consistently delivers high-quality freelance work with verified client reviews and released escrow outcomes.',
    icon: '💼',
    category: 'student',
    criteria: 'Complete at least 3 freelance projects with a 4.5+ verified average rating',
    triggerEvent: 'onFreelanceCompleted',
    thresholdValue: 3,
    aiWeightBoost: 10,
    opportunityScorePoints: 12,
    marksReward: 16,
  },
  {
    badgeSlug: 'trusted-recruiter',
    name: 'Trusted Recruiter',
    description: 'Consistently receives positive reviews from hired students.',
    icon: '🤝',
    category: 'employer',
    criteria: 'Receive at least 5 positive student reviews',
    triggerEvent: 'onReviewReceived',
    thresholdValue: 5,
    aiWeightBoost: 6,
    opportunityScorePoints: 0,
    marksReward: 30,
  },
  {
    badgeSlug: 'campus-favorite',
    name: 'Campus Favorite',
    description: 'Top-rated employer with outstanding internship reviews.',
    icon: '🏆',
    category: 'employer',
    criteria: 'Maintain an average review rating of 4.5 or higher',
    triggerEvent: 'onReviewReceived',
    thresholdValue: 3,
    aiWeightBoost: 8,
    opportunityScorePoints: 0,
    marksReward: 25,
  },
  {
    badgeSlug: 'fast-responder',
    name: 'Fast Responder',
    description: 'Responds to applications promptly, valued by students.',
    icon: '⚡',
    category: 'employer',
    criteria: 'Update application status for at least 10 candidates',
    triggerEvent: 'onApplicationStatusChanged',
    thresholdValue: 10,
    aiWeightBoost: 4,
    opportunityScorePoints: 0,
    marksReward: 20,
  },
  {
    badgeSlug: 'active-hirer',
    name: 'Active Hirer',
    description: 'Consistently posts quality job listings on the platform.',
    icon: '📋',
    category: 'employer',
    criteria: 'Post at least 5 active job listings',
    triggerEvent: 'onJobPosted',
    thresholdValue: 5,
    aiWeightBoost: 5,
    opportunityScorePoints: 0,
    marksReward: 25,
  },
  {
    badgeSlug: 'guiding-light',
    name: 'Guiding Light',
    description: 'Actively mentors students, shaping their career trajectories.',
    icon: '💡',
    category: 'advisor',
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
    category: 'advisor',
    criteria: 'Maintain a 4.5+ average rating on mentorship reviews',
    triggerEvent: 'onReviewReceived',
    thresholdValue: 3,
    aiWeightBoost: 15,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
  {
    badgeSlug: 'visionary-leader',
    name: 'Visionary Leader',
    description: 'Fosters high student engagement, leading the department to excellence.',
    icon: '🔭',
    category: 'dept_head',
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
    category: 'dept_head',
    criteria: 'Create and lead 5 department events',
    triggerEvent: 'onEventCreated',
    thresholdValue: 5,
    aiWeightBoost: 10,
    opportunityScorePoints: 0,
    marksReward: 0,
  },
];

export function getBadgeDefinitions(category?: BadgeCategory) {
  if (!category) return BADGE_DEFINITIONS;
  return BADGE_DEFINITIONS.filter((definition) => definition.category === category);
}

export function getBadgeDefinitionsForTrigger(triggerEvent: string, category?: BadgeCategory) {
  return getBadgeDefinitions(category).filter(
    (definition) => definition.triggerEvent === triggerEvent
  );
}

export function getBadgeDefinitionMap(category?: BadgeCategory) {
  return new Map(
    getBadgeDefinitions(category).map((definition) => [definition.badgeSlug, definition])
  );
}
