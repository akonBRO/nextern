import mongoose, { type SortOrder } from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminSession, buildSearchRegex, parsePagination } from '@/lib/admin';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';

function getSort(sort: string | null): Record<string, SortOrder> {
  switch (sort) {
    case 'fit':
      return { fitScore: -1 as SortOrder, appliedAt: -1 as SortOrder };
    case 'updated':
      return { updatedAt: -1 as SortOrder };
    case 'oldest':
      return { appliedAt: 1 as SortOrder };
    default:
      return { appliedAt: -1 as SortOrder };
  }
}

export async function GET(req: NextRequest) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const employerId = searchParams.get('employerId');
    const studentId = searchParams.get('studentId');
    const jobId = searchParams.get('jobId');
    const eventRegistration = searchParams.get('eventRegistration');
    const searchRegex = buildSearchRegex(searchParams.get('search'));
    const { page, limit, skip } = parsePagination(searchParams, {
      defaultLimit: 20,
      maxLimit: 100,
    });

    await connectDB();

    const query: Record<string, unknown> = {};
    if (status && status !== 'all') query.status = status;
    if (employerId && mongoose.Types.ObjectId.isValid(employerId)) query.employerId = employerId;
    if (studentId && mongoose.Types.ObjectId.isValid(studentId)) query.studentId = studentId;
    if (jobId && mongoose.Types.ObjectId.isValid(jobId)) query.jobId = jobId;
    if (eventRegistration === 'true') query.isEventRegistration = true;
    if (eventRegistration === 'false') query.isEventRegistration = false;

    if (searchRegex) {
      const [matchedUsers, matchedJobs] = await Promise.all([
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
        Job.find({ $or: [{ title: searchRegex }, { companyName: searchRegex }] })
          .select('_id')
          .lean(),
      ]);

      const matchedIds = matchedUsers.map((item) => item._id);
      query.$or = [
        ...(matchedIds.length > 0
          ? [{ studentId: { $in: matchedIds } }, { employerId: { $in: matchedIds } }]
          : []),
        ...(matchedJobs.length > 0
          ? [{ jobId: { $in: matchedJobs.map((item) => item._id) } }]
          : []),
      ];
    }

    const [applications, total, summaryCounts, fitStats] = await Promise.all([
      Application.find(query)
        .populate('jobId', 'title type companyName applicationDeadline isActive isPremiumListing')
        .populate(
          'studentId',
          'name email university department opportunityScore cgpa yearOfStudy isPremium'
        )
        .populate('employerId', 'name email companyName role verificationStatus isPremium')
        .sort(getSort(searchParams.get('sort')))
        .skip(skip)
        .limit(limit)
        .lean(),
      Application.countDocuments(query),
      Application.aggregate<{ _id: string; value: number }>([
        { $match: query },
        { $group: { _id: '$status', value: { $sum: 1 } } },
      ]),
      Application.aggregate<{ _id: null; avgFitScore: number }>([
        { $match: { ...query, fitScore: { $ne: null } } },
        { $group: { _id: null, avgFitScore: { $avg: '$fitScore' } } },
      ]),
    ]);

    const counts = Object.fromEntries(summaryCounts.map((item) => [item._id, item.value]));

    return NextResponse.json({
      applications,
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
      summary: {
        total,
        applied: counts.applied ?? 0,
        shortlisted: counts.shortlisted ?? 0,
        interviews: counts.interview_scheduled ?? 0,
        hired: counts.hired ?? 0,
        rejected: counts.rejected ?? 0,
        avgFitScore: Math.round((fitStats[0]?.avgFitScore ?? 0) * 10) / 10,
      },
    });
  } catch (error) {
    console.error('[ADMIN APPLICATIONS ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch applications' }, { status: 500 });
  }
}
