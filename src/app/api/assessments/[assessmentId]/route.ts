import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { AssessmentActionSchema, GradeAssessmentSchema } from '@/lib/validations';
import {
  assignAssessmentToApplications,
  gradeAssessmentAssignment,
  PremiumAccessError,
} from '@/lib/hiring-suite';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';

type Params = { params: Promise<{ assessmentId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assessmentId } = await params;
    await connectDB();

    const assessment = await Assessment.findOne({
      _id: assessmentId,
      employerId: session.user.id,
    }).lean();
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    const [assignments, submissions] = await Promise.all([
      AssessmentAssignment.find({ assessmentId })
        .populate('studentId', 'name email university department isPremium')
        .populate('applicationId', 'status fitScore')
        .sort({ createdAt: -1 })
        .lean(),
      AssessmentSubmission.find({ assessmentId })
        .select('assignmentId answers objectiveScore manualScore totalScore isPassed submittedAt')
        .lean(),
    ]);

    const submissionMap = new Map(submissions.map((item) => [item.assignmentId.toString(), item]));

    return NextResponse.json({
      assessment,
      assignments: assignments.map((assignment) => ({
        ...assignment,
        submission: submissionMap.get(assignment._id.toString()) ?? null,
      })),
    });
  } catch (error) {
    console.error('[ASSESSMENT DETAIL GET ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch assessment.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id || session.user.role !== 'employer') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { assessmentId } = await params;
    const body = await req.json();

    if (body?.action === 'grade_assignment') {
      const parsed = GradeAssessmentSchema.safeParse(body);
      if (!parsed.success || typeof body.assignmentId !== 'string') {
        return NextResponse.json({ error: 'Invalid grading payload.' }, { status: 400 });
      }

      const submission = await gradeAssessmentAssignment({
        employerId: session.user.id,
        assignmentId: body.assignmentId,
        manualAdjustments: parsed.data.manualAdjustments,
      });
      return NextResponse.json({ submission });
    }

    const parsed = AssessmentActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();
    const assessment = await Assessment.findOne({
      _id: assessmentId,
      employerId: session.user.id,
    });
    if (!assessment) {
      return NextResponse.json({ error: 'Assessment not found.' }, { status: 404 });
    }

    if (parsed.data.action === 'assign') {
      const assignments = await assignAssessmentToApplications({
        employerId: session.user.id,
        assessmentId,
        applicationIds: parsed.data.applicationIds,
        dueAt: parsed.data.dueAt ? new Date(parsed.data.dueAt) : undefined,
      });
      return NextResponse.json({ assignments });
    }

    assessment.isActive = parsed.data.action === 'reactivate';
    if (parsed.data.dueAt) {
      assessment.dueAt = new Date(parsed.data.dueAt);
    }
    await assessment.save();

    return NextResponse.json({ assessment });
  } catch (error) {
    console.error('[ASSESSMENT DETAIL PATCH ERROR]', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update assessment.' },
      { status: error instanceof PremiumAccessError ? error.status : 500 }
    );
  }
}
