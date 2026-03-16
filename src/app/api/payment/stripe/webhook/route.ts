// src/app/api/payment/stripe/webhook/route.ts
// POST /api/payment/stripe/webhook
// Stripe calls this when a payment is confirmed (payment_intent.succeeded).
// This is the authoritative place to activate subscriptions for card payments.

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Payment } from '@/models/Payment';
import { verifyStripeWebhookSignature } from '@/lib/stripe';
import { PLANS } from '@/lib/subscription-plans';
import { activateSubscriptionFromPayment } from '@/lib/subscription-service';

export const config = { api: { bodyParser: false } };

export async function POST(req: NextRequest) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') ?? '';

  try {
    const isValid = await verifyStripeWebhookSignature(body, signature);
    if (!isValid) {
      console.error('[STRIPE WEBHOOK] Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }
  } catch (error) {
    console.error('[STRIPE WEBHOOK] Signature check failed', error);
    return NextResponse.json({ error: 'Webhook error' }, { status: 400 });
  }

  let event: { type: string; data: { object: Record<string, unknown> } };
  try {
    event = JSON.parse(body);
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event.type !== 'payment_intent.succeeded') {
    return NextResponse.json({ received: true });
  }

  const intent = event.data.object;
  const intentId = intent.id as string;
  const metadata = (intent.metadata ?? {}) as Record<string, string>;
  const { userId, plan: planId } = metadata;

  if (!userId || !planId) {
    console.error('[STRIPE WEBHOOK] Missing metadata on intent', intentId);
    return NextResponse.json({ error: 'Missing metadata' }, { status: 400 });
  }

  try {
    await connectDB();

    const plan = PLANS[planId as 'student_premium' | 'employer_premium'];
    if (!plan) {
      console.error('[STRIPE WEBHOOK] Unknown plan:', planId);
      return NextResponse.json({ received: true });
    }

    const payment = await Payment.findOne({ stripePaymentIntentId: intentId });
    if (!payment) {
      console.error('[STRIPE WEBHOOK] No payment record found for intent', intentId);
      return NextResponse.json({ received: true });
    }

    const method = metadata.method === 'mastercard' ? 'mastercard' : 'visa';

    await activateSubscriptionFromPayment({
      paymentId: payment._id.toString(),
      userId,
      planId: plan.id,
      method,
      paymentUpdates: {
        stripePaymentIntentId: intentId,
        status: 'success',
      },
    });

    console.log(`[STRIPE WEBHOOK] Subscription activated for user ${userId}, plan ${plan.id}`);
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[STRIPE WEBHOOK ERROR]', error);
    return NextResponse.json({ received: true });
  }
}
