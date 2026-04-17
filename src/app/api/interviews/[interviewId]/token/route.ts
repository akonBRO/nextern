import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { issueInterviewJoinToken, PremiumAccessError } from '@/lib/hiring-suite';

type Params = { params: Promise<{ interviewId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || !['student', 'employer'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { interviewId } = await params;
    const actorRole = session.user.role === 'student' ? 'student' : 'employer';
    const tokenBundle = await issueInterviewJoinToken({
      interviewId,
      userId: session.user.id,
      role: actorRole,
    });

    return NextResponse.json(tokenBundle);
  } catch (error) {
    console.error('[INTERVIEW TOKEN ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue Agora token.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}
