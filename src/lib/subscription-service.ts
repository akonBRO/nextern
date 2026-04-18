import { connectDB } from '@/lib/db';
import { PLANS, type PlanId } from '@/lib/subscription-plans';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';
import { User } from '@/models/User';

type PaymentMethod = 'bkash' | 'visa' | 'mastercard';

export async function activateSubscriptionFromPayment(params: {
  paymentId: string;
  userId: string;
  planId: PlanId;
  method: PaymentMethod;
  paymentUpdates?: Record<string, unknown>;
}) {
  await connectDB();

  const plan = PLANS[params.planId];
  if (!plan) {
    throw new Error('Invalid subscription plan');
  }

  const payment = await Payment.findById(params.paymentId);
  if (!payment) {
    throw new Error('Payment not found');
  }

  if (payment.referenceType === 'Subscription' && payment.referenceId) {
    const existingSubscription = await Subscription.findById(payment.referenceId);
    if (existingSubscription) {
      return existingSubscription;
    }
  }

  const existingSubscription = await Subscription.findOne({
    userId: params.userId,
    status: { $in: ['active', 'cancelled'] },
    endDate: { $gt: new Date() },
  })
    .sort({ endDate: -1 })
    .lean();

  if (existingSubscription) {
    await Payment.findByIdAndUpdate(payment._id, {
      status: 'success',
      method: params.method,
      ...params.paymentUpdates,
      referenceId: existingSubscription._id,
      referenceType: 'Subscription',
    });

    await User.findByIdAndUpdate(params.userId, {
      isPremium: true,
      premiumExpiresAt: existingSubscription.endDate,
      premiumOverride: null,
    });

    return existingSubscription;
  }

  const now = new Date();
  const endDate = new Date(now.getTime() + plan.durationDays * 24 * 60 * 60 * 1000);

  const subscription = await Subscription.create({
    userId: params.userId,
    plan: plan.id,
    status: 'active',
    startDate: now,
    endDate,
    amountBDT: plan.price,
    paymentMethod: params.method,
    paymentId: payment._id,
    autoRenew: false,
  });

  await Payment.findByIdAndUpdate(payment._id, {
    status: 'success',
    method: params.method,
    ...params.paymentUpdates,
    referenceId: subscription._id,
    referenceType: 'Subscription',
  });

  await User.findByIdAndUpdate(params.userId, {
    isPremium: true,
    premiumExpiresAt: endDate,
    premiumOverride: null,
  });

  return subscription;
}
