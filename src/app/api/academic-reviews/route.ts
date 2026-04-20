import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { createNotification } from '@/lib/notify';
import { AcademicReviewSchema } from '@/lib/validations';
import { canTeacherAccessStudent, resolveTeacherScope } from '@/lib/opportunity-recommendations';
import { AcademicReview } from '@/models/AcademicReview';
import { AdvisorAction } from '@/models/AdvisorAction';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'advisor' && session.user.role !== 'dept_head') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = AcademicReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const scope = await resolveTeacherScope(session.user.id, session.user.role);
    const hasAccess = await canTeacherAccessStudent(scope, parsed.data.studentId);
    if (!hasAccess) {
      return NextResponse.json(
        { error: 'Student is outside your scoped cohort.' },
        { status: 403 }
      );
    }

    await connectDB();

    const review = await AcademicReview.create({
      studentId: parsed.data.studentId,
      reviewerId: session.user.id,
      reviewerRole: session.user.role,
      university: scope.institutionName ?? '',
      department: scope.advisoryDepartment ?? '',
      headline: parsed.data.headline,
      summary: parsed.data.summary,
      strengths: parsed.data.strengths,
      growthAreas: parsed.data.growthAreas,
      readinessLevel: parsed.data.readinessLevel,
      profileScore: parsed.data.profileScore,
      status: 'active',
    });

    await AdvisorAction.create({
      advisorId: session.user.id,
      studentId: parsed.data.studentId,
      actionType:
        parsed.data.readinessLevel === 'priority_support' ? 'priority_flagged' : 'note_added',
      aiTrainingPlanSnapshot: parsed.data.growthAreas,
      advisorModifications: parsed.data.strengths,
      advisorNote: parsed.data.summary,
      isPriorityFlagged: parsed.data.readinessLevel === 'priority_support',
    });

    const reviewer = await User.findById(session.user.id).select('name').lean();
    await createNotification({
      userId: parsed.data.studentId,
      type: 'advisor_note',
      title: 'Academic profile review added',
      body: `${reviewer?.name ?? 'Your advisor'} added a new academic review to your student profile. Check the latest strengths, growth areas, and readiness guidance.`,
      link: '/student/profile',
      meta: {
        academicReviewId: review._id.toString(),
        readinessLevel: parsed.data.readinessLevel,
        icon: 'ClipboardList',
      },
      preferenceKey: 'advisor_notes',
    });

    return NextResponse.json(
      {
        message: 'Academic review saved successfully.',
        review: {
          id: review._id.toString(),
          headline: review.headline,
          readinessLevel: review.readinessLevel,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ACADEMIC REVIEW CREATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to save academic review.' }, { status: 500 });
  }
}