import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db';
import { Review } from '@/models/Review';
import { User } from '@/models/User';
import mongoose from 'mongoose';

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ studentId: string }> }
) {
  try {
    await connectDB();
    const { studentId } = await params;

    if (!mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json({ error: 'Invalid student ID' }, { status: 400 });
    }

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return NextResponse.json({ error: 'Student not found' }, { status: 404 });
    }

    // Fetch all employer_to_student reviews for this student
    const reviews = await Review.find({
      revieweeId: studentId,
      reviewType: 'employer_to_student',
      isPublic: true,
      isVerified: true,
    }).populate('reviewerId', 'name companyDetails.companyName');

    if (reviews.length === 0) {
      return NextResponse.json({
        success: true,
        aggregatedStats: null,
        recommendations: [],
      });
    }

    // Calculate aggregated statistics
    let totalProfessionalism = 0;
    let totalPunctuality = 0;
    let totalSkillPerformance = 0;
    let totalWorkQuality = 0;
    let totalRecommendations = 0;

    const recommendations: {
      employerName: string;
      companyName: string;
      text: string;
      createdAt: Date;
    }[] = [];

    reviews.forEach((r) => {
      if (r.professionalismRating) totalProfessionalism += r.professionalismRating;
      if (r.punctualityRating) totalPunctuality += r.punctualityRating;
      if (r.skillPerformanceRating) totalSkillPerformance += r.skillPerformanceRating;
      if (r.workQualityRating) totalWorkQuality += r.workQualityRating;

      if (r.isRecommended) {
        totalRecommendations++;
      }

      if (r.recommendationText) {
        recommendations.push({
          employerName: r.reviewerId?.name,
          companyName: r.reviewerId?.companyDetails?.companyName,
          text: r.recommendationText,
          createdAt: r.createdAt,
        });
      }
    });

    const count = reviews.length;
    const aggregatedStats = {
      averageProfessionalism: Number((totalProfessionalism / count).toFixed(1)),
      averagePunctuality: Number((totalPunctuality / count).toFixed(1)),
      averageSkillPerformance: Number((totalSkillPerformance / count).toFixed(1)),
      averageWorkQuality: Number((totalWorkQuality / count).toFixed(1)),
      totalReviews: count,
      totalRecommendations,
    };

    return NextResponse.json({
      success: true,
      aggregatedStats,
      recommendations,
    });
  } catch (error: unknown) {
    console.error('Fetch reputation aggregation error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
