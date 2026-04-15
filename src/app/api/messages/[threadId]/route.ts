import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getFreelanceOrderThreadId } from '@/lib/freelance-shared';
import { Message } from '@/models/Message';
import { FreelanceOrder } from '@/models/FreelanceOrder';
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
  const myObjectId = new mongoose.Types.ObjectId(session.user.id);

  const hasMessageAccess = await Message.exists({
    threadId,
    $or: [{ senderId: myObjectId }, { receiverId: myObjectId }],
  });

  let hasFreelanceAccess = false;
  if (!hasMessageAccess && threadId.startsWith('freelance-order-')) {
    const rawOrderId = threadId.replace('freelance-order-', '');
    if (mongoose.Types.ObjectId.isValid(rawOrderId)) {
      const order = await FreelanceOrder.findById(rawOrderId)
        .select('clientId freelancerId messageThreadId')
        .lean();

      if (order) {
        const expectedThreadId =
          (typeof order.messageThreadId === 'string' && order.messageThreadId) ||
          getFreelanceOrderThreadId(order._id.toString());
        hasFreelanceAccess =
          expectedThreadId === threadId &&
          [order.clientId.toString(), order.freelancerId.toString()].includes(session.user.id);
      }
    }
  }

  if (!hasMessageAccess && !hasFreelanceAccess) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const messages = await Message.find({
    threadId,
    deletedFor: { $ne: myObjectId },
  })
    .sort({ createdAt: 1 })
    .populate('senderId', 'name role image companyName')
    .lean();

  return NextResponse.json({ messages });
}
