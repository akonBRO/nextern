import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { generateTrainingPath } from '@/lib/gemini';
import { checkFeatureAccess, getUsageSummary } from '@/lib/premium';
import { User } from '@/models/User';
import { FeatureUsage } from '@/models/FeatureUsage';

const Schema = z.object({
  skill: z.string().min(2).max(100),
  targetRole: z.string().min(2).max(120).optional(),
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
      return NextResponse.json({ error: 'Invalid training path request.' }, { status: 400 });
    }

    await connectDB();

    const access = await checkFeatureAccess(session.user.id, 'trainingPath');
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

    const student = await User.findById(session.user.id).select('skills yearOfStudy').lean();

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const result = await generateTrainingPath({
      skill: parsed.data.skill,
      targetRole: parsed.data.targetRole ?? 'Internship role',
      studentLevel: (student.yearOfStudy ?? 1) > 2 ? 'intermediate' : 'beginner',
      existingSkills: student.skills ?? [],
    });

    await FeatureUsage.create({
      userId: session.user.id,
      feature: 'training_path',
      metadata: {
        skill: parsed.data.skill,
      },
    });

    return NextResponse.json({
      steps: result.data,
      meta: result.meta,
      usage: await getUsageSummary(session.user.id),
    });
  } catch (error) {
    console.error('[AI TRAINING PATH ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate training path.' }, { status: 500 });
  }
}
