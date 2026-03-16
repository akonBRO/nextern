import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MockInterviewSession } from '@/models/MockInterviewSession';
import { User } from '@/models/User';
import { generateInterviewQuestions } from '@/lib/gemini';
import { buildInterviewSystemPrompt, startMockInterview } from '@/lib/groq';
import { checkFeatureAccess, getUsageSummary } from '@/lib/premium';
import { FeatureUsage } from '@/models/FeatureUsage';
import { z } from 'zod';

const Schema = z.object({
  targetRole: z.string().min(3).max(120),
  targetIndustry: z.string().min(2).max(80),
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
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { targetRole, targetIndustry } = parsed.data;
    await connectDB();

    const access = await checkFeatureAccess(session.user.id, 'mockInterview');
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

    const user = await User.findById(session.user.id).select('skills name').lean();
    const studentSkills = (user?.skills ?? []) as string[];
    const studentName = (user as { name?: string })?.name ?? 'Candidate';

    const questionResult = await generateInterviewQuestions({
      jobTitle: targetRole,
      industry: targetIndustry,
      requiredSkills: [],
      studentSkills,
    });
    const questions = questionResult.data.map((item) => item.question);

    const systemPrompt = buildInterviewSystemPrompt({
      jobTitle: targetRole,
      industry: targetIndustry,
      studentName,
      preparedQuestions: questions,
    });

    const startResult = await startMockInterview(systemPrompt);

    const interviewSession = await MockInterviewSession.create({
      studentId: session.user.id,
      targetRole,
      targetIndustry,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'assistant', content: startResult.data },
      ],
      isCompleted: false,
    });

    await FeatureUsage.create({
      userId: session.user.id,
      feature: 'mock_interview',
      metadata: {
        targetRole,
        targetIndustry,
        questionMode: questionResult.meta.mode,
        interviewerMode: startResult.meta.mode,
      },
    });

    return NextResponse.json({
      sessionId: interviewSession._id.toString(),
      firstQuestion: startResult.data,
      totalQuestions: questions.length,
      questionMeta: questionResult.meta,
      conversationMeta: startResult.meta,
      usage: await getUsageSummary(session.user.id),
    });
  } catch (error) {
    console.error('[MOCK INTERVIEW START ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to start interview. Please try again.' },
      { status: 500 }
    );
  }
}
