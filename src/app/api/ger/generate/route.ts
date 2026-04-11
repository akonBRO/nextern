// src/app/api/ger/generate/route.ts
// GET /api/ger/generate
// Generates the Graduation Evaluation Report PDF for a graduated student
// Only available when user.isGraduated === true

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { generateGERPDF, computeGERScore, type RawGERInput } from '@/lib/ger-pdf';
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
      return NextResponse.json({ error: 'GER is only available for students' }, { status: 403 });
    }

    if (!user.isGraduated) {
      return NextResponse.json(
        { error: 'GER is only available after marking graduation on your profile.' },
        { status: 403 }
      );
    }

    const oid = new mongoose.Types.ObjectId(session.user.id);

    // ── Fetch platform data ──────────────────────────────────────────
    const applications = await Application.find({ studentId: oid }).lean();
    const jobApps = applications.filter((a) => !a.isEventRegistration);
    const eventApps = applications.filter((a) => a.isEventRegistration);
    const hiredApps = jobApps.filter((a) => a.status === 'hired');

    // Employer endorsements — applications with fitScore (proxy until Review model exists)
    const endorsed = jobApps.filter((a) => typeof a.fitScore === 'number');
    const avgRating =
      endorsed.length > 0
        ? endorsed.reduce((s, a) => s + (a.fitScore ?? 0), 0) / endorsed.length / 20 // fitScore 0–100 → 0–5
        : 0;

    // Badges — from BadgeAward model (graceful fallback if model not seeded)
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
      /* model not yet seeded — default to empty */
    }

    // Mentor sessions — from MentorSession model (graceful fallback)
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
      /* model not yet seeded */
    }

    // Freelance orders — from FreelanceOrder model (graceful fallback)
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
      /* model not yet seeded */
    }

    // ── Build raw GER input ──────────────────────────────────────────
    const raw: RawGERInput = {
      name: user.name ?? 'Student',
      email: user.email ?? '',
      studentId: user.studentId,
      university: user.university,
      department: user.department,
      cgpa: user.cgpa,
      cgpaScore: user.cgpa ?? 0,
      graduatedAt: new Date().toISOString(), // use current date if not stored separately
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

    // ── Compute scores & generate PDF ────────────────────────────────
    const gerData = computeGERScore(raw);
    const pdfBuffer = await generateGERPDF(gerData);

    // ── Persist gerUrl to user (fire-and-forget — don't block response) ──
    // The upload-to-UT step happens client-side from the GER page.
    // Here we just return the binary PDF directly.

    const safeName = (user.name ?? 'Student').replace(/\s+/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeName}_GER.pdf"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[GER GENERATE ERROR]', err);
    return NextResponse.json({ error: 'Failed to generate GER' }, { status: 500 });
  }
}
