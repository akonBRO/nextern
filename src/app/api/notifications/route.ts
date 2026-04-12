// src/app/api/notifications/route.ts
// GET  /api/notifications          — fetch user's notifications (paginated)
// PATCH /api/notifications         — mark all as read
// PATCH /api/notifications?id=xxx  — mark one as read

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models/Notification';
import { pusherServer, userChannel, PUSHER_EVENTS } from '@/lib/pusher';

const ALLOWED_TYPES = new Set([
  'job_match',
  'deadline_reminder',
  'status_update',
  'message_received',
  'badge_earned',
  'score_update',
  'advisor_note',
  'assessment_assigned',
  'interview_scheduled',
  'mentorship_request',
  'mentorship_accepted',
  'review_received',
  'freelance_order',
  'payment_received',
]);

// ── GET ───────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const page = Math.max(1, parseInt(searchParams.get('page') ?? '1'));
    const limit = Math.min(50, parseInt(searchParams.get('limit') ?? '20'));
    const unread = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    await connectDB();

    const query: Record<string, unknown> = { userId: session.user.id };
    if (unread) query.isRead = false;
    if (type && ALLOWED_TYPES.has(type)) query.type = type;

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ userId: session.user.id, isRead: false }),
    ]);

    return NextResponse.json({
      notifications,
      unreadCount,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    console.error('[GET NOTIFICATIONS ERROR]', err);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}

// ── PATCH ────────────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const notifId = searchParams.get('id');

    await connectDB();

    if (notifId) {
      // Mark single notification as read
      await Notification.findOneAndUpdate(
        { _id: notifId, userId: session.user.id },
        { $set: { isRead: true } }
      );
    } else {
      // Mark ALL as read
      await Notification.updateMany(
        { userId: session.user.id, isRead: false },
        { $set: { isRead: true } }
      );
    }

    // Count remaining unread
    const unreadCount = await Notification.countDocuments({
      userId: session.user.id,
      isRead: false,
    });

    // Push updated unread count via Pusher
    await pusherServer
      .trigger(userChannel(session.user.id), PUSHER_EVENTS.NOTIFICATION_READ, { unreadCount })
      .catch(() => {}); // non-critical

    return NextResponse.json({ message: 'Updated', unreadCount });
  } catch (err) {
    console.error('[PATCH NOTIFICATIONS ERROR]', err);
    return NextResponse.json({ error: 'Failed to update notifications' }, { status: 500 });
  }
}
