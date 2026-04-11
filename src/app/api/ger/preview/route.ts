// src/app/api/ger/preview/route.ts
// GET /api/ger/preview
// Returns the computed GER score data as JSON (used by the GER page for live preview)

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { computeGERScore, type RawGERInput } from '@/lib/ger-pdf';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const user = await User.findById(session.user.id).select('-password').lean();
    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 });
    if (user.role !== 'student') {
      return NextResponse.json({ error: 'Students only' }, { status: 403 });
    }

    const oid = new mongoose.Types.ObjectId(session.user.id);

    const applications = await Application.find({ studentId: oid }).lean();
    const jobApps = applications.filter((a) => !a.isEventRegistration);
    const eventApps = applications.filter((a) => a.isEventRegistration);
    const hiredApps = jobApps.filter((a) => a.status === 'hired');
    const endorsed = jobApps.filter((a) => typeof a.fitScore === 'number');
    const avgRating =
      endorsed.length > 0
        ? endorsed.reduce((s, a) => s + (a.fitScore ?? 0), 0) / endorsed.length / 20
        : 0;

    let badges: { badgeName: string; badgeSlug: string }[] = [];
    try {
      const BadgeAward = mongoose.models.BadgeAward;
      if (BadgeAward) {
        const awards = (await BadgeAward.find({ userId: oid }).lean()) as Array<{
          badgeName?: string;
          badgeSlug?: string;
        }>;
        badges = awards.map((a) => ({
          badgeName: a.badgeName ?? '',
          badgeSlug: a.badgeSlug ?? '',
        }));
      }
    } catch {
      /* no-op */
    }

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
      /* no-op */
    }

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
      /* no-op */
    }

    const raw: RawGERInput = {
      name: user.name ?? 'Student',
      email: user.email ?? '',
      studentId: user.studentId,
      university: user.university,
      department: user.department,
      cgpa: user.cgpa,
      cgpaScore: user.cgpa ?? 0,
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
      employerEndorsementCount: endorsed.length,
      avgEmployerRating: parseFloat(avgRating.toFixed(2)),
      completedCourses: user.completedCourses ?? [],
      certifications: (user.certifications ?? []).map((c: { name?: string }) => c.name ?? ''),
      projects: (user.projects ?? []).map((p: { title?: string }) => p.title ?? ''),
    };

    const gerData = computeGERScore(raw);

    return NextResponse.json({
      gerData,
      isGraduated: user.isGraduated ?? false,
      gerUrl: user.gerUrl ?? null,
      applicationCount: jobApps.length,
      eventCount: eventApps.length,
      hiredCount: hiredApps.length,
      mentorSessions: mentorSessionCount,
      freelanceOrders: freelanceOrderCount,
      badgeCount: badges.length,
    });
  } catch (err) {
    console.error('[GER PREVIEW ERROR]', err);
    return NextResponse.json({ error: 'Failed to load GER data' }, { status: 500 });
  }
}
