// src/app/api/payment/stripe/create-intent/route.ts
// POST /api/payment/stripe/create-intent
// Creates a Stripe PaymentIntent for Visa/Mastercard premium subscription payment.
// The client secret is sent to the frontend and used with Stripe.js to complete payment.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';
import { createStripePaymentIntent } from '@/lib/stripe';
import { PLANS } from '@/lib/subscription-plans';
import { z } from 'zod';

const Schema = z.object({
  plan: z.enum(['student_premium', 'employer_premium']),
  method: z.enum(['visa', 'mastercard']),
});

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = Schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid payment request' }, { status: 400 });
    }

    const plan = PLANS[parsed.data.plan];
    if (!plan) {
      return NextResponse.json({ error: 'Plan not found' }, { status: 404 });
    }

    const roleOk =
      (session.user.role === 'student' && plan.id === 'student_premium') ||
      (session.user.role === 'employer' && plan.id === 'employer_premium');

    if (!roleOk) {
      return NextResponse.json({ error: 'Plan not available for your role' }, { status: 400 });
    }

    await connectDB();

    const existing = await Subscription.findOne({
      userId: session.user.id,
      status: 'active',
      endDate: { $gt: new Date() },
    });

    if (existing) {
      return NextResponse.json({ error: 'Already subscribed' }, { status: 409 });
    }

    const intent = await createStripePaymentIntent({
      amountBDT: plan.price,
      description: `Nextern ${plan.name} - 30 days`,
      metadata: {
        userId: session.user.id,
        plan: plan.id,
        userEmail: session.user.email ?? '',
        method: parsed.data.method,
      },
    });

    await Payment.create({
      userId: session.user.id,
      type: 'subscription',
      amountBDT: plan.price,
      method: parsed.data.method,
      status: 'initiated',
      stripePaymentIntentId: intent.id,
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: plan.price,
      planName: plan.name,
      method: parsed.data.method,
    });
  } catch (error) {
    console.error('[STRIPE CREATE INTENT ERROR]', error);
    return NextResponse.json(
      {
        error: 'Failed to initiate payment. Please try again.',
        details:
          process.env.NODE_ENV === 'development'
            ? error instanceof Error
              ? error.message
              : 'Unknown Stripe error'
            : undefined,
      },
      { status: 500 }
    );
  }
}
