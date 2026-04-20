import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { createNotification, notifyEmployerRecommendationRequest } from '@/lib/notify';
import {
  OpportunityRecommendationSchema,
  type OpportunityRecommendationInput,
} from '@/lib/validations';
import { canTeacherAccessStudent, resolveTeacherScope } from '@/lib/opportunity-recommendations';
import { OpportunityRecommendation } from '@/models/OpportunityRecommendation';
import { AdvisorAction } from '@/models/AdvisorAction';
import { Job } from '@/models/Job';
import { User } from '@/models/User';

function getActionType(input: OpportunityRecommendationInput) {
  if (input.priority === 'high') return 'priority_flagged' as const;
  return 'note_added' as const;
}

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
    const parsed = OpportunityRecommendationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const scope = await resolveTeacherScope(session.user.id, session.user.role);
    const hasAccess = await canTeacherAccessStudent(scope, parsed.data.studentId);
    if (!hasAccess) {
      return NextResponse.json({ error: 'Student is outside your scope.' }, { status: 403 });
    }

    await connectDB();

    const linkedJob = await Job.findById(parsed.data.linkedJobId)
      .select('title companyName type isActive employerId')
      .lean();

    if (!linkedJob) {
      return NextResponse.json({ error: 'Selected job was not found.' }, { status: 404 });
    }

    if (!linkedJob.isActive) {
      return NextResponse.json({ error: 'Selected job is no longer active.' }, { status: 400 });
    }

    if (
      linkedJob.type !== 'internship' &&
      linkedJob.type !== 'part-time' &&
      linkedJob.type !== 'full-time'
    ) {
      return NextResponse.json(
        { error: 'Only internship, part-time, or full-time jobs can be recommended here.' },
        { status: 400 }
      );
    }

    const [recommender, student] = await Promise.all([
      User.findById(session.user.id).select('name').lean(),
      User.findById(parsed.data.studentId).select('name').lean(),
    ]);

    const recommendation = await OpportunityRecommendation.create({
      studentId: parsed.data.studentId,
      recommenderId: session.user.id,
      employerId: linkedJob.employerId,
      recommenderRole: session.user.role,
      category: parsed.data.category,
      title: parsed.data.title,
      description: parsed.data.description,
      priority: parsed.data.priority,
      focusSkills: parsed.data.focusSkills,
      linkedJobId: parsed.data.linkedJobId,
      resourceUrl: parsed.data.resourceUrl || undefined,
      fitScore: parsed.data.fitScore,
      status: 'active',
      requestStatus: 'pending',
    });

    await AdvisorAction.create({
      advisorId: session.user.id,
      studentId: parsed.data.studentId,
      actionType: getActionType(parsed.data),
      aiTrainingPlanSnapshot: parsed.data.focusSkills,
      advisorModifications: [parsed.data.title],
      advisorNote: parsed.data.description,
      isPriorityFlagged: parsed.data.priority === 'high',
    });

    await createNotification({
      userId: parsed.data.studentId,
      type: 'advisor_note',
      title: `${session.user.role === 'dept_head' ? 'Department job recommendation' : 'Advisor job recommendation'} added`,
      body: `${
        recommender?.name ?? 'Your advisor'
      } recommended you for "${linkedJob.title}" at ${linkedJob.companyName}. Review the reason, fit guidance, and next steps from your profile.`,
      link: '/student/profile',
      meta: {
        recommendationId: recommendation._id.toString(),
        category: parsed.data.category,
        linkedJobId: parsed.data.linkedJobId,
        title: parsed.data.title,
        icon: parsed.data.priority === 'high' ? 'Target' : 'Sparkles',
      },
      preferenceKey: 'advisor_notes',
    });

    await notifyEmployerRecommendationRequest({
      employerId: linkedJob.employerId.toString(),
      studentId: parsed.data.studentId,
      studentName: student?.name ?? 'this student',
      recommenderId: session.user.id,
      recommenderName: recommender?.name ?? 'Academic reviewer',
      recommenderRole: session.user.role,
      recommendationId: recommendation._id.toString(),
      jobId: parsed.data.linkedJobId,
      jobTitle: linkedJob.title,
      companyName: linkedJob.companyName,
    });

    return NextResponse.json(
      {
        message: 'Recommendation saved successfully.',
        recommendation: {
          id: recommendation._id.toString(),
          title: recommendation.title,
          category: recommendation.category,
          priority: recommendation.priority,
          linkedOpportunityTitle: linkedJob?.title,
          companyName: linkedJob.companyName,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[OPPORTUNITY RECOMMENDATION CREATE ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to save opportunity recommendation.' },
      { status: 500 }
    );
  }
}