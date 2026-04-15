import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { inferFreelanceProposalStatus } from '@/lib/freelance-shared';
import { createStripePaymentIntent } from '@/lib/stripe';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { Payment } from '@/models/Payment';
import { z } from 'zod';

const Schema = z.object({
  orderId: z.string().length(24, 'Invalid order ID'),
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
      return NextResponse.json({ error: 'Invalid payment request.' }, { status: 400 });
    }

    await connectDB();

    const order = await FreelanceOrder.findById(parsed.data.orderId).select(
      'clientId agreedPriceBDT paymentMethod escrowStatus proposalStatus status'
    );
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.clientId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    if (order.paymentMethod !== parsed.data.method) {
      return NextResponse.json(
        { error: 'This order uses a different payment method.' },
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

    const intent = await createStripePaymentIntent({
      amountBDT: order.agreedPriceBDT,
      description: `Nextern freelance escrow - ${order._id.toString()}`,
      metadata: {
        userId: session.user.id,
        orderId: order._id.toString(),
        kind: 'freelance_escrow',
        method: parsed.data.method,
      },
    });

    await Payment.create({
      userId: order.clientId,
      type: 'freelance_escrow',
      amountBDT: order.agreedPriceBDT,
      method: parsed.data.method,
      status: 'initiated',
      stripePaymentIntentId: intent.id,
      referenceId: order._id,
      referenceType: 'FreelanceOrder',
    });

    return NextResponse.json({
      clientSecret: intent.client_secret,
      paymentIntentId: intent.id,
      amount: order.agreedPriceBDT,
      method: parsed.data.method,
    });
  } catch (error) {
    console.error('[FREELANCE STRIPE INTENT ERROR]', error);
    return NextResponse.json({ error: 'Failed to initiate card payment.' }, { status: 500 });
  }
}
