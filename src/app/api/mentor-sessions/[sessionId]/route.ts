import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { MentorSession } from '@/models/MentorSession';
import { Mentor } from '@/models/Mentor';
import { Message } from '@/models/Message';
import { notifyMentorshipAccepted } from '@/lib/notify';
import { onMentorSessionComplete } from '@/lib/events';

type Params = { params: Promise<{ sessionId: string }> };

function generateThreadId(id1: string, id2: string) {
  return [id1, id2].sort().join('-');
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sessionId } = await params;
    const body = await req.json();
    const { status, scheduledAt, durationMinutes } = body;

    await connectDB();

    const mentorSession = await MentorSession.findById(sessionId);
    if (!mentorSession) {
      return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    }

    const mentor = await Mentor.findById(mentorSession.mentorId).populate('userId', 'name').lean();
    if (!mentor) {
      return NextResponse.json({ error: 'Mentor not found' }, { status: 404 });
    }

    const isMentor = mentor.userId._id.toString() === session.user.id;
    const isStudent = mentorSession.studentId.toString() === session.user.id;

    if (!isMentor && !isStudent) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (status === 'accepted') {
      if (!isMentor) {
        return NextResponse.json({ error: 'Only mentor can accept' }, { status: 403 });
      }
      if (!scheduledAt) {
        return NextResponse.json(
          { error: 'scheduledAt is required to accept a session' },
          { status: 400 }
        );
      }

      mentorSession.status = 'accepted';
      mentorSession.scheduledAt = new Date(scheduledAt);
      if (durationMinutes) mentorSession.durationMinutes = durationMinutes;

      // Generate unique Agora channel ID
      mentorSession.agoraChannelId = `mentorship-${mentorSession._id.toString()}`;

      // Increment sessions limit usage
      await Mentor.findByIdAndUpdate(mentorSession.mentorId, {
        $inc: { sessionsThisMonth: 1, totalSessions: 1 },
      });

      await mentorSession.save();

      // Fire notification
      await notifyMentorshipAccepted(
        mentorSession.studentId.toString(),
        mentor.userId.name || 'Your Mentor',
        mentorSession.scheduledAt
      );

      // Auto-create message thread
      const threadId = generateThreadId(
        mentor.userId._id.toString(),
        mentorSession.studentId.toString()
      );
      const existingMessage = await Message.findOne({ threadId });

      if (!existingMessage) {
        await Message.create({
          senderId: mentor.userId._id,
          receiverId: mentorSession.studentId,
          threadId,
          content: `Hi! I've accepted your mentorship request. Looking forward to our session!`,
          isRead: false,
        });
      }

      return NextResponse.json(mentorSession);
    }

    if (status === 'rejected') {
      if (!isMentor) {
        return NextResponse.json({ error: 'Only mentor can reject' }, { status: 403 });
      }
      mentorSession.status = 'rejected';
      await mentorSession.save();
      return NextResponse.json(mentorSession);
    }

    if (status === 'completed') {
      if (!isMentor && !isStudent) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (mentorSession.status === 'completed') {
        return NextResponse.json({ error: 'Already completed' }, { status: 400 });
      }

      mentorSession.status = 'completed';
      mentorSession.completedAt = new Date();
      await mentorSession.save();

      // Call event hook to evaluate badges and opportunity score
      await onMentorSessionComplete(
        mentorSession.studentId.toString(),
        mentor.userId._id.toString() // advisor role in badge engine
      );

      // We handle Opportunity Score award implicitly within the event or via GER recalculation
      mentorSession.opportunityScoreAwarded = true;
      await mentorSession.save();

      return NextResponse.json(mentorSession);
    }

    if (status === 'cancelled') {
      mentorSession.status = 'cancelled';
      await mentorSession.save();
      return NextResponse.json(mentorSession);
    }

    return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  } catch (error) {
    console.error('[UPDATE MENTOR SESSION ERROR]', error);
    return NextResponse.json({ error: 'Failed to update session' }, { status: 500 });
  }
}
