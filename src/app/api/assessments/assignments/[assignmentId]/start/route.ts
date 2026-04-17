import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { PremiumAccessError, startAssessmentAssignment } from '@/lib/hiring-suite';

type Params = { params: Promise<{ assignmentId: string }> };

export async function POST(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assignmentId } = await params;
    const submission = await startAssessmentAssignment(assignmentId, session.user.id);
    return NextResponse.json({ submission });
  } catch (error) {
    console.error('[ASSESSMENT START ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to start assessment.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}
