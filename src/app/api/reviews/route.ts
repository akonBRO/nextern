import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { Review } from '@/models/Review';
import { Application } from '@/models/Application';
import { evaluateBadges } from '@/lib/badge-engine';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const {
      revieweeId,
      applicationId,
      reviewType,
      overallRating,
      workEnvironmentRating,
      learningOpportunityRating,
      mentorshipQualityRating,
      comment,
      professionalismRating,
      punctualityRating,
      skillPerformanceRating,
      workQualityRating,
      isRecommended,
      recommendationText,
    } = body;

    // Validate Application Status
    const application = await Application.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    if (application.status !== 'hired') {
      return NextResponse.json(
        { error: 'Review only allowed for hired candidates' },
        { status: 400 }
      );
    }

    // Role check
    if (
      reviewType === 'student_to_employer' &&
      session.user.id !== application.studentId.toString()
    ) {
      return NextResponse.json(
        { error: 'Only the hired student can leave this review' },
        { status: 403 }
      );
    }

    if (
      reviewType === 'employer_to_student' &&
      session.user.id !== application.employerId.toString()
    ) {
      return NextResponse.json(
        { error: 'Only the employer can leave this review' },
        { status: 403 }
      );
    }

    const review = await Review.findOneAndUpdate(
      { applicationId, reviewType },
      {
        reviewerId: session.user.id,
        revieweeId,
        overallRating,
        workEnvironmentRating,
        learningOpportunityRating,
        mentorshipQualityRating,
        comment,
        professionalismRating,
        punctualityRating,
        skillPerformanceRating,
        workQualityRating,
        isRecommended,
        recommendationText,
        isVerified: true,
        isPublic: true,
      },
      { new: true, upsert: true }
    );

    // Async Trigger Badges
    process.nextTick(async () => {
      try {
        if (reviewType === 'student_to_employer') {
          // The student submitted a review: possibly community-leader badge
          await evaluateBadges(session.user.id, 'onReviewSubmitted', 'student');
          // Employer received a review: possibly trusted-recruiter / campus-favorite badge
          await evaluateBadges(revieweeId, 'onReviewReceived', 'employer');
        } else if (reviewType === 'employer_to_student') {
          // Employer submitted a review
          await evaluateBadges(session.user.id, 'onReviewSubmitted', 'employer');
          // Student received a review: possibly verified-work-record badge
          await evaluateBadges(revieweeId, 'onReviewReceived', 'student');
        }
      } catch (err) {
        console.error('Badge evaluation error on review:', err);
      }
    });
    return NextResponse.json({ success: true, data: review });
  } catch (error: unknown) {
    console.error('Create/Update review error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Internal server error' },
      { status: 500 }
    );
  }
}
