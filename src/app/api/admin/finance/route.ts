import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import {
  buildSearchRegex,
  parseBooleanParam,
  parsePagination,
  requireAdminSession,
} from '@/lib/admin';
import { VERIFIED_FREELANCER_BADGE_SLUG } from '@/lib/freelance';
import { inferFreelanceProposalStatus } from '@/lib/freelance-shared';
import { BadgeAward } from '@/models/BadgeAward';
import { User } from '@/models/User';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';
import { FreelanceListing } from '@/models/FreelanceListing';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { FreelanceWithdrawal } from '@/models/FreelanceWithdrawal';

function serializeFreelanceOrder(order: Record<string, unknown>) {
  const listing =
    order.listingId && typeof order.listingId === 'object'
      ? (order.listingId as Record<string, unknown>)
      : { _id: order.listingId };
  const client =
    order.clientId && typeof order.clientId === 'object'
      ? (order.clientId as Record<string, unknown>)
      : { _id: order.clientId };
  const freelancer =
    order.freelancerId && typeof order.freelancerId === 'object'
      ? (order.freelancerId as Record<string, unknown>)
      : { _id: order.freelancerId };

  return {
    _id: String(order._id ?? ''),
    status: String(order.status ?? ''),
    escrowStatus: String(order.escrowStatus ?? ''),
    proposalStatus: inferFreelanceProposalStatus({
      proposalStatus: typeof order.proposalStatus === 'string' ? order.proposalStatus : undefined,
      status: typeof order.status === 'string' ? order.status : undefined,
    }),
    latestOfferBy: typeof order.latestOfferBy === 'string' ? order.latestOfferBy : 'client',
    priceType: typeof order.priceType === 'string' ? order.priceType : 'fixed',
    listedPriceBDT: Number(order.listedPriceBDT ?? 0),
    quotedRateBDT: Number(order.quotedRateBDT ?? order.agreedPriceBDT ?? 0),
    quotedHours: typeof order.quotedHours === 'number' ? order.quotedHours : null,
    agreedPriceBDT: Number(order.agreedPriceBDT ?? 0),
    nexternCutBDT: Number(order.nexternCutBDT ?? 0),
    freelancerPayoutBDT: Number(order.freelancerPayoutBDT ?? 0),
    paymentMethod: (order.paymentMethod as string | null | undefined) ?? null,
    revisionCount: Number(order.revisionCount ?? 0),
    adminNote: String(order.adminNote ?? ''),
    dueDate:
      order.dueDate instanceof Date
        ? order.dueDate.toISOString()
        : typeof order.dueDate === 'string'
          ? order.dueDate
          : null,
    createdAt:
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : typeof order.createdAt === 'string'
          ? order.createdAt
          : null,
    listing: {
      _id: String(listing._id ?? ''),
      title: String(listing.title ?? 'Freelance service'),
      category: String(listing.category ?? 'other'),
    },
    client: {
      _id: String(client._id ?? ''),
      name: String(client.name ?? 'Client'),
      email: typeof client.email === 'string' ? client.email : null,
      role: typeof client.role === 'string' ? client.role : null,
      companyName: typeof client.companyName === 'string' ? client.companyName : null,
    },
    freelancer: {
      _id: String(freelancer._id ?? ''),
      name: String(freelancer.name ?? 'Freelancer'),
      email: typeof freelancer.email === 'string' ? freelancer.email : null,
      university: typeof freelancer.university === 'string' ? freelancer.university : null,
      department: typeof freelancer.department === 'string' ? freelancer.department : null,
    },
  };
}

function serializeFreelanceAccount(user: Record<string, unknown>) {
  return {
    _id: String(user._id ?? ''),
    name: String(user.name ?? 'User'),
    email: typeof user.email === 'string' ? user.email : null,
    role: typeof user.role === 'string' ? user.role : null,
    companyName: typeof user.companyName === 'string' ? user.companyName : null,
    university: typeof user.university === 'string' ? user.university : null,
    department: typeof user.department === 'string' ? user.department : null,
    freelanceAccountBalanceBDT: Number(user.freelanceAccountBalanceBDT ?? 0),
    freelanceTotalEarningsBDT: Number(user.freelanceTotalEarningsBDT ?? 0),
    freelanceTotalSpendingsBDT: Number(user.freelanceTotalSpendingsBDT ?? 0),
    freelanceTotalWithdrawnBDT: Number(user.freelanceTotalWithdrawnBDT ?? 0),
    freelanceTotalPlatformFeesBDT: Number(user.freelanceTotalPlatformFeesBDT ?? 0),
  };
}

