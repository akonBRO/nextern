import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { buildUnknownAIMeta } from '@/lib/ai-meta';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { analyzeSkillGap } from '@/lib/gemini';
import { checkFeatureAccess, getUsageSummary } from '@/lib/premium';
import { Job } from '@/models/Job';
import { User } from '@/models/User';
import { Application } from '@/models/Application';
import { FeatureUsage } from '@/models/FeatureUsage';

const Schema = z.object({
  jobId: z.string().length(24),
  forceRefresh: z.boolean().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can use this feature.' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid job selection.' }, { status: 400 });
    }

    await connectDB();

    const existingApplication = await Application.findOne({
      studentId: session.user.id,
      jobId: parsed.data.jobId,
      fitScoreComputedAt: { $exists: true },
    }).lean();

    if (existingApplication?.fitScoreComputedAt && !parsed.data.forceRefresh) {
      return NextResponse.json({
        cached: true,
        analysis: {
          fitScore: existingApplication.fitScore ?? 0,
          hardGaps: existingApplication.hardGaps ?? [],
          softGaps: existingApplication.softGaps ?? [],
          metRequirements: existingApplication.metRequirements ?? [],
          suggestedPath: existingApplication.suggestedPath ?? [],
          summary: existingApplication.fitSummary ?? '',
        },
        meta: existingApplication.fitAnalysisMeta ?? buildUnknownAIMeta('gemini'),
        usage: await getUsageSummary(session.user.id),
      });
    }

    const access = await checkFeatureAccess(session.user.id, 'skillGapAnalysis');
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          requiresPremium: true,
          usage: access.usage,
        },
        { status: 403 }
      );
    }

    const [student, job] = await Promise.all([
      User.findById(session.user.id)
        .select('skills cgpa completedCourses university department yearOfStudy')
        .lean(),
      Job.findById(parsed.data.jobId).lean(),
    ]);

    if (!student || !job) {
      return NextResponse.json({ error: 'Job or student profile not found.' }, { status: 404 });
    }

    const result = await analyzeSkillGap({
      studentSkills: student.skills ?? [],
      studentCGPA: student.cgpa ?? 0,
      completedCourses: student.completedCourses ?? [],
      jobRequiredSkills: job.requiredSkills ?? [],
      jobMinCGPA: job.minimumCGPA ?? 0,
      jobRequiredCourses: job.requiredCourses ?? [],
      jobExperienceExpectations: job.experienceExpectations ?? '',
      jobTitle: job.title,
      companyName: job.companyName,
    });

    await FeatureUsage.create({
      userId: session.user.id,
      feature: 'skill_gap_analysis',
      metadata: {
        jobId: job._id.toString(),
      },
    });

    const application = await Application.findOne({
      studentId: session.user.id,
      jobId: parsed.data.jobId,
    });

    if (application) {
      application.fitScore = result.data.fitScore;
      application.hardGaps = result.data.hardGaps;
      application.softGaps = result.data.softGaps;
      application.metRequirements = result.data.metRequirements;
      application.suggestedPath = result.data.suggestedPath;
      application.fitSummary = result.data.summary;
      application.fitScoreComputedAt = new Date();
      application.fitAnalysisMeta = result.meta;
      await application.save();
    }

    return NextResponse.json({
      cached: false,
      analysis: result.data,
      meta: result.meta,
      usage: await getUsageSummary(session.user.id),
    });
  } catch (error) {
    console.error('[AI SKILL GAP ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate skill gap analysis.' }, { status: 500 });
  }
}
