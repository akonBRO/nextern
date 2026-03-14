// src/lib/student-dashboard.ts
// All server-side data fetching functions for the student dashboard.
// Each function connects to MongoDB and returns typed, clean data.

import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';
import { BadgeAward } from '@/models/BadgeAward';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { OpportunityScoreHistory } from '@/models/OpportunityScoreHistory';
import mongoose from 'mongoose';

// ── Types ─────────────────────────────────────────────────────────────

export interface DashboardData {
  profile: ProfileData;
  stats: StatsData;
  recentApplications: ApplicationRow[];
  recommendedJobs: JobCard[];
  recentBadges: BadgeData[];
  scoreHistory: ScorePoint[];
  deadlines: DeadlineItem[];
  skillGapSummary: SkillGapSummary;
}

export interface ProfileData {
  name: string;
  email: string;
  image?: string;
  university?: string;
  department?: string;
  yearOfStudy?: number;
  cgpa?: number;
  opportunityScore: number;
  profileCompleteness: number;
  skills: string[];
  isGraduated: boolean;
  bio?: string;
  unreadNotifications: number;
  unreadMessages: number;
}

export interface StatsData {
  totalApplications: number;
  shortlisted: number;
  hired: number;
  avgFitScore: number;
  profileCompleteness: number;
  opportunityScore: number;
  leaderboardRank: number | null;
  totalBadges: number;
}

export interface ApplicationRow {
  _id: string;
  jobTitle: string;
  companyName: string;
  companyLogo?: string;
  status: string;
  appliedAt: string;
  fitScore?: number;
  industry?: string;
}

export interface JobCard {
  _id: string;
  title: string;
  companyName: string;
  companyLogo?: string;
  type: string;
  locationType: string;
  city?: string;
  stipendBDT?: number;
  requiredSkills: string[];
  applicationDeadline?: string;
  fitScore?: number;
  whyRecommended?: string;
  applicationCount: number;
}

export interface BadgeData {
  badgeSlug: string;
  badgeName: string;
  badgeIcon: string;
  awardedAt: string;
}

export interface ScorePoint {
  date: string;
  score: number;
  delta: number;
  reason: string;
}

export interface DeadlineItem {
  _id: string;
  jobTitle: string;
  companyName: string;
  deadline: string;
  daysLeft: number;
  applicationId?: string;
}

export interface SkillGapSummary {
  totalHardGaps: number;
  totalSoftGaps: number;
  topHardGaps: string[];
  topSoftGaps: string[];
  closedGapsCount: number;
}

// ── Main fetcher ───────────────────────────────────────────────────────

