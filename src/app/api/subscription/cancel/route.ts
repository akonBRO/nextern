// src/app/api/subscription/cancel/route.ts
// POST /api/subscription/cancel
// Cancels the user's active subscription. Access remains until endDate.

import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Subscription } from '@/models/Subscription';

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const subscription = await Subscription.findOne({
      userId: session.user.id,
      status: 'active',
      endDate: { $gt: new Date() },
    });

    if (!subscription) {
      return NextResponse.json({ error: 'No active subscription found.' }, { status: 404 });
    }

    await Subscription.findByIdAndUpdate(subscription._id, {
      status: 'cancelled',
      autoRenew: false,
    });

    return NextResponse.json({
      message: 'Subscription cancelled. You keep access until your billing period ends.',
      accessUntil: subscription.endDate,
    });
  } catch (error) {
    console.error('[CANCEL SUBSCRIPTION ERROR]', error);
    return NextResponse.json({ error: 'Failed to cancel subscription.' }, { status: 500 });
  }
}
