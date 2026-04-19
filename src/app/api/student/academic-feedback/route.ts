import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getStudentAcademicFeedback } from '@/lib/academic-feedback';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const feedback = await getStudentAcademicFeedback(session.user.id);
    return NextResponse.json(feedback);
  } catch (error) {
    console.error('[STUDENT ACADEMIC FEEDBACK ERROR]', error);
    return NextResponse.json({ error: 'Failed to load academic feedback.' }, { status: 500 });
  }
}
