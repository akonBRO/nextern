import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { VERIFIED_FREELANCER_BADGE_SLUG } from '@/lib/freelance';
import { FreelanceListingSchema } from '@/lib/validations';
import { BadgeAward } from '@/models/BadgeAward';
import { FreelanceListing } from '@/models/FreelanceListing';
import { FreelanceReview } from '@/models/FreelanceReview';

type Params = { params: Promise<{ listingId: string }> };

export async function GET(_req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await params;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID.' }, { status: 400 });
    }

    await connectDB();

    const listing = await FreelanceListing.findById(listingId)
      .populate('studentId', 'name image university department skills opportunityScore')
      .lean();

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const ownerId =
      listing.studentId && typeof listing.studentId === 'object'
        ? listing.studentId._id.toString()
        : listing.studentId.toString();

    if (!listing.isActive && ownerId !== session.user.id && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Listing is not available.' }, { status: 404 });
    }

    const [verifiedBadge, reviews] = await Promise.all([
      BadgeAward.findOne({ userId: ownerId, badgeSlug: VERIFIED_FREELANCER_BADGE_SLUG })
        .select('_id')
        .lean(),
      FreelanceReview.find({
        listingId: listing._id,
        reviewType: 'client_to_student',
        isPublic: true,
        isVerified: true,
      })
        .populate('reviewerId', 'name image companyName role')
        .sort({ createdAt: -1 })
        .limit(8)
        .lean(),
    ]);

    return NextResponse.json({
      listing: {
        ...listing,
        _id: listing._id.toString(),
        studentId:
          listing.studentId && typeof listing.studentId === 'object'
            ? {
                ...listing.studentId,
                _id: listing.studentId._id.toString(),
                hasVerifiedFreelancerBadge: Boolean(verifiedBadge),
              }
            : listing.studentId,
      },
      reviews: reviews.map((review) => ({
        _id: review._id.toString(),
        reviewType: review.reviewType,
        comment: review.comment ?? '',
        recommendationText: review.recommendationText ?? '',
        isRecommended: Boolean(review.isRecommended),
        professionalismRating: review.professionalismRating ?? null,
        punctualityRating: review.punctualityRating ?? null,
        skillPerformanceRating: review.skillPerformanceRating ?? null,
        workQualityRating: review.workQualityRating ?? null,
        createdAt: review.createdAt?.toISOString?.() ?? null,
        reviewer:
          review.reviewerId && typeof review.reviewerId === 'object'
            ? {
                _id: review.reviewerId._id.toString(),
                name: review.reviewerId.name,
                image: review.reviewerId.image ?? null,
                companyName: review.reviewerId.companyName ?? null,
                role: review.reviewerId.role,
              }
            : null,
      })),
    });
  } catch (error) {
    console.error('[FREELANCE LISTING DETAIL ERROR]', error);
    return NextResponse.json({ error: 'Failed to fetch freelance listing.' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { listingId } = await params;
    if (!mongoose.Types.ObjectId.isValid(listingId)) {
      return NextResponse.json({ error: 'Invalid listing ID.' }, { status: 400 });
    }

    const body = await req.json();
    const parsed = FreelanceListingSchema.partial().safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const listing = await FreelanceListing.findById(listingId).select('studentId');
    if (!listing) {
      return NextResponse.json({ error: 'Listing not found.' }, { status: 404 });
    }

    const isOwner = listing.studentId.toString() === session.user.id;
    if (!isOwner && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden.' }, { status: 403 });
    }

    const updated = await FreelanceListing.findByIdAndUpdate(
      listingId,
      { $set: parsed.data },
      { new: true, runValidators: true }
    ).lean();

    return NextResponse.json({ message: 'Listing updated.', listing: updated });
  } catch (error) {
    console.error('[FREELANCE LISTING UPDATE ERROR]', error);
    return NextResponse.json({ error: 'Failed to update freelance listing.' }, { status: 500 });
  }
}
