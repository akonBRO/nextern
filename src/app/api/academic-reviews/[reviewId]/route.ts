import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { UpdateAcademicReviewSchema } from '@/lib/validations';
import { AcademicReview } from '@/models/AcademicReview';

type Params = Promise<{ reviewId: string }>;

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
    const parsed = UpdateAcademicReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { reviewId } = await params;
    await connectDB();

    const updated = await AcademicReview.findOneAndUpdate(
      { _id: reviewId, reviewerId: session.user.id },
      { $set: { status: parsed.data.status } },
      { new: true }
    ).lean();

    if (!updated) {
      return NextResponse.json({ error: 'Academic review not found.' }, { status: 404 });
    }

    return NextResponse.json({
      message: 'Academic review updated successfully.',
      review: { id: updated._id.toString(), status: updated.status },
    });
  } catch (error) {
    console.error('[ACADEMIC REVIEW UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update academic review.' }, { status: 500 });
  }
}
