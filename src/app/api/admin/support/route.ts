import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  buildSearchRegex,
  parseBooleanParam,
  parsePagination,
  requireAdminSession,
} from '@/lib/admin';
import { AdminSupportNotificationSchema } from '@/lib/validations';
import { User } from '@/models/User';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { createNotification } from '@/lib/notify';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const searchRegex = buildSearchRegex(searchParams.get('search'));
    const flaggedOnly = parseBooleanParam(searchParams.get('flaggedOnly'));
    const unreadOnly = parseBooleanParam(searchParams.get('unreadOnly'));
    const type = searchParams.get('type');
    const { limit } = parsePagination(searchParams, { defaultLimit: 12, maxLimit: 50 });

    await connectDB();

    let matchedUserIds: unknown[] = [];
    if (searchRegex) {
      const matchedUsers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { companyName: searchRegex }],
      })
        .select('_id')
        .lean();
      matchedUserIds = matchedUsers.map((item) => item._id);
    }

    const messageQuery: Record<string, unknown> = {};
    const notificationQuery: Record<string, unknown> = {};

    if (typeof flaggedOnly === 'boolean') messageQuery.isFlagged = flaggedOnly;
    if (typeof unreadOnly === 'boolean') notificationQuery.isRead = !unreadOnly ? undefined : false;
    if (type && type !== 'all') notificationQuery.type = type;

    if (searchRegex) {
      messageQuery.$or = [
        { content: searchRegex },
        { flagReason: searchRegex },
        ...(matchedUserIds.length > 0
          ? [{ senderId: { $in: matchedUserIds } }, { receiverId: { $in: matchedUserIds } }]
          : []),
      ];
      notificationQuery.$or = [
        { title: searchRegex },
        { body: searchRegex },
        ...(matchedUserIds.length > 0 ? [{ userId: { $in: matchedUserIds } }] : []),
      ];
    }

    if (notificationQuery.isRead === undefined) {
      delete notificationQuery.isRead;
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [messages, notifications, flaggedMessages, unreadNotifications, notificationsToday] =
      await Promise.all([
        Message.find(messageQuery)
          .populate('senderId', 'name email role companyName university')
          .populate('receiverId', 'name email role companyName university')
          .populate('relatedJobId', 'title companyName')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Notification.find(notificationQuery)
          .populate('userId', 'name email role companyName university')
          .sort({ createdAt: -1 })
          .limit(limit)
          .lean(),
        Message.countDocuments({ isFlagged: true }),
        Notification.countDocuments({ isRead: false }),
        Notification.countDocuments({ createdAt: { $gte: today } }),
      ]);

    return NextResponse.json({
      messages,
      notifications,
      summary: {
        flaggedMessages,
        unreadNotifications,
        notificationsToday,
      },
    });
  } catch (error) {
    console.error('[ADMIN SUPPORT ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch support data' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await req.json();
    const parsed = AdminSupportNotificationSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const notification = await createNotification({
      userId: parsed.data.userId,
      type: parsed.data.type,
      title: parsed.data.title,
      body: parsed.data.body,
      link: parsed.data.link || undefined,
      meta: {
        createdBy: session.user.id,
        source: 'admin_support_center',
      },
    });

    if (!notification) {
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json(
      { message: 'Support notification sent successfully.' },
      { status: 201 }
    );
  } catch (error) {
    console.error('[ADMIN SUPPORT SEND ERROR]', error);
    return NextResponse.json({ error: 'Failed to send support notification' }, { status: 500 });
  }
}
