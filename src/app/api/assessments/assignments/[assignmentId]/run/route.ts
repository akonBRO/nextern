import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AssessmentRunSchema } from '@/lib/validations';
import { runAssessmentCodingQuestion } from '@/lib/hiring-suite';

type Params = { params: Promise<{ assignmentId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AssessmentRunSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { assignmentId } = await params;
    const execution = await runAssessmentCodingQuestion({
      assignmentId,
      studentId: session.user.id,
      questionIndex: parsed.data.questionIndex,
      code: parsed.data.code,
      stdin: parsed.data.stdin || undefined,
    });

    return NextResponse.json({ execution });
  } catch (error) {
    console.error('[ASSESSMENT RUN ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to run code.' },
      { status: 500 }
    );
  }
}
