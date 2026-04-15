import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { createNotification } from '@/lib/notify';
import { FreelanceWithdrawalCreateSchema } from '@/lib/validations';
import { FreelanceWithdrawal } from '@/models/FreelanceWithdrawal';
import { User } from '@/models/User';

function serializeWithdrawal(withdrawal: {
  _id: { toString(): string };
  amountBDT: number;
  status: string;
  note?: string;
  adminNote?: string;
  accountBalanceBeforeBDT: number;
  accountBalanceAfterBDT: number;
  createdAt?: Date;
  processedAt?: Date;
  rejectedAt?: Date;
}) {
  return {
    _id: withdrawal._id.toString(),
    amountBDT: withdrawal.amountBDT,
    status: withdrawal.status,
    note: withdrawal.note ?? '',
    adminNote: withdrawal.adminNote ?? '',
    accountBalanceBeforeBDT: withdrawal.accountBalanceBeforeBDT,
    accountBalanceAfterBDT: withdrawal.accountBalanceAfterBDT,
    createdAt: withdrawal.createdAt?.toISOString?.() ?? null,
    processedAt: withdrawal.processedAt?.toISOString?.() ?? null,
    rejectedAt: withdrawal.rejectedAt?.toISOString?.() ?? null,
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = FreelanceWithdrawalCreateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(session.user.id).select(
      'name freelanceAccountBalanceBDT freelanceTotalWithdrawnBDT'
    );
    if (!user) {
      return NextResponse.json({ error: 'User not found.' }, { status: 404 });
    }

    const balance = Number(user.freelanceAccountBalanceBDT ?? 0);
    const amountBDT = Number(parsed.data.amountBDT ?? 0);

    if (amountBDT > balance) {
      return NextResponse.json(
        { error: 'Withdrawal amount exceeds your available freelance account balance.' },
        { status: 400 }
      );
    }

    const nextBalance = balance - amountBDT;

    const withdrawal = await FreelanceWithdrawal.create({
      userId: user._id,
      amountBDT,
      status: 'requested',
      note: parsed.data.note?.trim() ?? '',
      accountBalanceBeforeBDT: balance,
      accountBalanceAfterBDT: nextBalance,
    });

    await User.findByIdAndUpdate(user._id, {
      $inc: {
        freelanceAccountBalanceBDT: -amountBDT,
        freelanceTotalWithdrawnBDT: amountBDT,
      },
    });

    await createNotification({
      userId: user._id.toString(),
      type: 'payment_received',
      title: 'Withdrawal request submitted',
      body: `Your request to withdraw ${amountBDT} BDT from your freelance account was submitted for superadmin review.`,
      link: '/student/freelance?view=finance',
      meta: { withdrawalId: withdrawal._id.toString(), amountBDT, status: 'requested' },
    });

    return NextResponse.json(
      {
        message: 'Withdrawal request submitted successfully.',
        withdrawal: serializeWithdrawal(withdrawal),
        summary: {
          accountBalanceBDT: nextBalance,
          totalWithdrawnBDT: Number(user.freelanceTotalWithdrawnBDT ?? 0) + amountBDT,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('[FREELANCE WITHDRAWAL CREATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to create withdrawal request.' }, { status: 500 });
  }
}
