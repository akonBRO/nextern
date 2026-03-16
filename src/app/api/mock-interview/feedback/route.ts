import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MockInterviewSession } from '@/models/MockInterviewSession';
import { generateInterviewFeedback, type GroqMessage } from '@/lib/groq';
import { z } from 'zod';

const Schema = z.object({
  sessionId: z.string().length(24),
});

type SessionMessage = {
  role: 'system' | 'user' | 'assistant';
  content: string;
  timestamp?: Date;
};

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid session ID' }, { status: 400 });
    }

    await connectDB();

    const interviewSession = await MockInterviewSession.findById(parsed.data.sessionId);
    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (interviewSession.studentId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const history: GroqMessage[] = (interviewSession.messages as SessionMessage[]).map((item) => ({
      role: item.role as 'user' | 'assistant' | 'system',
      content: item.content,
    }));

    const result = await generateInterviewFeedback({
      jobTitle: interviewSession.targetRole,
      industry: interviewSession.targetIndustry,
      conversationHistory: history,
    });

    const createdAt = (interviewSession as { createdAt?: Date }).createdAt;
    const durationMs = createdAt ? Date.now() - createdAt.getTime() : 0;

    await MockInterviewSession.findByIdAndUpdate(interviewSession._id, {
      overallFeedback: result.data.overallFeedback,
      strengthsIdentified: result.data.strengths,
      areasToImprove: result.data.areasToImprove,
      isCompleted: true,
      sessionDurationSeconds: Math.round(durationMs / 1000),
    });

    return NextResponse.json({ feedback: result.data, meta: result.meta });
  } catch (error) {
    console.error('[MOCK INTERVIEW FEEDBACK ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate feedback. Please try again.' },
      { status: 500 }
    );
  }
}
