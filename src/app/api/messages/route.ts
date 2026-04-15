import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getFreelanceOrderThreadId, inferFreelanceProposalStatus } from '@/lib/freelance-shared';
import { Message } from '@/models/Message';
import { FreelanceOrder } from '@/models/FreelanceOrder';
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

function toObjectId(value: string) {
  return new mongoose.Types.ObjectId(value);
}

function canUseFreelanceThread(params: { status?: string | null; proposalStatus?: string | null }) {
  const proposalStatus = inferFreelanceProposalStatus(params);
  const status = params.status ?? null;

  if (proposalStatus !== 'accepted') {
    return false;
  }

  return !['cancelled', 'completed'].includes(status ?? '');
}

function checkIsFlagged(content: string): boolean {
  if (!content) return false;
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

  const myId = toObjectId(session.user.id);
  const { searchParams } = new URL(req.url);
  const initiateUser = searchParams.get('initiateUser');
  const initiateFreelanceOrder = searchParams.get('freelanceOrder');

  // Fetch all messages involving this user
  const allMessages = await Message.find({
    $or: [{ senderId: myId }, { receiverId: myId }],
    deletedFor: { $ne: myId },
  })
    .sort({ createdAt: -1 })
    .lean();

  // Group into threads
  const threadMap = new Map<
    string,
    {
      lastMessage: (typeof allMessages)[0];
      unreadCount: number;
      otherUserId: string;
      threadType: 'direct' | 'freelance_order';
      relatedFreelanceOrderId?: string | null;
    }
  >();

  for (const msg of allMessages) {
    const otherId =
      msg.senderId.toString() === session.user.id
        ? msg.receiverId.toString()
        : msg.senderId.toString();
    const tid = msg.threadId;

    if (!threadMap.has(tid)) {
      threadMap.set(tid, {
        lastMessage: msg,
        unreadCount: 0,
        otherUserId: otherId,
        threadType: msg.threadType === 'freelance_order' ? 'freelance_order' : 'direct',
        relatedFreelanceOrderId: msg.relatedFreelanceOrderId?.toString?.() ?? null,
      });
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
          threadType: 'direct',
          content: '',
          isRead: true,
          isFlagged: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        } as unknown as (typeof allMessages)[0],
        unreadCount: 0,
        otherUserId: initiateUser,
        threadType: 'direct',
        relatedFreelanceOrderId: null,
      });
    }
  }

  let initiatedFreelanceThreadId: string | null = null;

  if (initiateFreelanceOrder && mongoose.Types.ObjectId.isValid(initiateFreelanceOrder)) {
    const order = await FreelanceOrder.findById(initiateFreelanceOrder)
      .populate('listingId', 'title')
      .select(
        'clientId freelancerId status proposalStatus messageThreadId listingId createdAt updatedAt'
      )
      .lean();

    if (order) {
      const clientId = order.clientId.toString();
      const freelancerId = order.freelancerId.toString();
      const isParticipant = clientId === session.user.id || freelancerId === session.user.id;

      if (isParticipant) {
        const threadId =
          typeof order.messageThreadId === 'string' && order.messageThreadId
            ? order.messageThreadId
            : getFreelanceOrderThreadId(order._id.toString());
        const otherUserId = clientId === session.user.id ? freelancerId : clientId;

        initiatedFreelanceThreadId = threadId;

        if (!threadMap.has(threadId) && canUseFreelanceThread(order)) {
          threadMap.set(threadId, {
            lastMessage: {
              _id: new mongoose.Types.ObjectId(),
              senderId: myId,
              receiverId: new mongoose.Types.ObjectId(otherUserId),
              threadId,
              threadType: 'freelance_order',
              content: '',
              isRead: true,
              isFlagged: false,
              relatedFreelanceOrderId: order._id,
              createdAt: order.updatedAt ?? order.createdAt ?? new Date(),
              updatedAt: order.updatedAt ?? order.createdAt ?? new Date(),
            } as unknown as (typeof allMessages)[0],
            unreadCount: 0,
            otherUserId,
            threadType: 'freelance_order',
            relatedFreelanceOrderId: order._id.toString(),
          });
        }
      }
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
  const freelanceOrderIds = Array.from(
    new Set(
      [...threadMap.values()]
        .map((thread) => thread.relatedFreelanceOrderId)
        .filter((id): id is string => Boolean(id && mongoose.Types.ObjectId.isValid(id)))
    )
  ).map((id) => toObjectId(id));

  const freelanceOrders = freelanceOrderIds.length
    ? await FreelanceOrder.find({ _id: { $in: freelanceOrderIds } })
        .populate('listingId', 'title')
        .select('listingId status proposalStatus clientId freelancerId messageThreadId')
        .lean()
    : [];
  const freelanceOrderMap = new Map(freelanceOrders.map((order) => [order._id.toString(), order]));

  const threads = Array.from(threadMap.entries())
    .map(([threadId, data]) => {
      const otherUser = userMap.get(data.otherUserId);
      if (!otherUser) return null;
      const freelanceOrder = data.relatedFreelanceOrderId
        ? freelanceOrderMap.get(data.relatedFreelanceOrderId)
        : null;

      return {
        threadId,
        lastMessage: data.lastMessage,
        unreadCount: data.unreadCount,
        threadType: data.threadType,
        otherUser: {
          _id: data.otherUserId,
          name: otherUser.name,
          role: otherUser.role,
          image: otherUser.image,
          companyName: otherUser.companyName,
        },
        freelanceOrder:
          data.threadType === 'freelance_order' && freelanceOrder
            ? {
                _id: freelanceOrder._id.toString(),
                title:
                  freelanceOrder.listingId &&
                  typeof freelanceOrder.listingId === 'object' &&
                  'title' in freelanceOrder.listingId
                    ? String(freelanceOrder.listingId.title)
                    : 'Freelance order',
                status: String(freelanceOrder.status ?? ''),
                proposalStatus: inferFreelanceProposalStatus({
                  proposalStatus:
                    typeof freelanceOrder.proposalStatus === 'string'
                      ? freelanceOrder.proposalStatus
                      : undefined,
                  status:
                    typeof freelanceOrder.status === 'string' ? freelanceOrder.status : undefined,
                }),
              }
            : null,
      };
    })
    .filter(Boolean)
    .sort(
      (a, b) =>
        new Date(b!.lastMessage.createdAt).getTime() - new Date(a!.lastMessage.createdAt).getTime()
    );

  return NextResponse.json({ threads, initiatedThreadId: initiatedFreelanceThreadId });
}

// ── POST /api/messages ─────────────────────────────────────────────────────
// Send a new message.
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  await connectDB();

  const {
    receiverId,
    content,
    templateType,
    attachments,
    forwardedFromId,
    threadId,
    threadType,
    relatedFreelanceOrderId,
  } = await req.json();

  if (
    (!content?.trim() && (!attachments || attachments.length === 0)) ||
    (!receiverId && !relatedFreelanceOrderId)
  ) {
    return NextResponse.json(
      { error: 'A valid recipient and either content or attachments are required' },
      { status: 400 }
    );
  }

  const isFlagged = checkIsFlagged(content || '');
  let resolvedReceiverId = receiverId;
  let resolvedThreadId = threadId;
  let resolvedThreadType: 'direct' | 'freelance_order' =
    threadType === 'freelance_order' ? 'freelance_order' : 'direct';
  let resolvedFreelanceOrderId: mongoose.Types.ObjectId | undefined;

  if (resolvedThreadType === 'freelance_order' || relatedFreelanceOrderId) {
    if (!relatedFreelanceOrderId || !mongoose.Types.ObjectId.isValid(relatedFreelanceOrderId)) {
      return NextResponse.json({ error: 'Invalid freelance order thread.' }, { status: 400 });
    }

    const order = await FreelanceOrder.findById(relatedFreelanceOrderId)
      .select('clientId freelancerId status proposalStatus messageThreadId')
      .lean();

    if (!order) {
      return NextResponse.json({ error: 'Freelance order not found.' }, { status: 404 });
    }

    const clientId = order.clientId.toString();
    const freelancerId = order.freelancerId.toString();
    if (clientId !== session.user.id && freelancerId !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (!canUseFreelanceThread(order)) {
      return NextResponse.json(
        {
          error:
            'Freelance chat opens only after quote acceptance and closes after the order is closed.',
        },
        { status: 400 }
      );
    }

    resolvedReceiverId = clientId === session.user.id ? freelancerId : clientId;
    if (receiverId && receiverId !== resolvedReceiverId) {
      return NextResponse.json({ error: 'Invalid freelance thread recipient.' }, { status: 400 });
    }

    resolvedThreadType = 'freelance_order';
    resolvedThreadId =
      (typeof order.messageThreadId === 'string' && order.messageThreadId) ||
      getFreelanceOrderThreadId(order._id.toString());
    resolvedFreelanceOrderId = order._id;

    if (!order.messageThreadId) {
      await FreelanceOrder.findByIdAndUpdate(order._id, {
        $set: { messageThreadId: resolvedThreadId },
      });
    }
  } else {
    if (!receiverId || !mongoose.Types.ObjectId.isValid(receiverId)) {
      return NextResponse.json({ error: 'Invalid receiverId' }, { status: 400 });
    }

    resolvedThreadId = makeThreadId(session.user.id, receiverId);
  }

  const message = await Message.create({
    senderId: toObjectId(session.user.id),
    receiverId: toObjectId(resolvedReceiverId),
    threadId: resolvedThreadId,
    threadType: resolvedThreadType,
    content: content?.trim() || ' ',
    relatedFreelanceOrderId: resolvedFreelanceOrderId,
    forwardedFromId:
      forwardedFromId && mongoose.Types.ObjectId.isValid(forwardedFromId)
        ? toObjectId(forwardedFromId)
        : undefined,
    isFlagged,
    templateType: templateType || null,
  });

  // Force inject attachments natively to bypass NextJS strictly caching the old schema!
  if (attachments && attachments.length > 0) {
    await mongoose.connection
      .collection('messages')
      .updateOne({ _id: message._id }, { $set: { attachments: attachments } });
  }

  // Populate sender for the Pusher payload
  const populated = await Message.findById(message._id)
    .populate('senderId', 'name role image companyName')
    .lean();

  // Trigger Pusher event on receiver's channel
  try {
    await pusher.trigger(`user-${resolvedReceiverId}`, 'new-message', populated);
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

  const receiverId = new mongoose.Types.ObjectId(session.user.id);

  // Find unread messages to know if we need to trigger an event, and who the sender was
  const unreadMessages = await Message.find({
    threadId,
    receiverId,
    isRead: false,
  }).limit(1);

  if (unreadMessages.length > 0) {
    await Message.updateMany(
      {
        threadId,
        receiverId,
        isRead: false,
      },
      { isRead: true, readAt: new Date() }
    );

    const senderId = unreadMessages[0].senderId.toString();
    try {
      await pusher.trigger(`user-${senderId}`, 'messages-read', { threadId });
    } catch (err) {
      console.error('Pusher trigger failed:', err);
    }
  }

  return NextResponse.json({ ok: true });
}
