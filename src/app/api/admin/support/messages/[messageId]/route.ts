import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/admin';
import { AdminMessageModerationSchema } from '@/lib/validations';
import { Message } from '@/models/Message';

type Params = { params: Promise<{ messageId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { messageId } = await params;
    if (!mongoose.Types.ObjectId.isValid(messageId)) {
      return NextResponse.json({ error: 'Invalid message ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminMessageModerationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const updated = await Message.findByIdAndUpdate(
      messageId,
      {
        $set: {
          isFlagged: parsed.data.isFlagged,
          flagReason: parsed.data.isFlagged ? (parsed.data.flagReason ?? '') : '',
        },
      },
      { new: true, runValidators: true }
    )
      .populate('senderId', 'name email role')
      .populate('receiverId', 'name email role')
      .lean();

    if (!updated) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 });
    }

    return NextResponse.json({ message: 'Message moderation updated.', item: updated });
  } catch (error) {
    console.error('[ADMIN MESSAGE MODERATION ERROR]', error);
    return NextResponse.json({ error: 'Failed to moderate message' }, { status: 500 });
  }
}