function serializeFreelanceWithdrawal(withdrawal: Record<string, unknown>) {
  const user =
    withdrawal.userId && typeof withdrawal.userId === 'object'
      ? (withdrawal.userId as Record<string, unknown>)
      : { _id: withdrawal.userId };

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
    user: {
      _id: String(user._id ?? ''),
      name: String(user.name ?? 'User'),
      email: typeof user.email === 'string' ? user.email : null,
      role: typeof user.role === 'string' ? user.role : null,
      companyName: typeof user.companyName === 'string' ? user.companyName : null,
      university: typeof user.university === 'string' ? user.university : null,
    },
  };
}

function serializeFreelanceListing(listing: Record<string, unknown>) {
  const student =
    listing.studentId && typeof listing.studentId === 'object'
      ? (listing.studentId as Record<string, unknown>)
      : { _id: listing.studentId };

  return {
    _id: String(listing._id ?? ''),
    title: String(listing.title ?? 'Freelance service'),
    category: String(listing.category ?? 'other'),
    isActive: Boolean(listing.isActive),
    priceBDT: Number(listing.priceBDT ?? 0),
    deliveryDays: Number(listing.deliveryDays ?? 0),
    averageRating: Number(listing.averageRating ?? 0),
    totalOrdersCompleted: Number(listing.totalOrdersCompleted ?? 0),
    createdAt:
      listing.createdAt instanceof Date
        ? listing.createdAt.toISOString()
        : typeof listing.createdAt === 'string'
          ? listing.createdAt
          : null,
    student: {
      _id: String(student._id ?? ''),
      name: String(student.name ?? 'Student'),
      university: typeof student.university === 'string' ? student.university : null,
      department: typeof student.department === 'string' ? student.department : null,
    },
  };
}

function aggregateTotal(match: Record<string, unknown>) {
  return Payment.aggregate<{ _id: null; total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amountBDT' } } },
  ]);
}

function aggregateFreelanceOrderTotal(match: Record<string, unknown>, field = 'agreedPriceBDT') {
  return FreelanceOrder.aggregate<{ _id: null; total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
}

function aggregateUserFieldTotal(match: Record<string, unknown>, field: string) {
  return User.aggregate<{ _id: null; total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: `$${field}` } } },
  ]);
}

