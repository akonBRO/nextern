import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import mongoose from 'mongoose';

// ── GET /api/messages/[threadId] ───────────────────────────────────────────
// Returns all messages for a specific thread (verified ownership).
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const { threadId } = await params;

  // Security: ensure the current user is part of this thread
  const myId = session.user.id;
  if (!threadId.includes(myId)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await Message.find({ threadId })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name role image companyName')
    .lean();

  return NextResponse.json({ messages });
}
