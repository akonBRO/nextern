import { connectDB } from '@/lib/db';
import { AcademicReview } from '@/models/AcademicReview';
import { OpportunityRecommendation } from '@/models/OpportunityRecommendation';

export type StudentAcademicReviewSummary = {
  id: string;
  headline: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  readinessLevel: 'priority_support' | 'developing' | 'ready';
  profileScore?: number;
  createdAt: string;
  reviewer: {
    name: string;
    role: string;
    designation?: string;
    department?: string;
    institution?: string;
  };
};

export type StudentJobRecommendationSummary = {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  focusSkills: string[];
  fitScore?: number;
  resourceUrl?: string;
  createdAt: string;
  recommender: {
    name: string;
    role: string;
    designation?: string;
  };
  job: {
    id: string;
    title: string;
    companyName: string;
    type: string;
  } | null;
};

export type StudentAcademicFeedback = {
  reviews: StudentAcademicReviewSummary[];
  recommendations: StudentJobRecommendationSummary[];
};

type TeacherRole = 'advisor' | 'dept_head';

type PopulatedAcademicReviewer = {
  name?: string;
  role?: string;
  designation?: string;
  advisoryDepartment?: string;
  institutionName?: string;
};

type AcademicReviewRecord = {
  _id: { toString(): string };
  headline: string;
  summary: string;
  strengths?: string[];
  growthAreas?: string[];
  readinessLevel: StudentAcademicReviewSummary['readinessLevel'];
  profileScore?: number;
  createdAt?: Date;
  reviewerId?: PopulatedAcademicReviewer | string | null;
};

type PopulatedRecommendationJob = {
  _id: { toString(): string };
  title: string;
  companyName: string;
  type: string;
};

type RecommendationRecord = {
  _id: { toString(): string };
  title: string;
  description: string;
  priority: StudentJobRecommendationSummary['priority'];
  focusSkills?: string[];
  fitScore?: number;
  resourceUrl?: string;
  createdAt?: Date;
  recommenderId?: PopulatedAcademicReviewer | string | null;
  linkedJobId?: PopulatedRecommendationJob | string | null;
};

function mapAcademicReview(review: AcademicReviewRecord): StudentAcademicReviewSummary {
  return {
    id: review._id.toString(),
    headline: review.headline,
    summary: review.summary,
    strengths: review.strengths ?? [],
    growthAreas: review.growthAreas ?? [],
    readinessLevel: review.readinessLevel,
    profileScore: review.profileScore,
    createdAt:
      review.createdAt instanceof Date ? review.createdAt.toISOString() : new Date().toISOString(),
    reviewer: {
      name:
        typeof review.reviewerId === 'object' && review.reviewerId && 'name' in review.reviewerId
          ? review.reviewerId.name
          : 'Academic reviewer',
      role:
        typeof review.reviewerId === 'object' && review.reviewerId && 'role' in review.reviewerId
          ? review.reviewerId.role
          : 'advisor',
      designation:
        typeof review.reviewerId === 'object' &&
        review.reviewerId &&
        'designation' in review.reviewerId
          ? review.reviewerId.designation
          : undefined,
      department:
        typeof review.reviewerId === 'object' &&
        review.reviewerId &&
        'advisoryDepartment' in review.reviewerId
          ? review.reviewerId.advisoryDepartment
          : undefined,
      institution:
        typeof review.reviewerId === 'object' &&
        review.reviewerId &&
        'institutionName' in review.reviewerId
          ? review.reviewerId.institutionName
          : undefined,
    },
  };
}

function mapJobRecommendation(
  recommendation: RecommendationRecord
): StudentJobRecommendationSummary {
  return {
    id: recommendation._id.toString(),
    title: recommendation.title,
    description: recommendation.description,
    priority: recommendation.priority,
    focusSkills: recommendation.focusSkills ?? [],
    fitScore: recommendation.fitScore,
    resourceUrl: recommendation.resourceUrl,
    createdAt:
      recommendation.createdAt instanceof Date
        ? recommendation.createdAt.toISOString()
        : new Date().toISOString(),
    recommender: {
      name:
        typeof recommendation.recommenderId === 'object' &&
        recommendation.recommenderId &&
        'name' in recommendation.recommenderId
          ? recommendation.recommenderId.name
          : 'Academic reviewer',
      role:
        typeof recommendation.recommenderId === 'object' &&
        recommendation.recommenderId &&
        'role' in recommendation.recommenderId
          ? recommendation.recommenderId.role
          : 'advisor',
      designation:
        typeof recommendation.recommenderId === 'object' &&
        recommendation.recommenderId &&
        'designation' in recommendation.recommenderId
          ? recommendation.recommenderId.designation
          : undefined,
    },
    job:
      typeof recommendation.linkedJobId === 'object' &&
      recommendation.linkedJobId &&
      'title' in recommendation.linkedJobId
        ? {
            id: recommendation.linkedJobId._id.toString(),
            title: recommendation.linkedJobId.title,
            companyName: recommendation.linkedJobId.companyName,
            type: recommendation.linkedJobId.type,
          }
        : null,
  };
}

export async function getStudentAcademicFeedback(
  studentId: string
): Promise<StudentAcademicFeedback> {
  await connectDB();

  const [reviews, recommendations] = await Promise.all([
    AcademicReview.find({ studentId, status: 'active' })
      .populate('reviewerId', 'name role designation advisoryDepartment institutionName')
      .sort({ createdAt: -1 })
      .lean(),
    OpportunityRecommendation.find({
      studentId,
      status: 'active',
      category: 'job',
    })
      .populate('recommenderId', 'name role designation advisoryDepartment institutionName')
      .populate('linkedJobId', 'title companyName type')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    reviews: reviews.map(mapAcademicReview),
    recommendations: recommendations.map(mapJobRecommendation),
  };
}

export async function getTeacherScopedAcademicFeedback(params: {
  studentId: string;
  viewerId: string;
  viewerRole: TeacherRole;
}): Promise<StudentAcademicFeedback> {
  await connectDB();

  const isDeptHead = params.viewerRole === 'dept_head';
  const reviewQuery = isDeptHead
    ? { studentId: params.studentId, status: 'active' as const }
    : {
        studentId: params.studentId,
        status: 'active' as const,
        reviewerId: params.viewerId,
      };
  const recommendationQuery = isDeptHead
    ? {
        studentId: params.studentId,
        status: 'active' as const,
        category: 'job' as const,
      }
    : {
        studentId: params.studentId,
        status: 'active' as const,
        category: 'job' as const,
        recommenderId: params.viewerId,
      };

  const [reviews, recommendations] = await Promise.all([
    AcademicReview.find(reviewQuery)
      .populate('reviewerId', 'name role designation advisoryDepartment institutionName')
      .sort({ createdAt: -1 })
      .lean(),
    OpportunityRecommendation.find(recommendationQuery)
      .populate('recommenderId', 'name role designation advisoryDepartment institutionName')
      .populate('linkedJobId', 'title companyName type')
      .sort({ createdAt: -1 })
      .lean(),
  ]);

  return {
    reviews: reviews.map(mapAcademicReview),
    recommendations: recommendations.map(mapJobRecommendation),
  };
}
