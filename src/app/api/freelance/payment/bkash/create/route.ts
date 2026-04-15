import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createBkashPayment } from '@/lib/bkash';
import { connectDB } from '@/lib/db';
import { inferFreelanceProposalStatus } from '@/lib/freelance-shared';
import { Payment } from '@/models/Payment';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { z } from 'zod';

const Schema = z.object({
  orderId: z.string().length(24, 'Invalid order ID'),
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
      return NextResponse.json({ error: 'Invalid payment request.' }, { status: 400 });
    }

    await connectDB();

    const order = await FreelanceOrder.findById(parsed.data.orderId).select(
      'clientId agreedPriceBDT paymentMethod status escrowStatus proposalStatus'
    );
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.clientId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (order.paymentMethod !== 'bkash') {
      return NextResponse.json(
        { error: 'This order is not configured for bKash.' },
        { status: 400 }
      );
    }

    if (
      inferFreelanceProposalStatus({
        proposalStatus: order.proposalStatus,
        status: order.status,
      }) !== 'accepted'
    ) {
      return NextResponse.json(
        { error: 'The freelancer quote must be accepted before funding escrow.' },
        { status: 400 }
      );
    }

    if (order.escrowStatus === 'held') {
      return NextResponse.json({ error: 'Escrow is already funded.' }, { status: 409 });
    }

    const payment = await Payment.create({
      userId: order.clientId,
      type: 'freelance_escrow',
      amountBDT: order.agreedPriceBDT,
      method: 'bkash',
      status: 'initiated',
      referenceId: order._id,
      referenceType: 'FreelanceOrder',
    });

    const orderToken = `${order._id.toString()}_${Date.now()}`;
    const callbackUrl = new URL('/api/freelance/payment/bkash/callback', req.url);
    callbackUrl.searchParams.set('paymentDbId', payment._id.toString());
    callbackUrl.searchParams.set('orderId', order._id.toString());
    callbackUrl.searchParams.set('userId', session.user.id);

    const result = await createBkashPayment({
      amount: order.agreedPriceBDT,
      orderId: orderToken,
      intent: 'sale',
      callbackURL: callbackUrl.toString(),
    });

    await Payment.findByIdAndUpdate(payment._id, { bkashPaymentId: result.paymentID });

    return NextResponse.json({
      bkashURL: result.bkashURL,
      paymentID: result.paymentID,
      paymentDbId: payment._id.toString(),
    });
  } catch (error) {
    console.error('[FREELANCE BKASH CREATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to initiate bKash payment.' }, { status: 500 });
  }
}
