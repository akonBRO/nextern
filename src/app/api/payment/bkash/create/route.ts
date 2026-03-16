// src/app/api/payment/bkash/create/route.ts
// POST /api/payment/bkash/create
// Initiates a bKash tokenized checkout payment for a premium subscription.
// Returns the bKashURL to redirect the user to.

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';
import { createBkashPayment } from '@/lib/bkash';
import { getPlanByRole } from '@/lib/subscription-plans';
import { z } from 'zod';

const Schema = z.object({
  plan: z.enum(['student_premium', 'employer_premium']),
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
      return NextResponse.json({ error: 'Invalid plan selection' }, { status: 400 });
    }

    const plan = getPlanByRole(session.user.role);
    if (!plan || plan.id !== parsed.data.plan) {
      return NextResponse.json({ error: 'Plan not available for your role' }, { status: 400 });
    }

    await connectDB();

    // Check if already has active subscription
    const existingSub = await Subscription.findOne({
      userId: session.user.id,
      status: 'active',
      endDate: { $gt: new Date() },
    });

    if (existingSub) {
      return NextResponse.json(
        { error: 'You already have an active subscription.' },
        { status: 409 }
      );
    }

    // Create a pending Payment record
    const orderId = `${session.user.id}_${Date.now()}`;
    const payment = await Payment.create({
      userId: session.user.id,
      type: 'subscription',
      amountBDT: plan.price,
      method: 'bkash',
      status: 'initiated',
    });

    // Build callback URL
    const baseUrl = process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const callbackURL = `${baseUrl}/api/payment/bkash/callback?paymentDbId=${payment._id}&userId=${session.user.id}&plan=${plan.id}`;

    // Initiate bKash payment
    const bkashResult = await createBkashPayment({
      amount: plan.price,
      orderId,
      intent: 'sale',
      callbackURL,
    });

    // Store bKash paymentID on the Payment record for later execute step
    await Payment.findByIdAndUpdate(payment._id, {
      bkashPaymentId: bkashResult.paymentID,
    });

    return NextResponse.json({
      bkashURL: bkashResult.bkashURL,
      paymentID: bkashResult.paymentID,
      paymentDbId: payment._id.toString(),
    });
  } catch (error) {
    console.error('[BKASH CREATE ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to initiate bKash payment. Please try again.' },
      { status: 500 }
    );
  }
}
