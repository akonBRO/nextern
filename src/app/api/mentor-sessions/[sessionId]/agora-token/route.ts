import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { issueMentorshipJoinToken, MentorshipAccessError } from '@/lib/mentorship';

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const actorRole = session.user.role === 'alumni' ? 'mentor' : 'student';

    const tokenBundle = await issueMentorshipJoinToken({
      sessionId,
      userId: session.user.id,
      role: actorRole,
    });

    return NextResponse.json(tokenBundle);
  } catch (error) {
    console.error('[MENTORSHIP TOKEN ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to issue Agora token.' },
      { status: error instanceof MentorshipAccessError ? error.status : 500 }
    );
  }
}
