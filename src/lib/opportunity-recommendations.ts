import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { AcademicReview } from '@/models/AcademicReview';
import { Job } from '@/models/Job';
import { OpportunityRecommendation } from '@/models/OpportunityRecommendation';
import { User } from '@/models/User';
import {
  getAdvisorDashboardData,
  getDeptDashboardData,
  type AdvisorDashboardData,
  type DepartmentDashboardData,
} from '@/lib/role-dashboard';

type TeacherRole = 'advisor' | 'dept_head';
type RecommendationCategory =
  | 'job'
  | 'event'
  | 'course'
  | 'project'
  | 'academic_path'
  | 'skill_plan';
type JobRecommendationType = 'internship' | 'part-time' | 'full-time';

type TeacherScope = {
  viewerId: string;
  role: TeacherRole;
  institutionName?: string;
  advisoryDepartment?: string;
  studentQuery: Record<string, unknown>;
};

type StudentDoc = {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  university?: string;
  department?: string;
  studentId?: string;
  currentSemester?: string;
  yearOfStudy?: number;
  cgpa?: number;
  opportunityScore?: number;
  profileCompleteness?: number;
  skills?: string[];
  completedCourses?: string[];
  projects?: { title?: string; techStack?: string[] }[];
  certifications?: { name?: string }[];
};

type JobDoc = {
  _id: mongoose.Types.ObjectId;
  title: string;
  companyName: string;
  type: 'internship' | 'part-time' | 'full-time' | 'campus-drive' | 'webinar' | 'workshop';
  locationType: 'onsite' | 'remote' | 'hybrid';
  city?: string;
  applicationDeadline?: Date;
  startDate?: Date;
  requiredSkills?: string[];
  requiredCourses?: string[];
  preferredCertifications?: string[];
  targetUniversities?: string[];
  targetDepartments?: string[];
  targetYears?: number[];
  minimumCGPA?: number;
  description?: string;
};

type ApplicationDoc = {
  _id: mongoose.Types.ObjectId;
  jobId: mongoose.Types.ObjectId;
  status: string;
  fitScore?: number;
  hardGaps?: string[];
  softGaps?: string[];
  metRequirements?: string[];
  suggestedPath?: string[];
  fitSummary?: string;
  isEventRegistration?: boolean;
  appliedAt?: Date;
};

export type WorkspaceStudentOption = {
  id: string;
  name: string;
  email: string;
  department?: string;
  currentSemester?: string;
  studentId?: string;
  yearOfStudy?: number;
  opportunityScore: number;
  profileCompleteness: number;
  cgpa?: number;
  topGap?: string;
  attentionLevel: 'high' | 'medium' | 'low';
};

export type WorkspaceOpportunityRecommendation = {
  id: string;
  category: RecommendationCategory;
  title: string;
  organizationName: string;
  fitScore: number;
  rationale: string;
  matchedSignals: string[];
  missingSignals: string[];
  href?: string;
  priority: 'high' | 'medium' | 'low';
  dateLabel?: string;
};

export type WorkspaceManualRecommendation = {
  id: string;
  category: RecommendationCategory;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  focusSkills: string[];
  resourceUrl?: string;
  fitScore?: number;
  createdAt: string;
  recommenderRole: TeacherRole;
  linkedJobId?: string;
  companyName?: string;
  jobType?: string;
  requestStatus: 'pending' | 'accepted' | 'rejected' | 'hold';
  employerResponseNote?: string;
  employerRespondedAt?: string;
};

export type WorkspaceAcademicReview = {
  id: string;
  headline: string;
  summary: string;
  strengths: string[];
  growthAreas: string[];
  readinessLevel: 'priority_support' | 'developing' | 'ready';
  profileScore?: number;
  createdAt: string;
  reviewerRole: TeacherRole;
};

export type WorkspaceJobRecommendationOption = {
  id: string;
  title: string;
  companyName: string;
  type: JobRecommendationType;
  fitScore: number;
  dateLabel?: string;
};

