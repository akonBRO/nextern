import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Mentor } from '@/models/Mentor';
import { BadgeAward } from '@/models/BadgeAward';
import { Review } from '@/models/Review';
import mongoose from 'mongoose';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);

    const [mentor, badges, endorsements] = await Promise.all([
      Mentor.findOne({ userId: session.user.id }).lean(),
      BadgeAward.find({ userId, isDisplayed: true }).sort({ awardedAt: -1 }).lean(),
      Review.find({
        revieweeId: userId,
        reviewType: 'employer_to_student',
        isRecommended: true,
        isPublic: true,
      })
        .populate('reviewerId', 'name image')
        .sort({ createdAt: -1 })
        .limit(6)
        .lean(),
    ]);

    if (!mentor) {
      return NextResponse.json({ error: 'Mentor profile not found' }, { status: 404 });
    }

    return NextResponse.json({ ...mentor, badges, endorsements });
  } catch (error) {
    console.error('[GET MENTOR ME ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch mentor profile' }, { status: 500 });
  }
}
