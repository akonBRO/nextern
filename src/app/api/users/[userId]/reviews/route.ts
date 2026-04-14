import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/models/Review';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(req: NextRequest, { params }: { params: Promise<{ userId: string }> }) {
  try {
    await connectDB();
    const { userId } = await params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const user = await User.findById(userId).select('role');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const reviewType = user.role === 'employer' ? 'student_to_employer' : 'employer_to_student';

    const reviews = await Review.find({
      revieweeId: userId,
      reviewType,
      isPublic: true,
      isVerified: true,
    })
      .populate('reviewerId', 'name profilePicture isVerified')
      .sort({ createdAt: -1 });

    return NextResponse.json({ success: true, count: reviews.length, data: reviews });
  } catch (error: unknown) {
    console.error('Fetch reviews error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
