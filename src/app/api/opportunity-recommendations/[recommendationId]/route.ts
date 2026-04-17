import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { UpdateOpportunityRecommendationSchema } from '@/lib/validations';
import { OpportunityRecommendation } from '@/models/OpportunityRecommendation';

type Params = Promise<{ recommendationId: string }>;

export async function PATCH(req: NextRequest, { params }: { params: Params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'advisor' && session.user.role !== 'dept_head') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = UpdateOpportunityRecommendationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { recommendationId } = await params;
    await connectDB();
    const updated = await OpportunityRecommendation.findOneAndUpdate(
      { _id: recommendationId, recommenderId: session.user.id },
      { $set: { status: parsed.data.status } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Recommendation not found.' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Recommendation updated successfully.',
      recommendation: {
        id: updated._id.toString(),
        status: updated.status,
      },
    });
  } catch (error) {
    console.error('[OPPORTUNITY RECOMMENDATION UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update recommendation.' }, { status: 500 });
  }
}
