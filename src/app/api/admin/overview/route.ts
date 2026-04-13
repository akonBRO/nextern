import type { PipelineStage } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminSession, fillDateSeries, getSinceDate, parseRangeDays } from '@/lib/admin';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { FeatureUsage } from '@/models/FeatureUsage';

function byDatePipeline(
  field = 'createdAt',
  valueExpression: Record<string, unknown> = { $sum: 1 }
): PipelineStage[] {
  return [
    {
      $group: {
        _id: {
          $dateToString: {
            format: '%Y-%m-%d',
            date: `$${field}`,
          },
        },
        value: valueExpression,
      },
    } as PipelineStage,
    { $sort: { _id: 1 as const } },
  ];
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const rangeDays = parseRangeDays(searchParams.get('range'), 30);
    const since = getSinceDate(rangeDays);
    const last30Days = getSinceDate(30);

    await connectDB();

    const [
      totalUsers,
      totalJobs,
      activeJobs,
      totalApplications,
      activeSubscriptions,
      premiumUsers,
      unreadNotifications,
      flaggedMessages,
      successfulPayments,
      monthlyPayments,
      userRoles,
      applicationStatuses,
      paymentMethods,
      planDistribution,
      verificationQueue,
      userActivity,
      jobActivity,
      applicationActivity,
      revenueActivity,
      featureUsage,
      topUniversities,
      topEmployers,
    ] = await Promise.all([
      User.countDocuments(),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Application.countDocuments(),
      Subscription.countDocuments({ status: 'active', endDate: { $gt: new Date() } }),
      User.countDocuments({ isPremium: true }),
      Notification.countDocuments({ isRead: false }),
      Message.countDocuments({ isFlagged: true }),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'success' } },
        { $group: { _id: null, total: { $sum: '$amountBDT' } } },
      ]),
      Payment.aggregate<{ _id: null; total: number }>([
        { $match: { status: 'success', createdAt: { $gte: last30Days } } },
        { $group: { _id: null, total: { $sum: '$amountBDT' } } },
      ]),
      User.aggregate<{ _id: string; value: number }>([
        { $group: { _id: '$role', value: { $sum: 1 } } },
      ]),
      Application.aggregate<{ _id: string; value: number }>([
        { $group: { _id: '$status', value: { $sum: 1 } } },
      ]),
      Payment.aggregate<{ _id: string; value: number }>([
        { $match: { status: 'success' } },
        { $group: { _id: '$method', value: { $sum: 1 } } },
      ]),
      Subscription.aggregate<{ _id: string; value: number }>([
        { $group: { _id: '$plan', value: { $sum: 1 } } },
      ]),
      User.aggregate<{ _id: string; value: number }>([
        { $match: { verificationStatus: 'pending' } },
        { $group: { _id: '$role', value: { $sum: 1 } } },
      ]),
      User.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: since } } },
        ...byDatePipeline(),
      ]),
      Job.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: since } } },
        ...byDatePipeline(),
      ]),
      Application.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: since } } },
        ...byDatePipeline('createdAt'),
      ]),
      Payment.aggregate<{ _id: string; value: number }>([
        { $match: { status: 'success', createdAt: { $gte: since } } },
        ...byDatePipeline('createdAt', { $sum: '$amountBDT' }),
      ]),
      FeatureUsage.aggregate<{ _id: string; value: number }>([
        { $match: { createdAt: { $gte: since } } },
        { $group: { _id: '$feature', value: { $sum: 1 } } },
        { $sort: { value: -1 } },
        { $limit: 8 },
      ]),
      User.aggregate<{ _id: string; students: number; avgOpportunityScore: number }>([
        {
          $match: {
            role: 'student',
            university: { $exists: true, $nin: ['', null] },
          },
        },
        {
          $group: {
            _id: '$university',
            students: { $sum: 1 },
            avgOpportunityScore: { $avg: '$opportunityScore' },
          },
        },
        { $sort: { students: -1, avgOpportunityScore: -1 } },
        { $limit: 6 },
      ]),
      Job.aggregate<{
        _id: string;
        companyName: string;
        ownerName: string;
        jobs: number;
        totalApplications: number;
        premiumListings: number;
      }>([
        {
          $group: {
            _id: '$employerId',
            jobs: { $sum: 1 },
            totalApplications: { $sum: '$applicationCount' },
            premiumListings: { $sum: { $cond: ['$isPremiumListing', 1, 0] } },
          },
        },
        { $sort: { totalApplications: -1, jobs: -1 } },
        { $limit: 6 },
        {
          $lookup: {
            from: 'users',
            localField: '_id',
            foreignField: '_id',
            as: 'owner',
          },
        },
        {
          $project: {
            _id: 0,
            employerId: '$_id',
            jobs: 1,
            totalApplications: 1,
            premiumListings: 1,
            companyName: {
              $ifNull: [{ $arrayElemAt: ['$owner.companyName', 0] }, 'Unknown company'],
            },
            ownerName: {
              $ifNull: [{ $arrayElemAt: ['$owner.name', 0] }, 'Unknown owner'],
            },
          },
        },
      ]),
    ]);

    return NextResponse.json({
      rangeDays,
      summary: {
        totalUsers,
        totalJobs,
        activeJobs,
        totalApplications,
        activeSubscriptions,
        premiumUsers,
        unreadNotifications,
        flaggedMessages,
        totalRevenueBDT: successfulPayments[0]?.total ?? 0,
        rolling30DayRevenueBDT: monthlyPayments[0]?.total ?? 0,
      },
      breakdowns: {
        userRoles,
        applicationStatuses,
        paymentMethods,
        planDistribution,
        verificationQueue,
        featureUsage,
      },
      activity: {
        users: fillDateSeries(userActivity, rangeDays),
        jobs: fillDateSeries(jobActivity, rangeDays),
        applications: fillDateSeries(applicationActivity, rangeDays),
        revenue: fillDateSeries(revenueActivity, rangeDays),
      },
      highlights: {
        topUniversities,
        topEmployers,
      },
    });
  } catch (error) {
    console.error('[ADMIN OVERVIEW ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch admin overview' }, { status: 500 });
  }
}