export type WorkspaceLearningAction = {
  category: 'course' | 'project' | 'academic_path' | 'skill_plan';
  title: string;
  description: string;
  focus: string[];
  priority: 'high' | 'medium' | 'low';
};

export type WorkspaceStudentSnapshot = {
  id: string;
  name: string;
  email: string;
  university?: string;
  department?: string;
  currentSemester?: string;
  studentId?: string;
  yearOfStudy?: number;
  cgpa?: number;
  opportunityScore: number;
  profileCompleteness: number;
  skills: string[];
  completedCourses: string[];
  topSkillGaps: string[];
  applicationHighlights: {
    id: string;
    title: string;
    companyName: string;
    status: string;
    fitScore?: number;
    summary?: string;
  }[];
};

export type TeacherRecommendationWorkspaceData = {
  role: TeacherRole;
  scopeLabel: string;
  pickerLabel: string;
  selectedStudentId?: string;
  selectedStudent?: WorkspaceStudentSnapshot;
  students: WorkspaceStudentOption[];
  automatedRecommendations: WorkspaceOpportunityRecommendation[];
  manualRecommendations: WorkspaceManualRecommendation[];
  academicReviews: WorkspaceAcademicReview[];
  jobRecommendationOptions: WorkspaceJobRecommendationOption[];
  learningActions: WorkspaceLearningAction[];
  suggestedAcademicPaths: WorkspaceLearningAction[];
  cohortSummary: {
    totalStudents: number;
    highAttentionStudents: number;
    averageOpportunityScore: number;
    averageProfileCompleteness?: number;
    priorityStudents?: number;
  };
  chromeUser: AdvisorDashboardData['chromeUser'] | DepartmentDashboardData['chromeUser'];
  advisorInsights?: Pick<AdvisorDashboardData, 'topSkillGaps' | 'recentActions'>;
  departmentInsights?: Pick<
    DepartmentDashboardData,
    'readinessDistribution' | 'industryAlignment' | 'skillHeatmap' | 'semesterTrend'
  >;
};

