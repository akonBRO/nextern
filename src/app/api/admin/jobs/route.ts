import mongoose, { type SortOrder } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import {
  buildSearchRegex,
  parseBooleanParam,
  parsePagination,
  requireAdminSession,
} from '@/lib/admin';

function getSort(sort: string | null): Record<string, SortOrder> {
  switch (sort) {
    case 'deadline':
      return { applicationDeadline: 1 as SortOrder, createdAt: -1 as SortOrder };
    case 'applications':
      return { applicationCount: -1 as SortOrder, createdAt: -1 as SortOrder };
    case 'views':
      return { viewCount: -1 as SortOrder, createdAt: -1 as SortOrder };
    case 'premium':
      return { isPremiumListing: -1 as SortOrder, createdAt: -1 as SortOrder };
    case 'oldest':
      return { createdAt: 1 as SortOrder };
    default:
      return { createdAt: -1 as SortOrder };
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get('type');
    const active = parseBooleanParam(searchParams.get('active'));
    const premium = parseBooleanParam(searchParams.get('premium'));
    const searchRegex = buildSearchRegex(searchParams.get('search'));
    const employerId = searchParams.get('employerId');
    const deadline = searchParams.get('deadline');
    const { page, limit, skip } = parsePagination(searchParams, {
      defaultLimit: 15,
      maxLimit: 100,
    });

    await connectDB();

    const query: Record<string, unknown> = {};
    if (type && type !== 'all') query.type = type;
    if (typeof active === 'boolean') query.isActive = active;
    if (typeof premium === 'boolean') query.isPremiumListing = premium;
    if (employerId && mongoose.Types.ObjectId.isValid(employerId)) {
      query.employerId = employerId;
    }

    if (deadline === 'upcoming') {
      query.applicationDeadline = { $gte: new Date() };
    } else if (deadline === 'expired') {
      query.applicationDeadline = { $lt: new Date() };
    }

    if (searchRegex) {
      const matchedEmployers = await User.find({
        $or: [{ name: searchRegex }, { email: searchRegex }, { companyName: searchRegex }],
      })
        .select('_id')
        .lean();

      query.$or = [
        { title: searchRegex },
        { companyName: searchRegex },
        { description: searchRegex },
        ...(matchedEmployers.length > 0
          ? [{ employerId: { $in: matchedEmployers.map((item) => item._id) } }]
          : []),
      ];
    }

    const next7Days = new Date();
    next7Days.setDate(next7Days.getDate() + 7);

    const [jobs, total, totalJobs, activeJobs, premiumListings, closingSoon] = await Promise.all([
      Job.find(query)
        .populate('employerId', 'name email companyName role verificationStatus isPremium')
        .sort(getSort(searchParams.get('sort')))
        .skip(skip)
        .limit(limit)
        .lean(),
      Job.countDocuments(query),
      Job.countDocuments(),
      Job.countDocuments({ isActive: true }),
      Job.countDocuments({ isPremiumListing: true }),
      Job.countDocuments({
        isActive: true,
        applicationDeadline: { $gte: new Date(), $lte: next7Days },
      }),
    ]);

    return NextResponse.json({
      jobs,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        totalJobs,
        activeJobs,
        premiumListings,
        closingSoon,
      },
    });
  } catch (error) {
    console.error('[ADMIN JOBS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch jobs' }, { status: 500 });
  }
}
