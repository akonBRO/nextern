// src/lib/ger-data.ts
// Shared data-fetching logic for both GER preview and generate routes

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { BadgeAward } from '@/models/BadgeAward';
import { BadgeDefinition } from '@/models/BadgeDefinition';
import { Review } from '@/models/Review';
import { computeGERScore, type RawGERInput, type GERData } from '@/lib/ger-pdf';
import mongoose from 'mongoose';

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
  const applications = await Application.find({ studentId: oid }).lean();
  const jobApps = applications.filter((a) => !a.isEventRegistration);
  const eventApps = applications.filter((a) => a.isEventRegistration);
  const hiredApps = jobApps.filter((a) => a.status === 'hired');

  // ── Badges — load earned badge definitions to preserve marksReward
  const badgeAwards = await BadgeAward.find({ userId: oid }).lean();
  const studentBadgeDefs = await BadgeDefinition.find({ category: 'student' }).lean();
  const studentBadgeMap = new Map(studentBadgeDefs.map((def) => [def.badgeSlug, def]));
  const badges = badgeAwards.map((a) => {
    const def = studentBadgeMap.get(a.badgeSlug);
    return {
      badgeName: a.badgeName ?? '',
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

  // ── Mentor sessions — graceful fallback ────────────────────────────
  let mentorSessionCount = 0;
  try {
    const MentorSession = mongoose.models.MentorSession;
    if (MentorSession) {
      mentorSessionCount = await MentorSession.countDocuments({
        studentId: oid,
        status: 'completed',
      });
    }
  } catch {
    /* model not yet built */
  }

  // ── Freelance orders — graceful fallback ───────────────────────────
  let freelanceOrderCount = 0;
  try {
    const FreelanceOrder = mongoose.models.FreelanceOrder;
    if (FreelanceOrder) {
      freelanceOrderCount = await FreelanceOrder.countDocuments({
        studentId: oid,
        status: 'completed',
      });
    }
  } catch {
    /* model not yet built */
  }

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
    opportunityScore: user.opportunityScore ?? 0,
    skills: user.skills ?? [],
    closedSkillGaps: user.closedSkillGaps ?? [],
    applicationCount: jobApps.length,
    eventCount: eventApps.length,
    hiredCount: hiredApps.length,
    mentorSessionCount,
    freelanceOrderCount,
    badges,
    // Real review data — not fitScore proxy
    employerEndorsementCount: employerReviews.length,
    avgEmployerRating: parseFloat(avgEmployerRating.toFixed(2)),
    completedCourses: user.completedCourses ?? [],
    certifications: (user.certifications ?? []).map((c: { name?: string }) => c.name ?? ''),
    projects: (user.projects ?? []).map((p: { title?: string }) => p.title ?? ''),
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
      freelanceOrders: freelanceOrderCount,
      badgeCount: badges.length,
      reviewCount: employerReviews.length,
    },
  };
}
