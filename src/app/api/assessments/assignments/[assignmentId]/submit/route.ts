import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { AssessmentSubmitSchema } from '@/lib/validations';
import { PremiumAccessError, submitAssessmentAssignment } from '@/lib/hiring-suite';

type Params = { params: Promise<{ assignmentId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AssessmentSubmitSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { assignmentId } = await params;
    const result = await submitAssessmentAssignment({
      assignmentId,
      studentId: session.user.id,
      answers: parsed.data.answers,
      autoSubmit: body?.autoSubmit,
    });

    return NextResponse.json({ result });
  } catch (error) {
    console.error('[ASSESSMENT SUBMIT ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to submit assessment.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}