export async function getStudentDashboardData(userId: string): Promise<DashboardData> {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  // Run all queries in parallel
  const [user, applications, savedJobs, badges, unreadNotifs, unreadMsgs, scoreHistory] =
    await Promise.all([
      User.findById(oid).select('-password').lean(),
      Application.find({ studentId: oid, isEventRegistration: false })
        .sort({ createdAt: -1 })
        .limit(20)
        .lean(),
      // JobView with isSaved: true
      import('@/models/JobView').then((m) =>
        m.JobView.find({ studentId: oid, isSaved: true }).select('jobId').lean()
      ),
      BadgeAward.find({ userId: oid }).sort({ awardedAt: -1 }).limit(6).lean(),
      Notification.countDocuments({ userId: oid, isRead: false }),
      Message.countDocuments({ receiverId: oid, isRead: false }),
      OpportunityScoreHistory.find({ userId: oid }).sort({ createdAt: -1 }).limit(30).lean(),
    ]);

  if (!user) throw new Error('User not found');

  // ── Stats ─────────────────────────────────────────────────────────
  const totalApplications = applications.length;
  const shortlisted = applications.filter((a) =>
    ['shortlisted', 'under_review', 'assessment_sent', 'interview_scheduled'].includes(a.status)
  ).length;
  const hired = applications.filter((a) => a.status === 'hired').length;

  const appsWithFit = applications.filter((a) => typeof a.fitScore === 'number');
  const avgFitScore = appsWithFit.length
    ? Math.round(appsWithFit.reduce((s, a) => s + (a.fitScore ?? 0), 0) / appsWithFit.length)
    : 0;

  // Leaderboard rank (students in same university ranked by opportunityScore)
  let leaderboardRank: number | null = null;
  if (user.university && user.opportunityScore > 0) {
    const ahead = await User.countDocuments({
      role: 'student',
      university: user.university,
      opportunityScore: { $gt: user.opportunityScore },
    });
    leaderboardRank = ahead + 1;
  }

  const totalBadges = badges.length;

  // ── Recent applications ─────────────────────────────────────────────
  const jobIds = applications.map((a) => a.jobId);
  const jobsMap: Record<
    string,
    { title: string; companyName: string; companyLogo?: string; industry?: string }
  > = {};
  if (jobIds.length > 0) {
    const jobs = await Job.find({ _id: { $in: jobIds } })
      .select('title companyName companyLogo industry')
      .lean();
    jobs.forEach((j) => {
      jobsMap[j._id.toString()] = j;
    });
  }

  const recentApplications: ApplicationRow[] = applications.slice(0, 6).map((a) => ({
    _id: a._id.toString(),
    jobTitle: jobsMap[a.jobId.toString()]?.title ?? 'Unknown Role',
    companyName: jobsMap[a.jobId.toString()]?.companyName ?? 'Unknown Company',
    companyLogo: jobsMap[a.jobId.toString()]?.companyLogo,
    industry: jobsMap[a.jobId.toString()]?.industry,
    status: a.status,
    appliedAt: a.appliedAt?.toISOString() ?? new Date().toISOString(),
    fitScore: a.fitScore,
  }));

  // ── Recommended jobs ────────────────────────────────────────────────
  const savedJobIds = new Set(
    savedJobs.map((j: { jobId: mongoose.Types.ObjectId }) => j.jobId.toString())
  );
  const appliedJobIds = new Set(applications.map((a) => a.jobId.toString()));

  const matchQuery: Record<string, unknown> = {
    isActive: true,
    applicationDeadline: { $gte: new Date() },
    _id: { $nin: Array.from(appliedJobIds).map((id) => new mongoose.Types.ObjectId(id)) },
  };
  if (user.department) matchQuery.targetDepartments = { $in: [user.department, ''] };

  const rawJobs = await Job.find(matchQuery)
    .sort({ isPremiumListing: -1, applicationCount: -1, createdAt: -1 })
    .limit(6)
    .lean();

  const userSkillSet = new Set((user.skills ?? []).map((s: string) => s.toLowerCase()));

  const recommendedJobs: JobCard[] = rawJobs.map((j) => {
    const matched = (j.requiredSkills ?? []).filter((s: string) =>
      userSkillSet.has(s.toLowerCase())
    ).length;
    const total = (j.requiredSkills ?? []).length;
    const fitScore = total > 0 ? Math.round((matched / total) * 100) : 0;

    let whyRecommended = 'Matches your profile';
    if (fitScore >= 80) whyRecommended = `${matched} skills match`;
    else if (user.department && (j.targetDepartments ?? []).includes(user.department))
      whyRecommended = `Perfect for ${user.department}`;
    else if (j.type === 'internship') whyRecommended = 'Top internship match';

    return {
      _id: j._id.toString(),
      title: j.title,
      companyName: j.companyName,
      companyLogo: j.companyLogo,
      type: j.type,
      locationType: j.locationType,
      city: j.city,
      stipendBDT: j.stipendBDT,
      requiredSkills: (j.requiredSkills ?? []).slice(0, 4),
      applicationDeadline: j.applicationDeadline?.toISOString(),
      fitScore,
      whyRecommended,
      applicationCount: j.applicationCount ?? 0,
    };
  });

  // ── Badges ─────────────────────────────────────────────────────────
  const recentBadges: BadgeData[] = badges.slice(0, 4).map((b) => ({
    badgeSlug: b.badgeSlug,
    badgeName: b.badgeName,
    badgeIcon: b.badgeIcon,
    awardedAt: (b as { awardedAt?: Date }).awardedAt?.toISOString() ?? new Date().toISOString(),
  }));

  // ── Score history (last 10 for chart) ─────────────────────────────
  const scoreHistoryPoints: ScorePoint[] = scoreHistory
    .slice(0, 10)
    .reverse()
    .map((h) => ({
      date: (h as { createdAt?: Date }).createdAt?.toISOString() ?? new Date().toISOString(),
      score: h.scoreAfter,
      delta: h.delta,
      reason: h.reason,
    }));

  // ── Upcoming deadlines ────────────────────────────────────────────
  const now = new Date();
  const upcomingDeadlineApps = applications
    .filter((a) => a.status === 'applied' || a.status === 'shortlisted')
    .slice(0, 10);

  const deadlineJobIds = upcomingDeadlineApps.map((a) => a.jobId);
  const deadlineJobs = await Job.find({
    _id: { $in: deadlineJobIds },
    applicationDeadline: { $gte: now, $lte: new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000) },
  })
    .select('title companyName applicationDeadline')
    .lean();

  const deadlineJobsMap: Record<
    string,
    { title: string; companyName: string; applicationDeadline?: Date }
  > = {};
  deadlineJobs.forEach((j) => {
    deadlineJobsMap[j._id.toString()] = j;
  });

  const deadlines: DeadlineItem[] = upcomingDeadlineApps
    .filter((a) => deadlineJobsMap[a.jobId.toString()])
    .map((a) => {
      const j = deadlineJobsMap[a.jobId.toString()];
      const msLeft = (j.applicationDeadline?.getTime() ?? 0) - now.getTime();
      const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24));
      return {
        _id: a._id.toString(),
        jobTitle: j.title,
        companyName: j.companyName,
        deadline: j.applicationDeadline?.toISOString() ?? '',
        daysLeft,
        applicationId: a._id.toString(),
      };
    })
    .sort((a, b) => a.daysLeft - b.daysLeft)
    .slice(0, 5);

  // ── Skill gap summary ─────────────────────────────────────────────
  const allHardGaps: string[] = [];
  const allSoftGaps: string[] = [];
  applications.forEach((a) => {
    if (Array.isArray(a.hardGaps)) allHardGaps.push(...a.hardGaps);
    if (Array.isArray(a.softGaps)) allSoftGaps.push(...a.softGaps);
  });

  const hardGapFreq: Record<string, number> = {};
  allHardGaps.forEach((g) => {
    hardGapFreq[g] = (hardGapFreq[g] ?? 0) + 1;
  });
  const softGapFreq: Record<string, number> = {};
  allSoftGaps.forEach((g) => {
    softGapFreq[g] = (softGapFreq[g] ?? 0) + 1;
  });

  const topHardGaps = Object.entries(hardGapFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map((e) => e[0]);
  const topSoftGaps = Object.entries(softGapFreq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map((e) => e[0]);

  const skillGapSummary: SkillGapSummary = {
    totalHardGaps: Object.keys(hardGapFreq).length,
    totalSoftGaps: Object.keys(softGapFreq).length,
    topHardGaps,
    topSoftGaps,
    closedGapsCount: (user.closedSkillGaps ?? []).length,
  };

  return {
    profile: {
      name: user.name,
      email: user.email,
      image: user.image,
      university: user.university,
      department: user.department,
      yearOfStudy: user.yearOfStudy,
      cgpa: user.cgpa,
      opportunityScore: user.opportunityScore ?? 0,
      profileCompleteness: user.profileCompleteness ?? 0,
      skills: (user.skills ?? []).slice(0, 8),
      isGraduated: user.isGraduated ?? false,
      bio: user.bio,
      unreadNotifications: unreadNotifs,
      unreadMessages: unreadMsgs,
    },
    stats: {
      totalApplications,
      shortlisted,
      hired,
      avgFitScore,
      profileCompleteness: user.profileCompleteness ?? 0,
      opportunityScore: user.opportunityScore ?? 0,
      leaderboardRank,
      totalBadges,
    },
    recentApplications,
    recommendedJobs,
    recentBadges,
    scoreHistory: scoreHistoryPoints,
    deadlines,
    skillGapSummary,
  };
}
