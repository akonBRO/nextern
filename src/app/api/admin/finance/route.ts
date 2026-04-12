import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  buildSearchRegex,
  parseBooleanParam,
  parsePagination,
  requireAdminSession,
} from '@/lib/admin';
import { User } from '@/models/User';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const searchRegex = buildSearchRegex(searchParams.get('search'));
    const paymentStatus = searchParams.get('paymentStatus');
    const method = searchParams.get('method');
    const type = searchParams.get('type');
    const subscriptionStatus = searchParams.get('subscriptionStatus');
    const plan = searchParams.get('plan');
    const premiumOnly = parseBooleanParam(searchParams.get('premiumOnly'));
    const { page, limit, skip } = parsePagination(searchParams, { defaultLimit: 10, maxLimit: 50 });

    await connectDB();

    let matchedUserIds: unknown[] = [];
    if (searchRegex) {
      const matchedUsers = await User.find({
        $or: [
          { name: searchRegex },
          { email: searchRegex },
          { companyName: searchRegex },
          { university: searchRegex },
        ],
      })
        .select('_id')
        .lean();

      matchedUserIds = matchedUsers.map((item) => item._id);
    }

    const paymentQuery: Record<string, unknown> = {};
    const subscriptionQuery: Record<string, unknown> = {};
    const premiumUserQuery: Record<string, unknown> = { isPremium: true };

    if (paymentStatus && paymentStatus !== 'all') paymentQuery.status = paymentStatus;
    if (method && method !== 'all') paymentQuery.method = method;
    if (type && type !== 'all') paymentQuery.type = type;
    if (subscriptionStatus && subscriptionStatus !== 'all')
      subscriptionQuery.status = subscriptionStatus;
    if (plan && plan !== 'all') subscriptionQuery.plan = plan;
    if (typeof premiumOnly === 'boolean') {
      premiumUserQuery.isPremium = premiumOnly;
    }

    if (searchRegex) {
      paymentQuery.$or = [
        { bkashPaymentId: searchRegex },
        { bkashTrxId: searchRegex },
        { stripePaymentIntentId: searchRegex },
        ...(matchedUserIds.length > 0 ? [{ userId: { $in: matchedUserIds } }] : []),
      ];

      subscriptionQuery.userId = { $in: matchedUserIds };
      premiumUserQuery.$or = [
        { name: searchRegex },
        { email: searchRegex },
        { companyName: searchRegex },
        { university: searchRegex },
      ];
    }

    const [
      payments,
      subscriptions,
      premiumUsers,
      totalRevenue,
      refundedRevenue,
      activeSubscriptions,
      cancelledSubscriptions,
      premiumUserCount,
    ] = await Promise.all([
      Payment.find(paymentQuery)
        .populate('userId', 'name email role companyName university isPremium premiumExpiresAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.find(subscriptionQuery)
        .populate('userId', 'name email role companyName university isPremium premiumExpiresAt')
        .populate('paymentId', 'status method amountBDT createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.find(premiumUserQuery)
        .select(
          'name email role companyName university isPremium premiumExpiresAt verificationStatus createdAt'
        )
        .sort({ premiumExpiresAt: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amountBDT' } } },
      ]),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'refunded' } },
        { $group: { _id: null, total: { $sum: '$amountBDT' } } },
      ]),
      Subscription.countDocuments({ status: 'active', endDate: { $gt: new Date() } }),
      Subscription.countDocuments({ status: 'cancelled' }),
      User.countDocuments({ isPremium: true }),
    ]);

    return NextResponse.json({
      payments,
      subscriptions,
      premiumUsers,
      pagination: { page, limit },
      summary: {
        totalRevenueBDT: totalRevenue[0]?.total ?? 0,
        refundedRevenueBDT: refundedRevenue[0]?.total ?? 0,
        activeSubscriptions,
        cancelledSubscriptions,
        premiumUserCount,
      },
    });
  } catch (error) {
    console.error('[ADMIN FINANCE ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
