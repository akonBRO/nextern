import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/admin';
import { AdminSubscriptionUpdateSchema } from '@/lib/validations';
import { Subscription } from '@/models/Subscription';
import { syncPremiumStatus } from '@/lib/premium';

type Params = { params: Promise<{ subscriptionId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { subscriptionId } = await params;
    if (!mongoose.Types.ObjectId.isValid(subscriptionId)) {
      return NextResponse.json({ error: 'Invalid subscription ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminSubscriptionUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const updates: Record<string, unknown> = { ...parsed.data };
    if ('endDate' in parsed.data) {
      updates.endDate = parsed.data.endDate ? new Date(parsed.data.endDate) : null;
    }

    const subscription = await Subscription.findByIdAndUpdate(
      subscriptionId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email role isPremium premiumExpiresAt')
      .populate('paymentId', 'status amountBDT method')
      .lean();

    if (!subscription) {
      return NextResponse.json({ error: 'Subscription not found' }, { status: 404 });
    }

    const userId =
      subscription.userId && typeof subscription.userId === 'object' && '_id' in subscription.userId
        ? String(subscription.userId._id)
        : typeof subscription.userId === 'string'
          ? subscription.userId
          : null;

    if (userId) {
      await syncPremiumStatus(userId).catch(console.error);
    }

    return NextResponse.json({
      message: 'Subscription updated successfully.',
      subscription,
    });
  } catch (error) {
    console.error('[ADMIN SUBSCRIPTION UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update subscription' }, { status: 500 });
  }
}
