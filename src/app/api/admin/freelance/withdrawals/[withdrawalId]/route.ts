import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { createNotification } from '@/lib/notify';
import { requireAdminSession } from '@/lib/admin';
import { AdminFreelanceWithdrawalUpdateSchema } from '@/lib/validations';
import { FreelanceWithdrawal } from '@/models/FreelanceWithdrawal';
import { User } from '@/models/User';

type Params = { params: Promise<{ withdrawalId: string }> };

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { withdrawalId } = await params;
    if (!mongoose.Types.ObjectId.isValid(withdrawalId)) {
      return NextResponse.json({ error: 'Invalid withdrawal ID.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminFreelanceWithdrawalUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const withdrawal = await FreelanceWithdrawal.findById(withdrawalId).lean();
    if (!withdrawal) {
      return NextResponse.json({ error: 'Withdrawal not found.' }, { status: 404 });
    }

    if (withdrawal.status !== 'requested') {
      return NextResponse.json(
        { error: 'Only pending withdrawal requests can be updated.' },
        { status: 400 }
      );
    }

    if (parsed.data.action === 'process') {
      const updated = await FreelanceWithdrawal.findByIdAndUpdate(
        withdrawalId,
        {
          $set: {
            status: 'processed',
            processedAt: new Date(),
            adminNote: parsed.data.adminNote?.trim() ?? '',
          },
        },
        { new: true }
      ).lean();

      await createNotification({
        userId: withdrawal.userId.toString(),
        type: 'payment_received',
        title: 'Withdrawal approved',
        body: `Your freelance withdrawal request for ${withdrawal.amountBDT} BDT has been approved by superadmin.`,
        link: '/student/freelance?view=finance',
        meta: { withdrawalId, amountBDT: withdrawal.amountBDT, status: 'processed' },
      });

      return NextResponse.json({
        message: 'Withdrawal marked as processed.',
        withdrawal: updated,
      });
    }

    const updated = await FreelanceWithdrawal.findByIdAndUpdate(
      withdrawalId,
      {
        $set: {
          status: 'rejected',
          rejectedAt: new Date(),
          adminNote: parsed.data.adminNote?.trim() ?? '',
        },
      },
      { new: true }
    ).lean();

    await User.findByIdAndUpdate(withdrawal.userId, {
      $inc: {
        freelanceAccountBalanceBDT: withdrawal.amountBDT,
        freelanceTotalWithdrawnBDT: -withdrawal.amountBDT,
      },
    });

    await createNotification({
      userId: withdrawal.userId.toString(),
      type: 'freelance_order',
      title: 'Withdrawal returned to account',
      body: `Your freelance withdrawal request for ${withdrawal.amountBDT} BDT was rejected, and the amount has been restored to your freelance account balance.`,
      link: '/student/freelance?view=finance',
      meta: { withdrawalId, amountBDT: withdrawal.amountBDT, status: 'rejected' },
    });

    return NextResponse.json({
      message: 'Withdrawal rejected and balance restored.',
      withdrawal: updated,
    });
  } catch (error) {
    console.error('[ADMIN FREELANCE WITHDRAWAL ERROR]', error);
    return NextResponse.json({ error: 'Failed to update withdrawal.' }, { status: 500 });
  }
}
