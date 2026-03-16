import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Payment } from '@/models/Payment';
import { retrieveStripePaymentIntent } from '@/lib/stripe';
import { activateSubscriptionFromPayment } from '@/lib/subscription-service';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing payment intent ID' }, { status: 400 });
    }

    await connectDB();

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      userId: session.user.id,
      type: 'subscription',
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found' }, { status: 404 });
    }

    const intent = await retrieveStripePaymentIntent(paymentIntentId);
    const planId = intent.metadata?.plan as 'student_premium' | 'employer_premium' | undefined;
    const intentUserId = intent.metadata?.userId;
    const method = intent.metadata?.method === 'mastercard' ? 'mastercard' : 'visa';

    if (!planId || !intentUserId || intentUserId !== session.user.id) {
      return NextResponse.json({ error: 'Payment metadata mismatch' }, { status: 400 });
    }

    if (intent.status !== 'succeeded') {
      return NextResponse.json({
        status: intent.status,
        message: 'Payment is still processing.',
      });
    }

    const subscription = await activateSubscriptionFromPayment({
      paymentId: payment._id.toString(),
      userId: session.user.id,
      planId,
      method,
      paymentUpdates: {
        stripePaymentIntentId: paymentIntentId,
        status: 'success',
      },
    });

    return NextResponse.json({
      status: 'succeeded',
      subscriptionId: subscription._id.toString(),
      planId,
      method,
    });
  } catch (error) {
    console.error('[STRIPE VERIFY ERROR]', error);
    return NextResponse.json({ error: 'Failed to verify Stripe payment.' }, { status: 500 });
  }
}
