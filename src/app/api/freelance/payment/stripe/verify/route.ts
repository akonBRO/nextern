import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { activateFreelanceEscrowFromPayment } from '@/lib/freelance';
import { retrieveStripePaymentIntent } from '@/lib/stripe';
import { Payment } from '@/models/Payment';

export async function GET(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const paymentIntentId = searchParams.get('paymentIntentId');

    if (!paymentIntentId) {
      return NextResponse.json({ error: 'Missing payment intent ID.' }, { status: 400 });
    }

    await connectDB();

    const payment = await Payment.findOne({
      stripePaymentIntentId: paymentIntentId,
      userId: session.user.id,
      type: 'freelance_escrow',
    });

    if (!payment) {
      return NextResponse.json({ error: 'Payment record not found.' }, { status: 404 });
    }

    const intent = await retrieveStripePaymentIntent(paymentIntentId);
    const orderId = intent.metadata?.orderId;
    const intentUserId = intent.metadata?.userId;
    const method = intent.metadata?.method === 'mastercard' ? 'mastercard' : 'visa';

    if (!orderId || intentUserId !== session.user.id) {
      return NextResponse.json({ error: 'Payment metadata mismatch.' }, { status: 400 });
    }

    if (intent.status !== 'succeeded') {
      return NextResponse.json({
        status: intent.status,
        message: 'Payment is still processing.',
      });
    }

    const order = await activateFreelanceEscrowFromPayment({
      orderId,
      paymentId: payment._id.toString(),
      method,
      paymentUpdates: {
        stripePaymentIntentId: paymentIntentId,
      },
    });

    return NextResponse.json({ status: 'succeeded', order });
  } catch (error) {
    console.error('[FREELANCE STRIPE VERIFY ERROR]', error);
    return NextResponse.json({ error: 'Failed to verify card payment.' }, { status: 500 });
  }
}
