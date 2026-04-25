import mongoose from 'mongoose';
import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { buildFreelanceInvoice } from '@/lib/freelance';
import '@/models/FreelanceListing';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { FreelanceWithdrawal } from '@/models/FreelanceWithdrawal';
import { User } from '@/models/User';

function serializeWithdrawal(withdrawal: Record<string, unknown>) {
  return {
    _id: String(withdrawal._id ?? ''),
    amountBDT: Number(withdrawal.amountBDT ?? 0),
    status: String(withdrawal.status ?? 'requested'),
    note: typeof withdrawal.note === 'string' ? withdrawal.note : '',
    adminNote: typeof withdrawal.adminNote === 'string' ? withdrawal.adminNote : '',
    accountBalanceBeforeBDT: Number(withdrawal.accountBalanceBeforeBDT ?? 0),
    accountBalanceAfterBDT: Number(withdrawal.accountBalanceAfterBDT ?? 0),
    createdAt:
      withdrawal.createdAt instanceof Date
        ? withdrawal.createdAt.toISOString()
        : typeof withdrawal.createdAt === 'string'
          ? withdrawal.createdAt
          : null,
    processedAt:
      withdrawal.processedAt instanceof Date
        ? withdrawal.processedAt.toISOString()
        : typeof withdrawal.processedAt === 'string'
          ? withdrawal.processedAt
          : null,
    rejectedAt:
      withdrawal.rejectedAt instanceof Date
        ? withdrawal.rejectedAt.toISOString()
        : typeof withdrawal.rejectedAt === 'string'
          ? withdrawal.rejectedAt
          : null,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const userId = new mongoose.Types.ObjectId(session.user.id);
    const [user, clientOrders, freelancerOrders, withdrawals] = await Promise.all([
      User.findById(userId)
        .select(
          'name companyName freelanceAccountBalanceBDT freelanceTotalEarningsBDT freelanceTotalSpendingsBDT freelanceTotalWithdrawnBDT freelanceTotalPlatformFeesBDT'
        )
        .lean(),
      FreelanceOrder.find({ clientId: userId })
        .populate('listingId', 'title category')
        .populate('clientId', 'name companyName')
        .populate('freelancerId', 'name')
        .sort({ createdAt: -1 })
        .limit(24)
        .lean(),
      FreelanceOrder.find({ freelancerId: userId })
        .populate('listingId', 'title category')
        .populate('clientId', 'name companyName')
        .populate('freelancerId', 'name')
        .sort({ createdAt: -1 })
        .limit(24)
        .lean(),
      FreelanceWithdrawal.find({ userId }).sort({ createdAt: -1 }).limit(24).lean(),
    ]);

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const clientInvoices = clientOrders.map((order) =>
      buildFreelanceInvoice(order as Record<string, unknown>, 'client')
    );
    const freelancerInvoices = freelancerOrders.map((order) =>
      buildFreelanceInvoice(order as Record<string, unknown>, 'freelancer')
    );
    const pendingWithdrawalsBDT = withdrawals
      .filter((withdrawal) => withdrawal.status === 'requested')
      .reduce((sum, withdrawal) => sum + Number(withdrawal.amountBDT ?? 0), 0);

    return NextResponse.json({
      summary: {
        accountBalanceBDT: Number(user.freelanceAccountBalanceBDT ?? 0),
        totalEarningsBDT: Number(user.freelanceTotalEarningsBDT ?? 0),
        totalSpendingsBDT: Number(user.freelanceTotalSpendingsBDT ?? 0),
        totalWithdrawnBDT: Number(user.freelanceTotalWithdrawnBDT ?? 0),
        totalPlatformFeesBDT: Number(user.freelanceTotalPlatformFeesBDT ?? 0),
        pendingWithdrawalsBDT,
        clientInvoiceCount: clientInvoices.length,
        freelancerInvoiceCount: freelancerInvoices.length,
      },
      clientInvoices,
      freelancerInvoices,
      withdrawals: withdrawals.map((withdrawal) =>
        serializeWithdrawal(withdrawal as Record<string, unknown>)
      ),
    });
  } catch (error) {
    console.error('[FREELANCE FINANCE ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch freelance finance data.' }, { status: 500 });
  }
}