function aggregateWithdrawalTotal(match: Record<string, unknown>) {
  return FreelanceWithdrawal.aggregate<{ _id: null; total: number }>([
    { $match: match },
    { $group: { _id: null, total: { $sum: '$amountBDT' } } },
  ]);
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const searchText = (searchParams.get('search') ?? '').trim();
    const searchRegex = buildSearchRegex(searchText);
    const searchObjectId =
      searchText && mongoose.Types.ObjectId.isValid(searchText)
        ? new mongoose.Types.ObjectId(searchText)
        : null;

    const paymentStatus = searchParams.get('paymentStatus');
    const method = searchParams.get('method');
    const type = searchParams.get('type');
    const subscriptionStatus = searchParams.get('subscriptionStatus');
    const plan = searchParams.get('plan');
    const premiumOnly = parseBooleanParam(searchParams.get('premiumOnly'));
    const { page, limit, skip } = parsePagination(searchParams, {
      defaultLimit: 10,
      maxLimit: 50,
    });

    await connectDB();

    let matchedUserIds: unknown[] = [];
    let matchedListingIds: unknown[] = [];

    if (searchRegex) {
      const [matchedUsers, matchedListings] = await Promise.all([
        User.find({
          $or: [
            { name: searchRegex },
            { email: searchRegex },
            { companyName: searchRegex },
            { university: searchRegex },
          ],
        })
          .select('_id')
          .lean(),
        FreelanceListing.find({
          $or: [{ title: searchRegex }, { description: searchRegex }, { skills: searchRegex }],
        })
          .select('_id')
          .lean(),
      ]);

      matchedUserIds = matchedUsers.map((item) => item._id);
      matchedListingIds = matchedListings.map((item) => item._id);
    }

    const paymentQuery: Record<string, unknown> = {};
    const subscriptionQuery: Record<string, unknown> = {};
    const premiumUserQuery: Record<string, unknown> = { isPremium: true };
    const freelanceOrderQuery: Record<string, unknown> = {};
    const freelanceListingQuery: Record<string, unknown> = {};
    const freelanceAccountQuery: Record<string, unknown> = {
      $or: [
        { freelanceAccountBalanceBDT: { $gt: 0 } },
        { freelanceTotalEarningsBDT: { $gt: 0 } },
        { freelanceTotalSpendingsBDT: { $gt: 0 } },
        { freelanceTotalWithdrawnBDT: { $gt: 0 } },
      ],
    };
    const freelanceWithdrawalQuery: Record<string, unknown> = {};

    if (paymentStatus && paymentStatus !== 'all') paymentQuery.status = paymentStatus;
    if (method && method !== 'all') {
      paymentQuery.method = method;
      freelanceOrderQuery.paymentMethod = method;
    }
    if (type && type !== 'all') paymentQuery.type = type;
    if (subscriptionStatus && subscriptionStatus !== 'all') {
      subscriptionQuery.status = subscriptionStatus;
    }
    if (plan && plan !== 'all') subscriptionQuery.plan = plan;
    if (typeof premiumOnly === 'boolean') {
      premiumUserQuery.isPremium = premiumOnly;
    }

    if (searchRegex) {
      paymentQuery.$or = [
        { bkashPaymentId: searchRegex },
        { bkashTrxId: searchRegex },
        { stripePaymentIntentId: searchRegex },
        ...(searchObjectId ? [{ _id: searchObjectId }, { referenceId: searchObjectId }] : []),
        ...(matchedUserIds.length > 0 ? [{ userId: { $in: matchedUserIds } }] : []),
      ];

      if (matchedUserIds.length > 0) {
        subscriptionQuery.userId = { $in: matchedUserIds };
        premiumUserQuery.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { companyName: searchRegex },
          { university: searchRegex },
        ];
      } else {
        subscriptionQuery.userId = { $in: [] };
        premiumUserQuery.$or = [
          { name: searchRegex },
          { email: searchRegex },
          { companyName: searchRegex },
          { university: searchRegex },
        ];
      }

      const orderSearchClauses = [
        ...(searchObjectId ? [{ _id: searchObjectId }] : []),
        ...(matchedUserIds.length > 0
          ? [{ clientId: { $in: matchedUserIds } }, { freelancerId: { $in: matchedUserIds } }]
          : []),
        ...(matchedListingIds.length > 0 ? [{ listingId: { $in: matchedListingIds } }] : []),
      ];

      if (orderSearchClauses.length > 0) {
        freelanceOrderQuery.$or = orderSearchClauses;
      } else {
        freelanceOrderQuery._id = { $in: [] };
      }

      freelanceListingQuery.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { skills: searchRegex },
        ...(searchObjectId ? [{ _id: searchObjectId }] : []),
        ...(matchedUserIds.length > 0 ? [{ studentId: { $in: matchedUserIds } }] : []),
      ];

      if (matchedUserIds.length > 0) {
        freelanceAccountQuery.$and = [
          {
            $or: [
              { name: searchRegex },
              { email: searchRegex },
              { companyName: searchRegex },
              { university: searchRegex },
            ],
          },
        ];
        freelanceWithdrawalQuery.userId = { $in: matchedUserIds };
      } else {
        freelanceAccountQuery.$and = [
          {
            $or: [
              { name: searchRegex },
              { email: searchRegex },
              { companyName: searchRegex },
              { university: searchRegex },
            ],
          },
        ];
        freelanceWithdrawalQuery.userId = { $in: [] };
      }
    }

    if (!searchRegex) {
      freelanceWithdrawalQuery.status = { $in: ['requested', 'processed', 'rejected'] };
    }

    const [
      payments,
      subscriptions,
      premiumUsers,
      freelanceOrders,
      freelanceListings,
      freelanceAccounts,
      freelanceWithdrawals,
      totalRevenue,
      refundedRevenue,
      activeSubscriptions,
      cancelledSubscriptions,
      premiumUserCount,
      freelanceGMV,
      freelanceEscrowHeld,
      freelanceReleased,
      freelancePlatformFeesCollected,
      freelanceRefunded,
      freelanceAccountBalances,
      freelanceWithdrawn,
      pendingFreelanceWithdrawals,
      disputedFreelanceOrders,
      activeFreelanceListings,
      verifiedFreelancers,
    ] = await Promise.all([
      Payment.find(paymentQuery)
        .populate('userId', 'name email role companyName university isPremium premiumExpiresAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Subscription.find(subscriptionQuery)
        .populate('userId', 'name email role companyName university isPremium premiumExpiresAt')
        .populate('paymentId', 'status method amountBDT createdAt')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      User.find(premiumUserQuery)
        .select(
          'name email role companyName university isPremium premiumExpiresAt verificationStatus createdAt'
        )
        .sort({ premiumExpiresAt: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      FreelanceOrder.find(freelanceOrderQuery)
        .populate('listingId', 'title category')
        .populate('clientId', 'name email role companyName')
        .populate('freelancerId', 'name email university department')
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      FreelanceListing.find(freelanceListingQuery)
        .populate('studentId', 'name university department')
        .sort({ updatedAt: -1, createdAt: -1 })
        .limit(limit)
        .lean(),
      User.find(freelanceAccountQuery)
        .select(
          'name email role companyName university department freelanceAccountBalanceBDT freelanceTotalEarningsBDT freelanceTotalSpendingsBDT freelanceTotalWithdrawnBDT freelanceTotalPlatformFeesBDT'
        )
        .sort({
          freelanceAccountBalanceBDT: -1,
          freelanceTotalEarningsBDT: -1,
          createdAt: -1,
        })
        .limit(limit)
        .lean(),
      FreelanceWithdrawal.find(freelanceWithdrawalQuery)
        .populate('userId', 'name email role companyName university')
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean(),
      aggregateTotal({ status: 'success', type: 'subscription' }),
      aggregateTotal({ status: 'refunded', type: 'subscription' }),
      Subscription.countDocuments({ status: 'active', endDate: { $gt: new Date() } }),
      Subscription.countDocuments({ status: 'cancelled' }),
      User.countDocuments({ isPremium: true }),
      aggregateTotal({ status: 'success', type: 'freelance_escrow' }),
      aggregateFreelanceOrderTotal({ escrowStatus: 'held' }),
      aggregateFreelanceOrderTotal({ escrowStatus: 'released' }, 'freelancerPayoutBDT'),
      aggregateFreelanceOrderTotal({ escrowStatus: 'released' }, 'nexternCutBDT'),
      aggregateFreelanceOrderTotal({ escrowStatus: 'refunded' }),
      aggregateUserFieldTotal(
        { freelanceAccountBalanceBDT: { $gt: 0 } },
        'freelanceAccountBalanceBDT'
      ),
      aggregateUserFieldTotal(
        { freelanceTotalWithdrawnBDT: { $gt: 0 } },
        'freelanceTotalWithdrawnBDT'
      ),
      aggregateWithdrawalTotal({ status: 'requested' }),
      FreelanceOrder.countDocuments({ status: 'disputed' }),
      FreelanceListing.countDocuments({ isActive: true }),
      BadgeAward.countDocuments({ badgeSlug: VERIFIED_FREELANCER_BADGE_SLUG }),
    ]);

    return NextResponse.json({
      payments,
      subscriptions,
      premiumUsers,
      freelanceOrders: freelanceOrders.map((order) =>
        serializeFreelanceOrder(order as Record<string, unknown>)
      ),
      freelanceListings: freelanceListings.map((listing) =>
        serializeFreelanceListing(listing as Record<string, unknown>)
      ),
      freelanceAccounts: freelanceAccounts.map((user) =>
        serializeFreelanceAccount(user as Record<string, unknown>)
      ),
      freelanceWithdrawals: freelanceWithdrawals.map((withdrawal) =>
        serializeFreelanceWithdrawal(withdrawal as Record<string, unknown>)
      ),
      pagination: { page, limit },
      summary: {
        totalRevenueBDT: totalRevenue[0]?.total ?? 0,
        refundedRevenueBDT: refundedRevenue[0]?.total ?? 0,
        activeSubscriptions,
        cancelledSubscriptions,
        premiumUserCount,
        freelanceGMVBDT: freelanceGMV[0]?.total ?? 0,
        freelanceEscrowHeldBDT: freelanceEscrowHeld[0]?.total ?? 0,
        freelanceReleasedBDT: freelanceReleased[0]?.total ?? 0,
        freelancePlatformFeesCollectedBDT: freelancePlatformFeesCollected[0]?.total ?? 0,
        freelanceRefundedBDT: freelanceRefunded[0]?.total ?? 0,
        freelanceAccountBalancesBDT: freelanceAccountBalances[0]?.total ?? 0,
        freelanceWithdrawnBDT: freelanceWithdrawn[0]?.total ?? 0,
        pendingFreelanceWithdrawalsBDT: pendingFreelanceWithdrawals[0]?.total ?? 0,
        disputedFreelanceOrders,
        activeFreelanceListings,
        verifiedFreelancers,
      },
    });
  } catch (error) {
    console.error('[ADMIN FINANCE ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch finance data' }, { status: 500 });
  }
}
