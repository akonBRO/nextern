import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import {
  addVerifiedPortfolioItemFromOrder,
  getObjectIdString,
  syncFreelanceListingStats,
  syncVerifiedFreelancerBadge,
} from '@/lib/freelance';
import { createNotification } from '@/lib/notify';
import { FreelanceReviewSchema } from '@/lib/validations';
import { FreelanceOrder } from '@/models/FreelanceOrder';
import { FreelanceReview } from '@/models/FreelanceReview';
import { User } from '@/models/User';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const parsed = FreelanceReviewSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    await connectDB();

    const order = await FreelanceOrder.findById(parsed.data.orderId)
      .populate('listingId', 'title')
      .lean();
    if (!order) {
      return NextResponse.json({ error: 'Order not found.' }, { status: 404 });
    }

    if (order.status !== 'completed' || order.escrowStatus !== 'released') {
      return NextResponse.json(
        { error: 'Reviews are only available after a completed escrow release.' },
        { status: 400 }
      );
    }

    const isClient = getObjectIdString(order.clientId) === session.user.id;
    const isFreelancer = getObjectIdString(order.freelancerId) === session.user.id;

    if (parsed.data.reviewType === 'client_to_student') {
      if (!isClient) {
        return NextResponse.json(
          { error: 'Only the client can leave this review.' },
          { status: 403 }
        );
      }

      const requiredRatings = [
        parsed.data.professionalismRating,
        parsed.data.punctualityRating,
        parsed.data.skillPerformanceRating,
        parsed.data.workQualityRating,
      ];

      if (requiredRatings.some((value) => typeof value !== 'number')) {
        return NextResponse.json(
          { error: 'Please complete all four freelancer ratings.' },
          { status: 400 }
        );
      }
    }

    if (parsed.data.reviewType === 'student_to_client') {
      if (!isFreelancer) {
        return NextResponse.json(
          { error: 'Only the freelancer can leave this review.' },
          { status: 403 }
        );
      }

      const requiredRatings = [
        parsed.data.overallRating,
        parsed.data.communicationRating,
        parsed.data.requirementsClarityRating,
        parsed.data.paymentPromptnessRating,
      ];

      if (requiredRatings.some((value) => typeof value !== 'number')) {
        return NextResponse.json(
          { error: 'Please complete all four client ratings.' },
          { status: 400 }
        );
      }
    }

    const revieweeId =
      parsed.data.reviewType === 'client_to_student' ? order.freelancerId : order.clientId;

    const review = await FreelanceReview.findOneAndUpdate(
      { orderId: order._id, reviewType: parsed.data.reviewType },
      {
        ...parsed.data,
        reviewerId: session.user.id,
        revieweeId,
        orderId: order._id,
        listingId: order.listingId,
        freelancerId: order.freelancerId,
        clientId: order.clientId,
        isVerified: true,
        isPublic: true,
      },
      { new: true, upsert: true, runValidators: true }
    ).lean();

    await FreelanceOrder.findByIdAndUpdate(order._id, {
      $set:
        parsed.data.reviewType === 'client_to_student'
          ? { clientReviewSubmitted: true }
          : { freelancerReviewSubmitted: true },
    });

    await syncFreelanceListingStats(getObjectIdString(order.listingId)).catch(console.error);

    if (parsed.data.reviewType === 'client_to_student') {
      await Promise.all([
        syncVerifiedFreelancerBadge(getObjectIdString(order.freelancerId)).catch(console.error),
        addVerifiedPortfolioItemFromOrder(order._id.toString()).catch(console.error),
      ]);
    }

    const reviewee = await User.findById(revieweeId).select('role').lean();
    const listingTitle =
      order.listingId && typeof order.listingId === 'object'
        ? order.listingId.title
        : 'your project';

    await createNotification({
      userId: revieweeId.toString(),
      type: 'review_received',
      title: 'New verified freelance review',
      body: `A verified review was added for "${listingTitle}". Your freelance history is now stronger on Nextern.`,
      link: reviewee?.role === 'employer' ? '/employer/freelance' : '/student/freelance',
      meta: { orderId: order._id.toString(), reviewType: parsed.data.reviewType },
    });

    return NextResponse.json({ success: true, review });
  } catch (error) {
    console.error('[FREELANCE REVIEW ERROR]', error);
    return NextResponse.json({ error: 'Failed to submit freelance review.' }, { status: 500 });
  }
}
