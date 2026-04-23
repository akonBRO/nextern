// src/lib/ger-data.ts
// Shared data-fetching logic for both GER preview and generate routes

import { connectDB } from '@/lib/db';
import { getBadgeDefinitionMap } from '@/lib/badge-definitions';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { BadgeAward } from '@/models/BadgeAward';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { OpportunityScoreHistory } from '@/models/OpportunityScoreHistory';
import { Review } from '@/models/Review';
import { MentorSession } from '@/models/MentorSession';
import { computeGERScore, type RawGERInput, type GERData } from '@/lib/ger-pdf';
import mongoose from 'mongoose';

function normalizeStringList(values: Array<string | null | undefined> | undefined) {
  return [...new Set((values ?? []).map((value) => value?.trim()).filter(Boolean) as string[])];
}

export async function buildGERData(userId: string): Promise<{
  gerData: GERData;
  raw: RawGERInput;
  meta: {
    isGraduated: boolean;
    gerUrl: string | null;
    applicationCount: number;
    eventCount: number;
    hiredCount: number;
    mentorSessions: number;
    freelanceOrders: number;
    badgeCount: number;
    reviewCount: number;
  };
}> {
  await connectDB();

  const user = await User.findById(userId).select('-password').lean();
  if (!user) throw new Error('User not found');
  if (user.role !== 'student') throw new Error('Students only');

  const oid = new mongoose.Types.ObjectId(userId);

  // ── Applications ────────────────────────────────────────────────────
  const applications = await Application.find({
    studentId: oid,
    isWithdrawn: { $ne: true },
  }).lean();
  const jobApps = applications.filter((a) => !a.isEventRegistration);
  const eventApps = applications.filter((a) => a.isEventRegistration);
  const hiredApps = jobApps.filter((a) => a.status === 'hired');

  // ── Badges — load earned badge definitions to preserve marksReward
  const badgeAwards = await BadgeAward.find({ userId: oid }).lean();
  const studentBadgeMap = getBadgeDefinitionMap('student');
  const badges = badgeAwards.map((a) => {
    const def = studentBadgeMap.get(a.badgeSlug);
    return {
      badgeName: a.badgeName ?? def?.name ?? a.badgeSlug ?? '',
      badgeSlug: a.badgeSlug ?? '',
      marksReward: typeof def?.marksReward === 'number' ? def.marksReward : 0,
    };
  });

  // ── Employer reviews — from Review model, employer_to_student only ──
  // These are real reviews left by employers on hired students
  const employerReviews = await Review.find({
    revieweeId: oid,
    reviewType: 'employer_to_student',
    isVerified: true,
  }).lean();

  // Average the 4 employer rating fields per review
  const avgEmployerRating =
    employerReviews.length > 0
      ? employerReviews.reduce((sum, r) => {
          const ratings = [
            r.professionalismRating,
            r.punctualityRating,
            r.skillPerformanceRating,
            r.workQualityRating,
          ].filter((v): v is number => typeof v === 'number');

          const reviewAvg =
            ratings.length > 0 ? ratings.reduce((s, v) => s + v, 0) / ratings.length : 0;

          return sum + reviewAvg;
        }, 0) / employerReviews.length
      : 0;

  // ── Mentor sessions ──────────────────────────────────────────────
  const mentorSessionCount = await MentorSession.countDocuments({
    studentId: oid,
    status: 'completed',
  });

  // ── Freelance orders — graceful fallback ───────────────────────────
  const freelanceOrderCount = await FreelanceOrder.countDocuments({
    freelancerId: oid,
    status: 'completed',
    escrowStatus: 'released',
  });

  const profileSkills = normalizeStringList(user.skills);
  const closedSkillGaps = normalizeStringList(user.closedSkillGaps);
  const completedCourses = normalizeStringList(user.completedCourses);
  const certifications = normalizeStringList(
    (user.certifications ?? []).map((cert: { name?: string | null }) => cert.name)
  );
  const projects = normalizeStringList(
    (user.projects ?? []).map((project: { title?: string | null }) => project.title)
  );
  const verifiedPortfolioCount = (user.verifiedPortfolioItems ?? []).filter(
    (item: { title?: string | null; freelanceOrderId?: mongoose.Types.ObjectId | null }) =>
      Boolean(item?.freelanceOrderId) || Boolean(item?.title?.trim())
  ).length;
  const effectiveFreelanceCount = Math.max(freelanceOrderCount, verifiedPortfolioCount);
  const latestOpportunitySnapshot = await OpportunityScoreHistory.findOne({ userId: oid })
    .sort({ createdAt: -1 })
    .select('scoreAfter')
    .lean();

  // ── Build RawGERInput ───────────────────────────────────────────────
  const raw: RawGERInput = {
    name: user.name ?? 'Student',
    email: user.email ?? '',
    studentId: user.studentId,
    university: user.university,
    department: user.department,
    cgpa: user.cgpa,
    cgpaScore: user.cgpa ?? 0,
    gender: user.gender as 'male' | 'female' | 'other' | undefined,
    graduatedAt: new Date().toISOString(),
    opportunityScore:
      latestOpportunitySnapshot?.scoreAfter ??
      (typeof user.opportunityScore === 'number' ? user.opportunityScore : 0),
    skills: profileSkills,
    closedSkillGaps,
    applicationCount: jobApps.length,
    eventCount: eventApps.length,
    hiredCount: hiredApps.length,
    mentorSessionCount,
    freelanceOrderCount: effectiveFreelanceCount,
    badges,
    // Real review data — not fitScore proxy
    employerEndorsementCount: employerReviews.length,
    avgEmployerRating: parseFloat(avgEmployerRating.toFixed(2)),
    completedCourses,
    certifications,
    projects,
  };

  const gerData = computeGERScore(raw);

  return {
    gerData,
    raw,
    meta: {
      isGraduated: user.isGraduated ?? false,
      gerUrl: user.gerUrl ?? null,
      applicationCount: jobApps.length,
      eventCount: eventApps.length,
      hiredCount: hiredApps.length,
      mentorSessions: mentorSessionCount,
      freelanceOrders: effectiveFreelanceCount,
      badgeCount: badges.length,
      reviewCount: employerReviews.length,
    },
  };
}
