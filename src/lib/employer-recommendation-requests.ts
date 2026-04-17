import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { OpportunityRecommendation } from '@/models/OpportunityRecommendation';

export type EmployerRecommendationRequestItem = {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  fitScore?: number;
  focusSkills: string[];
  requestStatus: 'pending' | 'accepted' | 'rejected' | 'hold';
  employerResponseNote?: string;
  createdAt: string;
  respondedAt?: string;
  student: {
    id: string;
    name: string;
    email?: string;
    university?: string;
    department?: string;
    yearOfStudy?: number;
    cgpa?: number;
    opportunityScore?: number;
  };
  recommender: {
    id: string;
    name: string;
    role: 'advisor' | 'dept_head';
    designation?: string;
    institutionName?: string;
    advisoryDepartment?: string;
  };
  job: {
    id: string;
    title: string;
    type?: string;
    companyName?: string;
    applicationDeadline?: string;
  } | null;
};

export type EmployerRecommendationRequestSummary = {
  total: number;
  pending: number;
  accepted: number;
  rejected: number;
  hold: number;
};

function toIso(value?: Date | null) {
  return value instanceof Date ? value.toISOString() : undefined;
}

export async function getEmployerRecommendationRequests(employerId: string) {
  if (!mongoose.Types.ObjectId.isValid(employerId)) {
    return {
      requests: [] as EmployerRecommendationRequestItem[],
      summary: { total: 0, pending: 0, accepted: 0, rejected: 0, hold: 0 },
    };
  }

  await connectDB();

  const recommendations = await OpportunityRecommendation.find({
    employerId,
    category: 'job',
    status: 'active',
  })
    .populate('studentId', 'name email university department yearOfStudy cgpa opportunityScore')
    .populate('recommenderId', 'name role designation institutionName advisoryDepartment')
    .populate('linkedJobId', 'title type companyName applicationDeadline')
    .sort({ createdAt: -1 })
    .lean();

  const requests: EmployerRecommendationRequestItem[] = recommendations.map((recommendation) => ({
    id: recommendation._id.toString(),
    title: recommendation.title,
    description: recommendation.description,
    priority: recommendation.priority,
    fitScore: typeof recommendation.fitScore === 'number' ? recommendation.fitScore : undefined,
    focusSkills: Array.isArray(recommendation.focusSkills) ? recommendation.focusSkills : [],
    requestStatus: recommendation.requestStatus ?? 'pending',
    employerResponseNote:
      typeof recommendation.employerResponseNote === 'string'
        ? recommendation.employerResponseNote
        : undefined,
    createdAt: recommendation.createdAt.toISOString(),
    respondedAt: toIso(recommendation.employerRespondedAt),
    student:
      recommendation.studentId && typeof recommendation.studentId === 'object'
        ? {
            id: recommendation.studentId._id.toString(),
            name: recommendation.studentId.name ?? 'Student',
            email: recommendation.studentId.email ?? undefined,
            university: recommendation.studentId.university ?? undefined,
            department: recommendation.studentId.department ?? undefined,
            yearOfStudy: recommendation.studentId.yearOfStudy ?? undefined,
            cgpa: recommendation.studentId.cgpa ?? undefined,
            opportunityScore: recommendation.studentId.opportunityScore ?? undefined,
          }
        : {
            id: '',
            name: 'Student',
          },
    recommender:
      recommendation.recommenderId && typeof recommendation.recommenderId === 'object'
        ? {
            id: recommendation.recommenderId._id.toString(),
            name: recommendation.recommenderId.name ?? 'Academic reviewer',
            role: recommendation.recommenderId.role,
            designation: recommendation.recommenderId.designation ?? undefined,
            institutionName: recommendation.recommenderId.institutionName ?? undefined,
            advisoryDepartment: recommendation.recommenderId.advisoryDepartment ?? undefined,
          }
        : {
            id: '',
            name: 'Academic reviewer',
            role: 'advisor',
          },
    job:
      recommendation.linkedJobId && typeof recommendation.linkedJobId === 'object'
        ? {
            id: recommendation.linkedJobId._id.toString(),
            title: recommendation.linkedJobId.title,
            type: recommendation.linkedJobId.type,
            companyName: recommendation.linkedJobId.companyName,
            applicationDeadline: toIso(recommendation.linkedJobId.applicationDeadline),
          }
        : null,
  }));

  const summary = requests.reduce<EmployerRecommendationRequestSummary>(
    (acc, request) => {
      acc.total += 1;
      acc[request.requestStatus] += 1;
      return acc;
    },
    { total: 0, pending: 0, accepted: 0, rejected: 0, hold: 0 }
  );

  return { requests, summary };
}
