// src/app/api/subscription/route.ts
// GET /api/subscription - returns the current user's active premium access state.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Subscription } from '@/models/Subscription';
import { Payment } from '@/models/Payment';
import { syncPremiumStatus } from '@/lib/premium';

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    await syncPremiumStatus(session.user.id);

    const subscription = await Subscription.findOne({
      userId: session.user.id,
      status: { $in: ['active', 'cancelled'] },
      endDate: { $gt: new Date() },
    })
      .sort({ endDate: -1 })
      .lean();

    if (!subscription) {
      return NextResponse.json({ subscription: null, payments: [] });
    }

    const payments = await Payment.find({
      userId: session.user.id,
      type: 'subscription',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('-bkashPaymentId -bkashTrxId -stripePaymentIntentId')
      .lean();

    const daysLeft = Math.ceil(
      (new Date(subscription.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    );

    return NextResponse.json({
      subscription: {
        ...subscription,
        daysLeft,
        isExpiringSoon: daysLeft <= 7,
      },
      payments,
    });
  } catch (error) {
    console.error('[GET SUBSCRIPTION ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch subscription' }, { status: 500 });
  }
}
