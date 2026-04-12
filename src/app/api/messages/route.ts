import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import Pusher from 'pusher';

// ── Pusher server instance ─────────────────────────────────────────────────
const pusher = new Pusher({
  appId: process.env.PUSHER_APP_ID!,
  key: process.env.NEXT_PUBLIC_PUSHER_KEY!,
  secret: process.env.PUSHER_SECRET!,
  cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER!,
  useTLS: true,
});

// ── Helpers ────────────────────────────────────────────────────────────────
function makeThreadId(a: string, b: string) {
  return [a, b].sort().join('-');
}

function checkIsFlagged(content: string): boolean {
  const blocked = ['spam', 'scam', 'fraud', 'fake', 'illegal'];
  const lower = content.toLowerCase();
  return blocked.some((word) => lower.includes(word));
}

// ── GET /api/messages ──────────────────────────────────────────────────────
// Returns all threads for the current user.
// ?initiateUser=<userId>  →  ensures a dummy thread exists so inbox pre-selects it.
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const myId = new mongoose.Types.ObjectId(session.user.id);
  const { searchParams } = new URL(req.url);
  const initiateUser = searchParams.get('initiateUser');

  // Fetch all messages involving this user
  const allMessages = await Message.find({
    $or: [{ senderId: myId }, { receiverId: myId }],
  })
    .sort({ createdAt: -1 })
    .lean();

  // Group into threads
  const threadMap = new Map<
    string,
    { lastMessage: (typeof allMessages)[0]; unreadCount: number; otherUserId: string }
  >();

  for (const msg of allMessages) {
    const otherId =
      msg.senderId.toString() === session.user.id
        ? msg.receiverId.toString()
        : msg.senderId.toString();
    const tid = msg.threadId;

    if (!threadMap.has(tid)) {
      threadMap.set(tid, { lastMessage: msg, unreadCount: 0, otherUserId: otherId });
    }

    const isUnread = !msg.isRead && msg.receiverId.toString() === session.user.id;
    if (isUnread) {
      threadMap.get(tid)!.unreadCount += 1;
    }
  }

  // If initiateUser requested and no thread exists yet, create a placeholder entry
  if (initiateUser && mongoose.Types.ObjectId.isValid(initiateUser)) {
    const tid = makeThreadId(session.user.id, initiateUser);
    if (!threadMap.has(tid)) {
      threadMap.set(tid, {
        lastMessage: {
          _id: new mongoose.Types.ObjectId(),
          senderId: myId,
          receiverId: new mongoose.Types.ObjectId(initiateUser),
          threadId: tid,
          content: '',
          isRead: true,
          isFlagged: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as (typeof allMessages)[0],
        unreadCount: 0,
        otherUserId: initiateUser,
      });
    }
  }

  // Fetch other-user profiles
  const otherUserIds = Array.from(new Set([...threadMap.values()].map((t) => t.otherUserId)))
    .filter((id) => mongoose.Types.ObjectId.isValid(id))
    .map((id) => new mongoose.Types.ObjectId(id));

  const users = await User.find({ _id: { $in: otherUserIds } })
    .select('name role image companyName')
    .lean();

  const userMap = new Map(users.map((u) => [u._id.toString(), u]));

  const threads = Array.from(threadMap.entries())
    .map(([threadId, data]) => {
      const otherUser = userMap.get(data.otherUserId);
      if (!otherUser) return null;
      return {
        threadId,
        lastMessage: data.lastMessage,
        unreadCount: data.unreadCount,
        otherUser: {
          _id: data.otherUserId,
          name: otherUser.name,
          role: otherUser.role,
          image: otherUser.image,
          companyName: otherUser.companyName,
        },
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.lastMessage.createdAt).getTime() - new Date(a!.lastMessage.createdAt).getTime()
    );

  return NextResponse.json({ threads });
}

// ── POST /api/messages ─────────────────────────────────────────────────────
// Send a new message.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const { receiverId, content, templateType } = await req.json();

  if (!receiverId || !content?.trim()) {
    return NextResponse.json({ error: 'receiverId and content are required' }, { status: 400 });
  }

  if (!mongoose.Types.ObjectId.isValid(receiverId)) {
    return NextResponse.json({ error: 'Invalid receiverId' }, { status: 400 });
  }

  const isFlagged = checkIsFlagged(content);
  const threadId = makeThreadId(session.user.id, receiverId);

  const message = await Message.create({
    senderId: new mongoose.Types.ObjectId(session.user.id),
    receiverId: new mongoose.Types.ObjectId(receiverId),
    threadId,
    content: content.trim(),
    isFlagged,
    templateType: templateType || null,
  });

  // Populate sender for the Pusher payload
  const populated = await Message.findById(message._id)
    .populate('senderId', 'name role image companyName')
    .lean();

  // Trigger Pusher event on receiver's channel
  try {
    await pusher.trigger(`user-${receiverId}`, 'new-message', populated);
  } catch (err) {
    console.error('Pusher trigger failed:', err);
  }

  return NextResponse.json({ message: populated }, { status: 201 });
}

// ── PATCH /api/messages ────────────────────────────────────────────────────
// Mark all messages in a thread as read for the current user.
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const { threadId } = await req.json();
  if (!threadId) return NextResponse.json({ error: 'threadId required' }, { status: 400 });

  await Message.updateMany(
    {
      threadId,
      receiverId: new mongoose.Types.ObjectId(session.user.id),
      isRead: false,
    },
    { isRead: true, readAt: new Date() }
  );

  return NextResponse.json({ ok: true });
}
