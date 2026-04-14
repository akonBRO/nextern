import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import {
  generateSmartJobRecommendations,
  type SmartJobRecommendation,
  type SmartJobRecommendationCandidate,
  type SmartRecommendationBehavior,
} from '@/lib/gemini';
import { checkFeatureAccess, getUsageSummary } from '@/lib/premium';
import { Application } from '@/models/Application';
import { FeatureUsage } from '@/models/FeatureUsage';
import { Job } from '@/models/Job';
import { JobView } from '@/models/JobView';
import { User } from '@/models/User';

const FiltersSchema = z
  .object({
    search: z.string().max(120).optional(),
    datePosted: z.enum(['', '24h', '3d', '7d', '30d']).optional(),
    type: z.string().max(40).optional(),
    locationType: z.enum(['', 'onsite', 'remote', 'hybrid']).optional(),
    city: z.string().max(80).optional(),
    skills: z.array(z.string().max(60)).max(12).optional(),
    stipendMin: z.number().nonnegative().optional(),
    stipendMax: z.number().nonnegative().optional(),
  })
  .optional();

const RequestSchema = z.object({
  filters: FiltersSchema,
  limit: z.number().int().min(1).max(20).optional(),
});

type LeanStudent = {
  _id: mongoose.Types.ObjectId;
  university?: string;
  department?: string;
  yearOfStudy?: number;
  cgpa?: number;
  city?: string;
  skills?: string[];
  completedCourses?: string[];
  certifications?: { name?: string; issuedBy?: string }[];
  projects?: { techStack?: string[] }[];
};

type LeanJob = {
  _id: mongoose.Types.ObjectId;
  title: string;
  companyName: string;
  companyLogo?: string;
  description?: string;
  type: string;
  locationType: string;
  city?: string;
  stipendBDT?: number;
  isStipendNegotiable?: boolean;
  applicationDeadline?: Date;
  createdAt?: Date;
  requiredSkills?: string[];
  requiredCourses?: string[];
  preferredCertifications?: string[];
  targetUniversities?: string[];
  targetDepartments?: string[];
  targetYears?: number[];
  minimumCGPA?: number;
  applicationCount?: number;
  viewCount?: number;
  isBatchHiring?: boolean;
  isPremiumListing?: boolean;
};

type LeanApplication = {
  jobId: mongoose.Types.ObjectId;
  fitScore?: number;
  fitScoreComputedAt?: Date;
};

type LeanJobView = {
  jobId: mongoose.Types.ObjectId;
  viewCount?: number;
  lastViewedAt?: Date;
  isSaved?: boolean;
  isApplied?: boolean;
};

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeText(value: unknown) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];

  const seen = new Set<string>();
  const normalized: string[] = [];
  for (const item of value) {
    if (typeof item !== 'string') continue;
    const trimmed = item.trim();
    if (!trimmed) continue;

    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    normalized.push(trimmed);
  }
  return normalized;
}

function normalizeToken(value: string) {
  return value.trim().toLowerCase();
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function getPostedSince(value?: string) {
  const now = Date.now();
  const windows: Record<string, number> = {
    '24h': 1,
    '3d': 3,
    '7d': 7,
    '30d': 30,
  };
  const days = value ? windows[value] : undefined;
  return days ? new Date(now - days * 24 * 60 * 60 * 1000) : null;
}

function pushWeighted(map: Map<string, number>, values: string[], weight: number) {
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    map.set(key, (map.get(key) ?? 0) + weight);
  }
}