function normalizeStringArray(values: unknown): string[] {
  if (!Array.isArray(values)) return [];
  const seen = new Set<string>();
  const normalized: string[] = [];

  for (const value of values) {
    if (typeof value !== 'string') continue;
    const trimmed = value.trim();
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

function clamp(value: number, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function countTerms(values: string[]) {
  return values.reduce<Map<string, number>>((acc, value) => {
    const key = value.trim();
    if (!key) return acc;
    acc.set(key, (acc.get(key) ?? 0) + 1);
    return acc;
  }, new Map<string, number>());
}

function topTerms(values: string[], limit = 6) {
  return [...countTerms(values).entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

function isRelevantJob(student: StudentDoc, job: JobDoc) {
  const matchesUniversity =
    !job.targetUniversities?.length || job.targetUniversities.includes(student.university ?? '');
  const matchesDepartment =
    !job.targetDepartments?.length || job.targetDepartments.includes(student.department ?? '');
  const matchesYear =
    !job.targetYears?.length || job.targetYears.includes(student.yearOfStudy ?? 0);
  const hasUpcomingDate =
    (job.applicationDeadline && job.applicationDeadline >= new Date()) ||
    (job.startDate && job.startDate >= new Date());

  return matchesUniversity && matchesDepartment && matchesYear && hasUpcomingDate;
}

function getFitBreakdown(student: StudentDoc, job: JobDoc) {
  const skillPool = new Set(
    normalizeStringArray([
      ...(student.skills ?? []),
      ...((student.projects ?? []).flatMap((project) => project.techStack ?? []) ?? []),
    ]).map(normalizeToken)
  );
  const coursePool = new Set(
    normalizeStringArray(student.completedCourses ?? []).map(normalizeToken)
  );
  const certificationPool = new Set(
    normalizeStringArray((student.certifications ?? []).map((item) => item.name ?? '')).map(
      normalizeToken
    )
  );

  const requiredSkills = normalizeStringArray(job.requiredSkills ?? []);
  const requiredCourses = normalizeStringArray(job.requiredCourses ?? []);
  const preferredCertifications = normalizeStringArray(job.preferredCertifications ?? []);

  const matchedSkills = requiredSkills.filter((skill) => skillPool.has(normalizeToken(skill)));
  const missingSkills = requiredSkills.filter((skill) => !skillPool.has(normalizeToken(skill)));
  const matchedCourses = requiredCourses.filter((course) => coursePool.has(normalizeToken(course)));
  const missingCourses = requiredCourses.filter(
    (course) => !coursePool.has(normalizeToken(course))
  );
  const matchedCertifications = preferredCertifications.filter((certification) =>
    certificationPool.has(normalizeToken(certification))
  );

  const skillScore =
    requiredSkills.length > 0 ? (matchedSkills.length / requiredSkills.length) * 54 : 30;
  const courseScore =
    requiredCourses.length > 0 ? (matchedCourses.length / requiredCourses.length) * 16 : 9;
  const cgpaScore =
    typeof job.minimumCGPA === 'number' && job.minimumCGPA > 0
      ? clamp(((student.cgpa ?? 0) / job.minimumCGPA) * 16, 0, 16)
      : 10;
  const certificationScore =
    preferredCertifications.length > 0
      ? clamp((matchedCertifications.length / preferredCertifications.length) * 8, 0, 8)
      : 5;
  const targetingScore =
    (job.targetDepartments?.length ? 4 : 2) +
    (job.targetYears?.length ? 4 : 2) +
    (job.targetUniversities?.length ? 4 : 2);

  const matchedSignals = [
    ...matchedSkills.slice(0, 3).map((skill) => `Skill: ${skill}`),
    ...matchedCourses.slice(0, 2).map((course) => `Course: ${course}`),
  ];

  if (
    student.department &&
    (!job.targetDepartments?.length || job.targetDepartments.includes(student.department))
  ) {
    matchedSignals.push(`Department: ${student.department}`);
  }

  if (
    student.yearOfStudy &&
    (!job.targetYears?.length || job.targetYears.includes(student.yearOfStudy))
  ) {
    matchedSignals.push(`Year ${student.yearOfStudy} eligible`);
  }

  const missingSignals = [
    ...missingSkills.slice(0, 3).map((skill) => `Skill gap: ${skill}`),
    ...missingCourses.slice(0, 2).map((course) => `Course gap: ${course}`),
  ];

  if (
    typeof job.minimumCGPA === 'number' &&
    typeof student.cgpa === 'number' &&
    student.cgpa < job.minimumCGPA
  ) {
    missingSignals.push(`CGPA target ${job.minimumCGPA.toFixed(2)}`);
  }

  return {
    fitScore: clamp(
      Math.round(skillScore + courseScore + cgpaScore + certificationScore + targetingScore)
    ),
    matchedSignals,
    missingSignals,
    missingSkills,
    missingCourses,
  };
}

function priorityFromFit(fitScore: number): 'high' | 'medium' | 'low' {
  if (fitScore >= 78) return 'high';
  if (fitScore >= 55) return 'medium';
  return 'low';
}

function buildOpportunityHref(job: JobDoc) {
  if (job.type === 'webinar' || job.type === 'workshop') {
    return `/student/jobs/${job._id.toString()}`;
  }
  return `/student/jobs/${job._id.toString()}`;
}

export async function resolveTeacherScope(
  viewerId: string,
  role: TeacherRole
): Promise<TeacherScope> {
  await connectDB();

  const teacher = await User.findById(viewerId)
    .select('role institutionName advisoryDepartment')
    .lean();

  if (!teacher || (teacher.role !== 'advisor' && teacher.role !== 'dept_head')) {
    throw new Error('Teacher scope could not be resolved.');
  }

  if (!teacher.institutionName || !teacher.advisoryDepartment) {
    return {
      viewerId,
      role,
      institutionName: teacher.institutionName,
      advisoryDepartment: teacher.advisoryDepartment,
      studentQuery: {
        role: 'student',
        university: '__no_matching_institution__',
        department: '__no_matching_department__',
      },
    };
  }

  if (role === 'dept_head') {
    return {
      viewerId,
      role,
      institutionName: teacher.institutionName,
      advisoryDepartment: teacher.advisoryDepartment,
      studentQuery: {
        role: 'student',
        university: teacher.institutionName,
        department: teacher.advisoryDepartment,
      },
    };
  }

  return {
    viewerId,
    role,
    institutionName: teacher.institutionName,
    advisoryDepartment: teacher.advisoryDepartment,
    studentQuery: {
      role: 'student',
      university: teacher.institutionName,
      department: teacher.advisoryDepartment,
    },
  };
}

export async function canTeacherAccessStudent(scope: TeacherScope, studentId: string) {
  if (!mongoose.Types.ObjectId.isValid(studentId)) return false;

  const student = await User.findOne({
    _id: new mongoose.Types.ObjectId(studentId),
    ...scope.studentQuery,
  })
    .select('_id')
    .lean();

  return Boolean(student);
}

export async function getTeacherRecommendationWorkspaceData(params: {
  viewerId: string;
  role: TeacherRole;
  studentId?: string;
}): Promise<TeacherRecommendationWorkspaceData> {
  await connectDB();

  const scope = await resolveTeacherScope(params.viewerId, params.role);
  const isAdvisorView = params.role === 'advisor';

  const [students, dashboardData] = await Promise.all([
    User.find(scope.studentQuery)
      .select(
        'name email university department studentId currentSemester yearOfStudy cgpa opportunityScore profileCompleteness skills completedCourses projects certifications'
      )
      .sort({ opportunityScore: 1, profileCompleteness: 1, name: 1 })
      .lean() as Promise<StudentDoc[]>,
    isAdvisorView
      ? getAdvisorDashboardData({ userId: params.viewerId })
      : getDeptDashboardData({ userId: params.viewerId }),
  ]);

  const advisorDashboard = isAdvisorView ? (dashboardData as AdvisorDashboardData) : null;
  const departmentDashboard = isAdvisorView ? null : (dashboardData as DepartmentDashboardData);

  const selectedStudent =
    students.find((student) => student._id.toString() === params.studentId) ?? students[0] ?? null;

  const selectedStudentId = selectedStudent?._id.toString();

  const [applications, openJobs, manualRecommendations, academicReviews] = selectedStudentId
    ? await Promise.all([
        Application.find({ studentId: selectedStudentId })
          .select(
            'jobId status fitScore hardGaps softGaps metRequirements suggestedPath fitSummary isEventRegistration appliedAt'
          )
          .sort({ updatedAt: -1 })
          .lean() as Promise<ApplicationDoc[]>,
        Job.find({
          isActive: true,
          $or: [{ applicationDeadline: { $gte: new Date() } }, { startDate: { $gte: new Date() } }],
        })
          .select(
            'title companyName type locationType city applicationDeadline startDate requiredSkills requiredCourses preferredCertifications targetUniversities targetDepartments targetYears minimumCGPA description'
          )
          .sort({ applicationDeadline: 1, createdAt: -1 })
          .limit(120)
          .lean() as Promise<JobDoc[]>,
        OpportunityRecommendation.find({ studentId: selectedStudentId, status: 'active' })
          .populate('linkedJobId', 'title companyName type')
          .sort({ createdAt: -1 })
          .lean(),
        AcademicReview.find({ studentId: selectedStudentId, status: 'active' })
          .sort({ createdAt: -1 })
          .lean(),
      ])
    : [[], [], [], []];

  const jobMap = selectedStudentId
    ? new Map(
        (
          await Job.find({
            _id: { $in: applications.map((application) => application.jobId) },
          })
            .select('title companyName type')
            .lean()
        ).map((job) => [job._id.toString(), job])
      )
    : new Map();

  const applicationJobIds = new Set(
    applications.map((application) => application.jobId.toString())
  );
  const recommendationPool = selectedStudent
    ? openJobs
        .filter((job) => isRelevantJob(selectedStudent, job))
        .filter((job) => !applicationJobIds.has(job._id.toString()))
        .map((job) => {
          const breakdown = getFitBreakdown(selectedStudent, job);
          const isEvent = job.type === 'webinar' || job.type === 'workshop';
          const dateValue = isEvent ? job.startDate : job.applicationDeadline;
          const dateLabel = dateValue
            ? new Intl.DateTimeFormat('en-BD', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(dateValue)
            : undefined;

          return {
            id: job._id.toString(),
            category: isEvent ? ('event' as const) : ('job' as const),
            title: job.title,
            organizationName: job.companyName,
            fitScore: breakdown.fitScore,
            rationale:
              breakdown.matchedSignals.length > 0
                ? `Strong alignment through ${breakdown.matchedSignals.slice(0, 2).join(' and ')}.`
                : 'A broad opportunity match based on the student profile and targeting rules.',
            matchedSignals: breakdown.matchedSignals.slice(0, 5),
            missingSignals: breakdown.missingSignals.slice(0, 4),
            href: buildOpportunityHref(job),
            priority: priorityFromFit(breakdown.fitScore),
            dateLabel,
            missingSkills: breakdown.missingSkills,
            missingCourses: breakdown.missingCourses,
          };
        })
        .sort((left, right) => right.fitScore - left.fitScore)
        .slice(0, 8)
    : [];

  const jobRecommendationOptions: WorkspaceJobRecommendationOption[] = selectedStudent
    ? openJobs
        .filter(
          (job): job is JobDoc & { type: JobRecommendationType } =>
            job.type === 'internship' || job.type === 'part-time' || job.type === 'full-time'
        )
        .map((job) => {
          const breakdown = getFitBreakdown(selectedStudent, job);
          const dateLabel = job.applicationDeadline
            ? new Intl.DateTimeFormat('en-BD', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              }).format(job.applicationDeadline)
            : undefined;

          return {
            id: job._id.toString(),
            title: job.title,
            companyName: job.companyName,
            type: job.type,
            fitScore: breakdown.fitScore,
            dateLabel,
          };
        })
        .sort((left, right) => {
          if (right.fitScore !== left.fitScore) return right.fitScore - left.fitScore;
          return left.title.localeCompare(right.title);
        })
        .slice(0, 30)
    : [];

  const studentGapSignals = [
    ...applications.flatMap((application) => application.hardGaps ?? []),
    ...recommendationPool.flatMap((recommendation) => recommendation.missingSkills),
  ];
  const studentCourseSignals = [
    ...recommendationPool.flatMap((recommendation) => recommendation.missingCourses),
  ];

  const learningActions: WorkspaceLearningAction[] = [
    ...topTerms(studentCourseSignals, 3).map<WorkspaceLearningAction>((course, index) => ({
      category: 'course' as const,
      title: `Course reinforcement: ${course}`,
      description: `Review ${course}, rebuild the core concepts, and document one outcome that can be referenced during applications or interviews.`,
      focus: [course],
      priority: index === 0 ? 'high' : 'medium',
    })),
    ...topTerms(studentGapSignals, 3).map<WorkspaceLearningAction>((skill, index) => ({
      category: 'project' as const,
      title: `Portfolio project for ${skill}`,
      description: `Build one compact project centered on ${skill} so the student can convert a gap into a visible proof-of-work artifact.`,
      focus: [skill],
      priority: index === 0 ? 'high' : 'medium',
    })),
  ];

  const suggestedAcademicPaths: WorkspaceLearningAction[] = selectedStudent
    ? [
        {
          category: 'academic_path',
          title:
            (selectedStudent.yearOfStudy ?? 0) <= 2
              ? 'Foundation strengthening path'
              : 'Placement acceleration path',
          description:
            (selectedStudent.yearOfStudy ?? 0) <= 2
              ? 'Prioritize core courses, hands-on portfolio projects, and one targeted event registration to build readiness before the major hiring window.'
              : 'Prioritize high-fit openings, interview preparation, and the top missing requirements that are still blocking strong applications.',
          focus: [
            ...(topTerms(studentGapSignals, 2) ?? []),
            ...(topTerms(studentCourseSignals, 1) ?? []),
          ].filter(Boolean),
          priority:
            selectedStudent.opportunityScore && selectedStudent.opportunityScore < 45
              ? 'high'
              : 'medium',
        },
        {
          category: 'skill_plan',
          title: 'Three-step skill development plan',
          description:
            'Close one hard gap, package one visible project, and align one application-ready opportunity from the automated list to convert guidance into action this week.',
          focus: topTerms(studentGapSignals, 3),
          priority: 'medium',
        },
      ]
    : [];

  const manualCards: WorkspaceManualRecommendation[] = manualRecommendations
    .filter((recommendation) => recommendation.category === 'job')
    .map((recommendation) => ({
      id: recommendation._id.toString(),
      category: recommendation.category,
      title: recommendation.title,
      description: recommendation.description,
      priority: recommendation.priority,
      focusSkills: normalizeStringArray(recommendation.focusSkills ?? []),
      resourceUrl: recommendation.resourceUrl,
      fitScore: typeof recommendation.fitScore === 'number' ? recommendation.fitScore : undefined,
      createdAt:
        recommendation.createdAt instanceof Date
          ? recommendation.createdAt.toISOString()
          : new Date().toISOString(),
      recommenderRole: recommendation.recommenderRole,
      linkedJobId:
        recommendation.linkedJobId && typeof recommendation.linkedJobId === 'object'
          ? recommendation.linkedJobId._id.toString()
          : undefined,
      companyName:
        recommendation.linkedJobId && typeof recommendation.linkedJobId === 'object'
          ? recommendation.linkedJobId.companyName
          : undefined,
      jobType:
        recommendation.linkedJobId && typeof recommendation.linkedJobId === 'object'
          ? recommendation.linkedJobId.type
          : undefined,
      requestStatus: recommendation.requestStatus ?? 'pending',
      employerResponseNote:
        typeof recommendation.employerResponseNote === 'string'
          ? recommendation.employerResponseNote
          : undefined,
      employerRespondedAt:
        recommendation.employerRespondedAt instanceof Date
          ? recommendation.employerRespondedAt.toISOString()
          : undefined,
    }));

  const academicReviewCards: WorkspaceAcademicReview[] = academicReviews.map((review) => ({
    id: review._id.toString(),
    headline: review.headline,
    summary: review.summary,
    strengths: normalizeStringArray(review.strengths ?? []),
    growthAreas: normalizeStringArray(review.growthAreas ?? []),
    readinessLevel: review.readinessLevel,
    profileScore: typeof review.profileScore === 'number' ? review.profileScore : undefined,
    createdAt:
      review.createdAt instanceof Date ? review.createdAt.toISOString() : new Date().toISOString(),
    reviewerRole: review.reviewerRole,
  }));

  const studentOptions: WorkspaceStudentOption[] = students.map((student) => {
    const isSelected = student._id.toString() === selectedStudentId;
    const selectedGapFallback = isSelected ? topTerms(studentGapSignals, 1)[0] : undefined;
    const attentionLevel =
      (student.opportunityScore ?? 0) < 40 || (student.profileCompleteness ?? 0) < 60
        ? 'high'
        : (student.opportunityScore ?? 0) < 65
          ? 'medium'
          : 'low';

    return {
      id: student._id.toString(),
      name: student.name,
      email: student.email,
      department: student.department,
      currentSemester: student.currentSemester,
      studentId: student.studentId,
      yearOfStudy: student.yearOfStudy,
      opportunityScore: student.opportunityScore ?? 0,
      profileCompleteness: student.profileCompleteness ?? 0,
      cgpa: student.cgpa,
      topGap: selectedGapFallback,
      attentionLevel,
    };
  });

  const selectedSnapshot: WorkspaceStudentSnapshot | undefined = selectedStudent
    ? {
        id: selectedStudent._id.toString(),
        name: selectedStudent.name,
        email: selectedStudent.email,
        university: selectedStudent.university,
        department: selectedStudent.department,
        currentSemester: selectedStudent.currentSemester,
        studentId: selectedStudent.studentId,
        yearOfStudy: selectedStudent.yearOfStudy,
        cgpa: selectedStudent.cgpa,
        opportunityScore: selectedStudent.opportunityScore ?? 0,
        profileCompleteness: selectedStudent.profileCompleteness ?? 0,
        skills: normalizeStringArray(selectedStudent.skills ?? []),
        completedCourses: normalizeStringArray(selectedStudent.completedCourses ?? []),
        topSkillGaps: topTerms(studentGapSignals, 5),
        applicationHighlights: applications.slice(0, 5).map((application) => {
          const job = jobMap.get(application.jobId.toString());
          return {
            id: application._id.toString(),
            title: job?.title ?? 'Tracked opportunity',
            companyName: job?.companyName ?? 'Nextern',
            status: application.status,
            fitScore: application.fitScore,
            summary: application.fitSummary,
          };
        }),
      }
    : undefined;

  const cohortSummary =
    params.role === 'advisor'
      ? {
          totalStudents: studentOptions.length,
          highAttentionStudents: studentOptions.filter(
            (student) => student.attentionLevel === 'high'
          ).length,
          averageOpportunityScore: advisorDashboard?.stats.avgOpportunityScore ?? 0,
          averageProfileCompleteness: advisorDashboard?.stats.avgProfileCompleteness ?? 0,
          priorityStudents: advisorDashboard?.stats.priorityStudents ?? 0,
        }
      : {
          totalStudents: studentOptions.length,
          highAttentionStudents: studentOptions.filter(
            (student) => student.attentionLevel === 'high'
          ).length,
          averageOpportunityScore: departmentDashboard?.stats.avgOpportunityScore ?? 0,
          averageProfileCompleteness: undefined,
          priorityStudents: undefined,
        };

  return {
    role: params.role,
    scopeLabel:
      params.role === 'advisor'
        ? scope.institutionName
          ? `${scope.institutionName} advisees`
          : 'Assigned advisees'
        : [scope.advisoryDepartment, scope.institutionName].filter(Boolean).join(' · ') ||
          'Department cohort',
    pickerLabel: params.role === 'advisor' ? 'Advisee focus list' : 'Department student focus',
    selectedStudentId,
    selectedStudent: selectedSnapshot,
    students: studentOptions,
    automatedRecommendations: recommendationPool.map(
      ({ missingCourses: _missingCourses, missingSkills: _missingSkills, ...recommendation }) =>
        recommendation
    ),
    manualRecommendations: manualCards,
    academicReviews: academicReviewCards,
    jobRecommendationOptions,
    learningActions,
    suggestedAcademicPaths,
    cohortSummary,
    chromeUser: dashboardData.chromeUser,
    advisorInsights:
      isAdvisorView && advisorDashboard
        ? {
            topSkillGaps: advisorDashboard.topSkillGaps,
            recentActions: advisorDashboard.recentActions,
          }
        : undefined,
    departmentInsights:
      !isAdvisorView && departmentDashboard
        ? {
            readinessDistribution: departmentDashboard.readinessDistribution,
            industryAlignment: departmentDashboard.industryAlignment,
            skillHeatmap: departmentDashboard.skillHeatmap,
            semesterTrend: departmentDashboard.semesterTrend,
          }
        : undefined,
  };
}
