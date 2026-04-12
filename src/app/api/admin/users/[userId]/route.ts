import mongoose from 'mongoose';
import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { requireAdminSession } from '@/lib/admin';
import { AdminUserUpdateSchema } from '@/lib/validations';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Payment } from '@/models/Payment';
import { Subscription } from '@/models/Subscription';
import { Notification } from '@/models/Notification';
import { FeatureUsage } from '@/models/FeatureUsage';
import { BadgeAward } from '@/models/BadgeAward';
import { OpportunityScoreHistory } from '@/models/OpportunityScoreHistory';
import { GER } from '@/models/GER';
import { JobView } from '@/models/JobView';
import { Message } from '@/models/Message';
import { Review } from '@/models/Review';
import { AdvisorAction } from '@/models/AdvisorAction';
import { MockInterviewSession } from '@/models/MockInterviewSession';
import { Mentor } from '@/models/Mentor';
import { MentorSession } from '@/models/MentorSession';
import { FreelanceListing } from '@/models/FreelanceListing';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { Assessment } from '@/models/Assessment';
import { AssessmentSubmission } from '@/models/AssessmentSubmission';
import { onProfileVerified } from '@/lib/events';

type Params = { params: Promise<{ userId: string }> };

function normalizeOptionalString(value: string | null | undefined) {
  if (!value) return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : '';
}

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const [
      jobsOwned,
      applicationsAsStudent,
      applicationsManaged,
      payments,
      subscriptions,
      unreadNotifications,
    ] = await Promise.all([
      Job.countDocuments({ employerId: userId }),
      Application.countDocuments({ studentId: userId }),
      Application.countDocuments({ employerId: userId }),
      Payment.countDocuments({ userId }),
      Subscription.countDocuments({ userId }),
      Notification.countDocuments({ userId, isRead: false }),
    ]);

    return NextResponse.json({
      user,
      relatedCounts: {
        jobsOwned,
        applicationsAsStudent,
        applicationsManaged,
        payments,
        subscriptions,
        unreadNotifications,
      },
    });
  } catch (error) {
    console.error('[ADMIN USER DETAIL ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch user details' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = AdminUserUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const existingUser = await User.findById(userId);
    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const data = parsed.data;
    const updates: Record<string, unknown> = {};

    const plainAssignments = [
      'name',
      'phone',
      'role',
      'image',
      'isVerified',
      'isPremium',
      'verificationStatus',
      'university',
      'department',
      'yearOfStudy',
      'currentSemester',
      'cgpa',
      'studentId',
      'completedCourses',
      'skills',
      'companyName',
      'industry',
      'companySize',
      'tradeLicenseNo',
      'institutionName',
      'advisorStaffId',
      'designation',
      'advisoryDepartment',
    ] as const;

    for (const field of plainAssignments) {
      if (field in data) {
        updates[field] = data[field];
      }
    }

    if ('email' in data && data.email) {
      updates.email = data.email.trim().toLowerCase();
    }

    const optionalStringAssignments = {
      bio: normalizeOptionalString(data.bio),
      city: normalizeOptionalString(data.city),
      companyWebsite: normalizeOptionalString(data.companyWebsite),
      companyDescription: normalizeOptionalString(data.companyDescription),
      headquartersCity: normalizeOptionalString(data.headquartersCity),
      verificationNote: normalizeOptionalString(data.verificationNote),
    };

    for (const [field, value] of Object.entries(optionalStringAssignments)) {
      if (field in data) {
        updates[field] = value ?? '';
      }
    }

    if ('premiumExpiresAt' in data) {
      updates.premiumExpiresAt = data.premiumExpiresAt ? new Date(data.premiumExpiresAt) : null;
    } else if (data.isPremium === false) {
      updates.premiumExpiresAt = null;
    }

    const effectiveRole = (data.role ?? existingUser.role) as string;
    if (
      'verificationStatus' in data &&
      (effectiveRole === 'advisor' || effectiveRole === 'dept_head')
    ) {
      updates.approvalStatus = data.verificationStatus;
    }

    const updated = await User.findByIdAndUpdate(
      userId,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-password');

    if (data.verificationStatus === 'approved') {
      await onProfileVerified(userId).catch(console.error);
    }

    return NextResponse.json({
      message: 'User updated successfully.',
      user: updated,
    });
  } catch (error) {
    console.error('[ADMIN USER UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 });
  }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  try {
    const session = await requireAdminSession();
    if (!session) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { userId } = await params;
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json({ error: 'Invalid user ID' }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).select('role name');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const mentorDocs = await Mentor.find({ userId }).select('_id').lean();
    const mentorIds = mentorDocs.map((item) => item._id);

    const ownedJobs = await Job.find({ employerId: userId }).select('_id').lean();
    const ownedJobIds = ownedJobs.map((item) => item._id);

    const relatedApplications = await Application.find({
      $or: [{ studentId: userId }, { employerId: userId }, { jobId: { $in: ownedJobIds } }],
    })
      .select('_id')
      .lean();
    const applicationIds = relatedApplications.map((item) => item._id);

    const ownedAssessments = await Assessment.find({
      $or: [{ employerId: userId }, { jobId: { $in: ownedJobIds } }],
    })
      .select('_id')
      .lean();
    const assessmentIds = ownedAssessments.map((item) => item._id);

    const ownedListings = await FreelanceListing.find({ studentId: userId }).select('_id').lean();
    const listingIds = ownedListings.map((item) => item._id);

    await Promise.all([
      Notification.deleteMany({ userId }),
      Payment.deleteMany({ userId }),
      Subscription.deleteMany({ userId }),
      FeatureUsage.deleteMany({ userId }),
      BadgeAward.deleteMany({ userId }),
      OpportunityScoreHistory.deleteMany({ userId }),
      GER.deleteMany({ studentId: userId }),
      JobView.deleteMany({
        $or: [{ studentId: userId }, { jobId: { $in: ownedJobIds } }],
      }),
      Message.deleteMany({
        $or: [{ senderId: userId }, { receiverId: userId }, { relatedJobId: { $in: ownedJobIds } }],
      }),
      Review.deleteMany({
        $or: [
          { reviewerId: userId },
          { revieweeId: userId },
          { applicationId: { $in: applicationIds } },
        ],
      }),
      AdvisorAction.deleteMany({
        $or: [{ advisorId: userId }, { studentId: userId }],
      }),
      MockInterviewSession.deleteMany({ studentId: userId }),
      MentorSession.deleteMany({
        $or: [{ studentId: userId }, { mentorId: { $in: mentorIds } }],
      }),
      Mentor.deleteMany({ userId }),
      FreelanceOrder.deleteMany({
        $or: [{ listingId: { $in: listingIds } }, { freelancerId: userId }, { clientId: userId }],
      }),
      FreelanceListing.deleteMany({ studentId: userId }),
      AssessmentSubmission.deleteMany({
        $or: [
          { studentId: userId },
          { applicationId: { $in: applicationIds } },
          { assessmentId: { $in: assessmentIds } },
        ],
      }),
      Assessment.deleteMany({
        $or: [{ employerId: userId }, { jobId: { $in: ownedJobIds } }],
      }),
      Application.deleteMany({
        $or: [{ studentId: userId }, { employerId: userId }, { jobId: { $in: ownedJobIds } }],
      }),
      Job.deleteMany({ employerId: userId }),
      User.deleteOne({ _id: userId }),
    ]);

    return NextResponse.json({
      message: `Deleted ${user.name}'s account and related platform records.`,
      userId,
    });
  } catch (error) {
    console.error('[ADMIN USER DELETE ERROR]', error);
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 });
  }
}
