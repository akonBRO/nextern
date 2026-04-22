import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MentorSession } from '@/models/MentorSession';
import { Mentor } from '@/models/Mentor';

type Params = { params: Promise<{ sessionId: string }> };

export async function POST(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const { rating, review } = body;

    if (!rating || rating < 1 || rating > 5) {
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 });
    }

    await connectDB();

    const mentorSession = await MentorSession.findById(sessionId);
    if (!mentorSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    if (mentorSession.studentId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (mentorSession.status !== 'completed') {
      return NextResponse.json({ error: 'Session must be completed to rate' }, { status: 400 });
    }

    if (mentorSession.studentRating) {
      return NextResponse.json({ error: 'Session already rated' }, { status: 400 });
    }

    mentorSession.studentRating = rating;
    mentorSession.studentReview = review;
    await mentorSession.save();

    // Recalculate average rating for the mentor
    const allRatedSessions = await MentorSession.find({
      mentorId: mentorSession.mentorId,
      studentRating: { $exists: true, $ne: null },
    })
      .select('studentRating')
      .lean();

    const totalRatings = allRatedSessions.length;
    const sumRatings = allRatedSessions.reduce((acc, s) => acc + (s.studentRating || 0), 0);
    const averageRating = totalRatings > 0 ? Number((sumRatings / totalRatings).toFixed(1)) : 0;

    await Mentor.findByIdAndUpdate(mentorSession.mentorId, {
      $set: { averageRating },
    });

    return NextResponse.json(mentorSession);
  } catch (error) {
    console.error('[RATE MENTOR SESSION ERROR]', error);
    return NextResponse.json({ error: 'Failed to submit rating' }, { status: 500 });
  }
}