function topWeightedKeys(map: Map<string, number>, limit: number) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function tokenize(value: string) {
  return value
    .toLowerCase()
    .split(/[^a-z0-9+#.]+/)
    .map((item) => item.trim())
    .filter((item) => item.length >= 3);
}

function buildStudentProfile(student: LeanStudent) {
  const certificationNames = (student.certifications ?? [])
    .map((certification) => certification.name)
    .filter((name): name is string => Boolean(name));
  const projectTechStacks = (student.projects ?? []).flatMap((project) => project.techStack ?? []);

  return {
    university: student.university,
    department: student.department,
    yearOfStudy: student.yearOfStudy,
    cgpa: student.cgpa,
    city: student.city,
    skills: normalizeStringArray(student.skills ?? []),
    completedCourses: normalizeStringArray(student.completedCourses ?? []),
    certifications: normalizeStringArray(certificationNames),
    projectTechStacks: normalizeStringArray(projectTechStacks),
  };
}

function estimateFitScore(student: LeanStudent, job: LeanJob) {
  const profile = buildStudentProfile(student);
  const studentSkills = new Set(
    normalizeStringArray([...profile.skills, ...profile.projectTechStacks]).map(normalizeToken)
  );
  const completedCourses = new Set(profile.completedCourses.map(normalizeToken));
  const requiredSkills = normalizeStringArray(job.requiredSkills ?? []);
  const requiredCourses = normalizeStringArray(job.requiredCourses ?? []);
  const matchedSkills = requiredSkills.filter((skill) => studentSkills.has(normalizeToken(skill)));
  const matchedCourses = requiredCourses.filter((course) =>
    completedCourses.has(normalizeToken(course))
  );

  const skillScore =
    requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 55 : 28;
  const courseScore =
    requiredCourses.length > 0 ? (matchedCourses.length / requiredCourses.length) * 15 : 8;
  const cgpaScore =
    job.minimumCGPA && job.minimumCGPA > 0
      ? clamp(((student.cgpa ?? 0) / job.minimumCGPA) * 15, 0, 15)
      : 9;
  const departmentScore =
    student.department &&
    (job.targetDepartments ?? []).map(normalizeToken).includes(normalizeToken(student.department))
      ? 7
      : (job.targetDepartments ?? []).length === 0
        ? 4
        : 0;
  const yearScore =
    student.yearOfStudy && (job.targetYears ?? []).includes(student.yearOfStudy)
      ? 5
      : (job.targetYears ?? []).length === 0
        ? 3
        : 0;

  return clamp(
    Math.round(skillScore + courseScore + cgpaScore + departmentScore + yearScore),
    0,
    100
  );
}

function buildMongoQuery(params: {
  student: LeanStudent;
  appliedJobIds: string[];
  filters: z.infer<typeof FiltersSchema>;
}) {
  const query: Record<string, unknown> = {
    isActive: true,
    applicationDeadline: { $gte: new Date() },
  };
  const andClauses: Record<string, unknown>[] = [];

  if (params.appliedJobIds.length > 0) {
    query._id = {
      $nin: params.appliedJobIds.map((id) => new mongoose.Types.ObjectId(id)),
    };
  }

  if (params.student.university) {
    andClauses.push({
      $or: [
        { targetUniversities: { $size: 0 } },
        { targetUniversities: params.student.university },
      ],
    });
  }

  if (params.student.department) {
    andClauses.push({
      $or: [{ targetDepartments: { $size: 0 } }, { targetDepartments: params.student.department }],
    });
  }

  if (params.student.yearOfStudy) {
    andClauses.push({
      $or: [{ targetYears: { $size: 0 } }, { targetYears: params.student.yearOfStudy }],
    });
  }

  const filters = params.filters;
  const search = normalizeText(filters?.search);
  if (search) {
    const regex = { $regex: escapeRegex(search), $options: 'i' };
    andClauses.push({
      $or: [
        { title: regex },
        { companyName: regex },
        { description: regex },
        { requiredSkills: regex },
      ],
    });
  }

  const postedSince = getPostedSince(filters?.datePosted);
  if (postedSince) query.createdAt = { $gte: postedSince };

  const type = normalizeText(filters?.type);
  if (type) query.type = type;

  if (filters?.locationType) query.locationType = filters.locationType;

  const city = normalizeText(filters?.city);
  if (city) query.city = { $regex: escapeRegex(city), $options: 'i' };

  const skills = normalizeStringArray(filters?.skills ?? []);
  if (skills.length > 0) {
    query.requiredSkills = {
      $in: skills.map((skill) => new RegExp(escapeRegex(skill), 'i')),
    };
  }

  const stipendQuery: Record<string, number> = {};
  if (typeof filters?.stipendMin === 'number') stipendQuery.$gte = filters.stipendMin;
  if (typeof filters?.stipendMax === 'number') stipendQuery.$lte = filters.stipendMax;
  if (Object.keys(stipendQuery).length > 0) query.stipendBDT = stipendQuery;

  if (andClauses.length > 0) query.$and = andClauses;

  return query;
}

function buildBehavior(params: {
  jobViews: LeanJobView[];
  applications: LeanApplication[];
  interactedJobs: LeanJob[];
}): SmartRecommendationBehavior {
  const viewedIds = new Set(params.jobViews.map((view) => view.jobId.toString()));
  const savedIds = new Set(
    params.jobViews.filter((view) => view.isSaved).map((view) => view.jobId.toString())
  );
  const appliedIds = new Set(
    params.applications.map((application) => application.jobId.toString())
  );
  const jobMap = new Map(params.interactedJobs.map((job) => [job._id.toString(), job]));
  const skillWeights = new Map<string, number>();
  const typeWeights = new Map<string, number>();
  const locationWeights = new Map<string, number>();

  for (const view of params.jobViews) {
    const job = jobMap.get(view.jobId.toString());
    if (!job) continue;

    const baseWeight = Math.min(view.viewCount ?? 1, 5);
    pushWeighted(skillWeights, job.requiredSkills ?? [], baseWeight);
    pushWeighted(typeWeights, [job.type], baseWeight);
    pushWeighted(locationWeights, [job.city ?? job.locationType], baseWeight);

    if (view.isSaved) {
      pushWeighted(skillWeights, job.requiredSkills ?? [], 5);
      pushWeighted(typeWeights, [job.type], 4);
      pushWeighted(locationWeights, [job.city ?? job.locationType], 3);
    }
  }

  for (const application of params.applications) {
    const job = jobMap.get(application.jobId.toString());
    if (!job) continue;

    pushWeighted(skillWeights, job.requiredSkills ?? [], 8);
    pushWeighted(typeWeights, [job.type], 6);
    pushWeighted(locationWeights, [job.city ?? job.locationType], 4);
  }

  const viewedJobTitles = [...viewedIds]
    .map((id) => jobMap.get(id)?.title)
    .filter((title): title is string => Boolean(title))
    .slice(0, 8);
  const savedJobTitles = [...savedIds]
    .map((id) => jobMap.get(id)?.title)
    .filter((title): title is string => Boolean(title))
    .slice(0, 8);
  const appliedJobTitles = [...appliedIds]
    .map((id) => jobMap.get(id)?.title)
    .filter((title): title is string => Boolean(title))
    .slice(0, 8);

  return {
    viewedJobTitles,
    savedJobTitles,
    appliedJobTitles,
    preferredSkills: topWeightedKeys(skillWeights, 12),
    preferredTypes: topWeightedKeys(typeWeights, 6),
    preferredLocations: topWeightedKeys(locationWeights, 8),
    engagementLevel:
      viewedJobTitles.length + savedJobTitles.length + appliedJobTitles.length > 0
        ? 'active'
        : 'new',
  };
}

function computeBehaviorScore(job: LeanJob, behavior: SmartRecommendationBehavior) {
  const preferredSkills = new Set(behavior.preferredSkills.map(normalizeToken));
  const preferredTypes = new Set(behavior.preferredTypes.map(normalizeToken));
  const preferredLocations = new Set(behavior.preferredLocations.map(normalizeToken));
  const preferredTitleTokens = new Set(
    [...behavior.viewedJobTitles, ...behavior.savedJobTitles, ...behavior.appliedJobTitles].flatMap(
      tokenize
    )
  );
  const skillScore = normalizeStringArray(job.requiredSkills ?? []).reduce(
    (score, skill) => score + (preferredSkills.has(normalizeToken(skill)) ? 12 : 0),
    0
  );
  const typeScore = preferredTypes.has(normalizeToken(job.type)) ? 12 : 0;
  const locationScore =
    (job.city && preferredLocations.has(normalizeToken(job.city))) ||
    preferredLocations.has(normalizeToken(job.locationType))
      ? 8
      : 0;
  const titleScore = tokenize(job.title).some((token) => preferredTitleTokens.has(token)) ? 8 : 0;

  return clamp(skillScore + typeScore + locationScore + titleScore, 0, 100);
}

function toRecommendationCandidate(params: {
  student: LeanStudent;
  job: LeanJob;
  behavior: SmartRecommendationBehavior;
  aiFitScores: Map<string, number>;
}): SmartJobRecommendationCandidate {
  const jobId = params.job._id.toString();
  return {
    jobId,
    title: params.job.title,
    companyName: params.job.companyName,
    type: params.job.type,
    locationType: params.job.locationType,
    city: params.job.city,
    requiredSkills: normalizeStringArray(params.job.requiredSkills ?? []),
    requiredCourses: normalizeStringArray(params.job.requiredCourses ?? []),
    preferredCertifications: normalizeStringArray(params.job.preferredCertifications ?? []),
    targetUniversities: normalizeStringArray(params.job.targetUniversities ?? []),
    targetDepartments: normalizeStringArray(params.job.targetDepartments ?? []),
    targetYears: params.job.targetYears ?? [],
    minimumCGPA: params.job.minimumCGPA,
    stipendBDT: params.job.stipendBDT,
    isStipendNegotiable: params.job.isStipendNegotiable,
    applicationCount: params.job.applicationCount ?? 0,
    viewCount: params.job.viewCount ?? 0,
    createdAt: params.job.createdAt?.toISOString(),
    localFitScore: params.aiFitScores.get(jobId) ?? estimateFitScore(params.student, params.job),
    behaviorScore: computeBehaviorScore(params.job, params.behavior),
  };
}

function toClientJob(params: {
  job: LeanJob;
  student: LeanStudent;
  recommendation?: SmartJobRecommendation;
  savedJobIds: Set<string>;
  appliedJobIds: Set<string>;
  aiFitScores: Map<string, number>;
}) {
  const jobId = params.job._id.toString();
  const fitScore = params.aiFitScores.get(jobId) ?? estimateFitScore(params.student, params.job);

  return {
    _id: jobId,
    title: params.job.title,
    companyName: params.job.companyName,
    companyLogo: params.job.companyLogo,
    type: params.job.type,
    locationType: params.job.locationType,
    city: params.job.city,
    stipendBDT: params.job.stipendBDT,
    isStipendNegotiable: params.job.isStipendNegotiable,
    applicationDeadline: params.job.applicationDeadline?.toISOString(),
    createdAt: params.job.createdAt?.toISOString(),
    requiredSkills: normalizeStringArray(params.job.requiredSkills ?? []).slice(0, 8),
    applicationCount: params.job.applicationCount ?? 0,
    isBatchHiring: params.job.isBatchHiring,
    isPremiumListing: params.job.isPremiumListing,
    fitScore,
    hasApplied: params.appliedJobIds.has(jobId),
    isSaved: params.savedJobIds.has(jobId),
    whyRecommended: params.recommendation?.whyRecommended ?? null,
    recommendationScore: params.recommendation?.rankScore ?? null,
    matchedSignals: params.recommendation?.matchedSignals ?? [],
  };
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'student') {
      return NextResponse.json({ error: 'Only students can use this feature.' }, { status: 403 });
    }

    const body = await req.json().catch(() => ({}));
    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid recommendation request.' }, { status: 400 });
    }

    await connectDB();

    const access = await checkFeatureAccess(session.user.id, 'smartJobRecommendation');
    if (!access.allowed) {
      return NextResponse.json(
        {
          error: access.reason,
          requiresPremium: true,
          usage: access.usage,
        },
        { status: 403 }
      );
    }

    const student = (await User.findById(session.user.id)
      .select(
        'university department yearOfStudy cgpa city skills completedCourses certifications projects'
      )
      .lean()) as LeanStudent | null;

    if (!student) {
      return NextResponse.json({ error: 'Student profile not found.' }, { status: 404 });
    }

    const hasVerifiedWorkRecord = await mongoose.models.BadgeAward?.exists({
      userId: session.user.id,
      badgeSlug: 'verified-work-record',
    });

    const [applications, jobViews] = await Promise.all([
      Application.find({ studentId: session.user.id, isWithdrawn: { $ne: true } })
        .select('jobId fitScore fitScoreComputedAt')
        .lean() as Promise<LeanApplication[]>,
      JobView.find({ studentId: session.user.id })
        .sort({ lastViewedAt: -1 })
        .limit(100)
        .lean() as Promise<LeanJobView[]>,
    ]);

    const appliedJobIds = new Set(applications.map((application) => application.jobId.toString()));
    const savedJobIds = new Set(
      jobViews.filter((view) => view.isSaved).map((view) => view.jobId.toString())
    );
    const aiFitScores = new Map(
      applications
        .filter(
          (application) =>
            application.fitScoreComputedAt && typeof application.fitScore === 'number'
        )
        .map((application) => [application.jobId.toString(), application.fitScore as number])
    );

    const interactionJobIds = [
      ...new Set([
        ...jobViews.map((view) => view.jobId.toString()),
        ...applications.map((application) => application.jobId.toString()),
      ]),
    ].filter((id) => mongoose.isValidObjectId(id));

    const interactedJobs =
      interactionJobIds.length > 0
        ? ((await Job.find({ _id: { $in: interactionJobIds } })
            .select('title type locationType city requiredSkills')
            .lean()) as LeanJob[])
        : [];
    const behavior = buildBehavior({ jobViews, applications, interactedJobs });
    const query = buildMongoQuery({
      student,
      appliedJobIds: [...appliedJobIds],
      filters: parsed.data.filters,
    });

    const jobs = (await Job.find(query)
      .sort({ isPremiumListing: -1, createdAt: -1 })
      .limit(80)
      .lean()) as LeanJob[];

    if (jobs.length === 0) {
      return NextResponse.json({
        jobs: [],
        recommendations: [],
        summary: 'No open listings match your current filters yet.',
        meta: null,
        usage: access.usage,
      });
    }

    const candidates = jobs
      .map((job) => toRecommendationCandidate({ student, job, behavior, aiFitScores }))
      .sort(
        (a, b) =>
          (b.localFitScore ?? 0) +
          b.behaviorScore * 0.6 +
          b.applicationCount * 0.03 -
          ((a.localFitScore ?? 0) + a.behaviorScore * 0.6 + a.applicationCount * 0.03)
      )
      .slice(0, 40);

    const result = await generateSmartJobRecommendations({
      studentProfile: buildStudentProfile(student),
      behavior,
      candidateJobs: candidates,
      limit: parsed.data.limit ?? 12,
    });

    const recommendationMap = new Map(
      result.data.recommendations.map((recommendation) => [recommendation.jobId, recommendation])
    );
    const jobMap = new Map(jobs.map((job) => [job._id.toString(), job]));
    const recommendedJobs = result.data.recommendations
      .map((recommendation) => {
        const job = jobMap.get(recommendation.jobId);
        if (!job) return null;
        return toClientJob({
          job,
          student,
          recommendation,
          savedJobIds,
          appliedJobIds,
          aiFitScores,
        });
      })
      .filter((job): job is NonNullable<typeof job> => Boolean(job));

    await FeatureUsage.create({
      userId: session.user.id,
      feature: 'smart_job_recommendation',
      metadata: {
        source: 'browse_jobs',
        mode: result.meta.mode,
        filterCount: String(Object.keys(parsed.data.filters ?? {}).length),
      },
    });

    return NextResponse.json({
      jobs: recommendedJobs,
      recommendations: result.data.recommendations,
      summary: result.data.summary,
      meta: result.meta,
      usage: await getUsageSummary(session.user.id),
      behavior,
      generatedAt: new Date().toISOString(),
      matchedCandidateCount: recommendationMap.size,
    });
  } catch (error) {
    console.error('[SMART JOB RECOMMENDATIONS ERROR]', error);
    return NextResponse.json(
      { error: 'Failed to generate smart job recommendations.' },
      { status: 500 }
    );
  }
}
