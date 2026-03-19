import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MockInterviewSession } from '@/models/MockInterviewSession';
import { continueInterview, isInterviewComplete, type GroqMessage } from '@/lib/groq';
import { z } from 'zod';

const Schema = z.object({
  sessionId: z.string().length(24),
  message: z.string().min(1).max(3000),
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
      return NextResponse.json({ error: 'Invalid input' }, { status: 400 });
    }

    const { sessionId, message } = parsed.data;
    await connectDB();

    const interviewSession = await MockInterviewSession.findById(sessionId);

    if (!interviewSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (interviewSession.studentId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (interviewSession.isCompleted) {
      return NextResponse.json({ error: 'Interview already completed' }, { status: 400 });
    }

    const userMsg = { role: 'user' as const, content: message, timestamp: new Date() };
    interviewSession.messages.push(userMsg);

    const groqHistory: GroqMessage[] = (interviewSession.messages as SessionMessage[]).map(
      (item) => ({
        role: item.role as 'user' | 'assistant' | 'system',
        content: item.content,
      })
    );

    const result = await continueInterview(groqHistory);

    const assistantMsg = {
      role: 'assistant' as const,
      content: result.data,
      timestamp: new Date(),
    };
    interviewSession.messages.push(assistantMsg);

    const complete = isInterviewComplete(result.data);

    if (complete) {
      interviewSession.isCompleted = true;
    }

    await interviewSession.save();

    return NextResponse.json({
      reply: result.data,
      meta: result.meta,
      isComplete: complete,
      messageCount: (interviewSession.messages as SessionMessage[]).filter(
        (item) => item.role === 'user'
      ).length,
    });
  } catch (error) {
    console.error('[MOCK INTERVIEW MESSAGE ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to process message. Please try again.' },
      { status: 500 }
    );
  }
}
