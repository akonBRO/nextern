import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { Assessment } from '@/models/Assessment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';

type Params = { params: Promise<{ assignmentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { assignmentId } = await params;
    await connectDB();

    const assignment = await AssessmentAssignment.findById(assignmentId)
      .populate('jobId', 'title companyName')
      .lean();
    if (!assignment) {
      return NextResponse.json({ error: 'Assessment assignment not found.' }, { status: 404 });
    }

    const isEmployer =
      session.user.role === 'employer' && assignment.employerId.toString() === session.user.id;
    const isStudent =
      session.user.role === 'student' && assignment.studentId.toString() === session.user.id;
    if (!isEmployer && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const [assessment, submission] = await Promise.all([
      Assessment.findById(assignment.assessmentId).lean(),
      AssessmentSubmission.findOne({ assignmentId }).lean(),
    ]);

    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    if (isStudent) {
      const studentAssessment = {
        ...assessment,
        questions: assessment.questions.map((question: (typeof assessment.questions)[number]) => ({
          index: question.index,
          type: question.type,
          questionText: question.questionText,
          marks: question.marks,
          options: question.options ?? [],
          enablePlagiarismCheck: question.enablePlagiarismCheck ?? false,
          language: question.language,
          starterCode: question.starterCode ?? '',
          rubric: question.rubric ?? '',
          attachments: question.attachments ?? [],
          maxWords: question.maxWords,
          testCases: (question.testCases ?? []).filter(
            (testCase: NonNullable<typeof question.testCases>[number]) => testCase.isSample
          ),
        })),
      };

      return NextResponse.json({
        assignment,
        assessment: studentAssessment,
        submission,
      });
    }

    return NextResponse.json({
      assignment,
      assessment,
      submission,
    });
  } catch (error) {
    console.error('[ASSESSMENT ASSIGNMENT GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch assessment assignment.' }, { status: 500 });
  }
}
