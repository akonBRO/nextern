import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Message } from '@/models/Message';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can convert to alumni' }, { status: 403 });
    }

    await connectDB();

    // We assume the user profile has some graduation date or we just trust them for now based on the modal confirmation
    // Note: session.user.role in the JWT might not update immediately until next login,
    // but the DB will reflect the change.

    const user = await User.findByIdAndUpdate(
      session.user.id,
      { $set: { role: 'alumni' } },
      { new: true }
    );

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Delete all previous messages as a student
    await Message.deleteMany({
      $or: [{ senderId: session.user.id }, { receiverId: session.user.id }],
    });

    return NextResponse.json({ success: true, role: user.role });
  } catch (error) {
    console.error('[CONVERT ALUMNI ERROR]', error);
    return NextResponse.json({ error: 'Failed to convert to alumni role' }, { status: 500 });
  }
}
