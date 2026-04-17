import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/admin';
import { AdminPaymentUpdateSchema } from '@/lib/validations';
import { Payment } from '@/models/Payment';
import { syncPremiumStatus } from '@/lib/premium';

type Params = { params: Promise<{ paymentId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { paymentId } = await params;
    if (!mongoose.Types.ObjectId.isValid(paymentId)) {
      return NextResponse.json({ error: 'Invalid payment ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminPaymentUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.findByIdAndUpdate(
      paymentId,
      { $set: parsed.data },
      { new: true, runValidators: true }
    )
      .populate('userId', 'name email role isPremium premiumExpiresAt')
      .lean();

    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    if (payment.userId && typeof payment.userId === 'object' && '_id' in payment.userId) {
      await syncPremiumStatus(String(payment.userId._id)).catch(console.error);
    }

    return NextResponse.json({ message: 'Payment updated successfully.', payment });
  } catch (error) {
    console.error('[ADMIN PAYMENT UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update payment' }, { status: 500 });
  }
}
