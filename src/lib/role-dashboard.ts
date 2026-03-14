import mongoose from 'mongoose';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { Job } from '@/models/Job';
import { Application } from '@/models/Application';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { AdvisorAction } from '@/models/AdvisorAction';
import { DepartmentBenchmark } from '@/models/DepartmentBenchmark';

export type ChromeUser = {
  name: string;
  email: string;
  image?: string;
  subtitle: string;
  unreadNotifications: number;
  unreadMessages: number;
};

export type PipelineMetric = {
  label: string;
  count: number;
};

export type EmployerDashboardData = {
  chromeUser: ChromeUser;
  company: {
    companyName: string;
    industry?: string;
    headquartersCity?: string;
    companyWebsite?: string;
    companyDescription?: string;
  };
  stats: {
    activeJobs: number;
    totalApplications: number;
    shortlisted: number;
    interviews: number;
    hired: number;
  };
  pipeline: PipelineMetric[];
  recentJobs: {
    id: string;
    title: string;
    type: string;
    locationType: string;
    city?: string;
    isActive: boolean;
    applicationCount: number;
    applicationDeadline?: string;
  }[];
  recentApplications: {
    id: string;
    studentName: string;
    university?: string;
    department?: string;
    jobTitle: string;
    status: string;
    fitScore?: number;
    appliedAt: string;
  }[];
  topCandidates: {
    id: string;
    studentName: string;
    university?: string;
    department?: string;
    jobTitle: string;
    fitScore?: number;
    status: string;
  }[];
};

export type AdvisorDashboardData = {
  chromeUser: ChromeUser;
  advisor: {
    institutionName?: string;
    advisoryDepartment?: string;
    designation?: string;
  };
  stats: {
    totalAdvisees: number;
    priorityStudents: number;
    avgOpportunityScore: number;
    avgProfileCompleteness: number;
    totalAdvisorActions: number;
  };
  attentionStudents: {
    id: string;
    name: string;
    university?: string;
    department?: string;
    opportunityScore: number;
    profileCompleteness: number;
    cgpa?: number;
    priorityFlagged: boolean;
  }[];
  recentActions: {
    id: string;
    studentName: string;
    actionType: string;
    createdAt: string;
    advisorNote?: string;
  }[];
  upcomingInterviews: {
    id: string;
    studentName: string;
    jobTitle: string;
    companyName: string;
    scheduledAt: string;
  }[];
  topSkillGaps: string[];
};

export type DepartmentDashboardData = {
  chromeUser: ChromeUser;
  department: {
    institutionName?: string;
    advisoryDepartment?: string;
    designation?: string;
    benchmark?: {
      cohort: string;
      minReadinessScore: number;
      minFitScore: number;
      minCGPA: number;
    };
  };
  stats: {
    totalStudents: number;
    activeOpenings: number;
    totalApplications: number;
    hiredStudents: number;
    avgOpportunityScore: number;
    avgCGPA: number;
  };
  pipeline: PipelineMetric[];
  topStudents: {
    id: string;
    name: string;
    opportunityScore: number;
    profileCompleteness: number;
    cgpa?: number;
  }[];
  upcomingOpenings: {
    id: string;
    title: string;
    companyName: string;
    type: string;
    applicationCount: number;
    deadline?: string;
  }[];
  skillSnapshot: string[];
};

function average(values: number[]) {
  if (values.length === 0) return 0;
  return Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
}

function buildPipeline(applications: Array<{ status: string }>): PipelineMetric[] {
  const counts = {
    Applied: 0,
    Shortlisted: 0,
    Interviews: 0,
    Hired: 0,
  };

  applications.forEach((application) => {
    if (application.status === 'applied') counts.Applied += 1;
    if (['shortlisted', 'under_review', 'assessment_sent'].includes(application.status)) {
      counts.Shortlisted += 1;
    }
    if (application.status === 'interview_scheduled') counts.Interviews += 1;
    if (application.status === 'hired') counts.Hired += 1;
  });

  return Object.entries(counts).map(([label, count]) => ({ label, count }));
}

function topTerms(values: string[], limit = 6) {
  const counts = values.reduce<Record<string, number>>((acc, value) => {
    if (!value) return acc;
    acc[value] = (acc[value] ?? 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([value]) => value);
}

async function getChromeCounts(userId: mongoose.Types.ObjectId) {
  const [unreadNotifications, unreadMessages] = await Promise.all([
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  return { unreadNotifications, unreadMessages };
}

export async function getEmployerDashboardData(userId: string): Promise<EmployerDashboardData> {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [user, jobs, applications, chromeCounts] = await Promise.all([
    User.findById(oid)
      .select(
        'name email image companyName industry headquartersCity companyWebsite companyDescription'
      )
      .lean(),
    Job.find({ employerId: oid })
      .select('title type locationType city isActive applicationCount applicationDeadline')
      .sort({ createdAt: -1 })
      .lean(),
    Application.find({ employerId: oid, isEventRegistration: false })
      .select('studentId jobId status fitScore appliedAt')
      .sort({ appliedAt: -1 })
      .lean(),
    getChromeCounts(oid),
  ]);

  if (!user) throw new Error('Employer not found');

  const studentIds = Array.from(
    new Set(applications.map((application) => application.studentId.toString()))
  ).map((id) => new mongoose.Types.ObjectId(id));
  const jobIds = Array.from(
    new Set(applications.map((application) => application.jobId.toString()))
  ).map((id) => new mongoose.Types.ObjectId(id));

  const [students, applicationJobs] = await Promise.all([
    studentIds.length
      ? User.find({ _id: { $in: studentIds } })
          .select('name university department cgpa')
          .lean()
      : [],
    jobIds.length
      ? Job.find({ _id: { $in: jobIds } })
          .select('title companyName')
          .lean()
      : [],
  ]);

  const studentMap = new Map(students.map((student) => [student._id.toString(), student]));
  const jobMap = new Map(applicationJobs.map((job) => [job._id.toString(), job]));

  const recentApplications = applications.slice(0, 6).map((application) => {
    const student = studentMap.get(application.studentId.toString());
    const job = jobMap.get(application.jobId.toString());

    return {
      id: application._id.toString(),
      studentName: student?.name ?? 'Unknown student',
      university: student?.university,
      department: student?.department,
      jobTitle: job?.title ?? 'Unknown role',
      status: application.status,
      fitScore: application.fitScore,
      appliedAt: application.appliedAt?.toISOString() ?? new Date().toISOString(),
    };
  });

  const topCandidates = [...applications]
    .sort((left, right) => (right.fitScore ?? 0) - (left.fitScore ?? 0))
    .slice(0, 5)
    .map((application) => {
      const student = studentMap.get(application.studentId.toString());
      const job = jobMap.get(application.jobId.toString());

      return {
        id: application._id.toString(),
        studentName: student?.name ?? 'Unknown student',
        university: student?.university,
        department: student?.department,
        jobTitle: job?.title ?? 'Unknown role',
        fitScore: application.fitScore,
        status: application.status,
      };
    });

  return {
    chromeUser: {
      name: user.name,
      email: user.email,
      image: user.image,
      subtitle: user.companyName ?? 'Employer workspace',
      ...chromeCounts,
    },
    company: {
      companyName: user.companyName ?? 'Your company',
      industry: user.industry,
      headquartersCity: user.headquartersCity,
      companyWebsite: user.companyWebsite,
      companyDescription: user.companyDescription,
    },
    stats: {
      activeJobs: jobs.filter((job) => job.isActive).length,
      totalApplications: applications.length,
      shortlisted: applications.filter((application) =>
        ['shortlisted', 'under_review', 'assessment_sent'].includes(application.status)
      ).length,
      interviews: applications.filter((application) => application.status === 'interview_scheduled')
        .length,
      hired: applications.filter((application) => application.status === 'hired').length,
    },
    pipeline: buildPipeline(applications),
    recentJobs: jobs.slice(0, 5).map((job) => ({
      id: job._id.toString(),
      title: job.title,
      type: job.type,
      locationType: job.locationType,
      city: job.city,
      isActive: job.isActive,
      applicationCount: job.applicationCount ?? 0,
      applicationDeadline: job.applicationDeadline?.toISOString(),
    })),
    recentApplications,
    topCandidates,
  };
}

export async function getAdvisorDashboardData(userId: string): Promise<AdvisorDashboardData> {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [user, students, actions, chromeCounts] = await Promise.all([
    User.findById(oid)
      .select('name email image institutionName advisoryDepartment designation')
      .lean(),
    User.find({ assignedAdvisorId: oid, role: 'student' })
      .select('name university department opportunityScore profileCompleteness cgpa')
      .sort({ opportunityScore: 1, profileCompleteness: 1 })
      .lean(),
    AdvisorAction.find({ advisorId: oid })
      .select('studentId actionType advisorNote isPriorityFlagged createdAt')
      .sort({ createdAt: -1 })
      .lean(),
    getChromeCounts(oid),
  ]);

  if (!user) throw new Error('Advisor not found');

  const studentIds = students.map((student) => student._id);
  const [applications, interviewJobs] = await Promise.all([
    studentIds.length
      ? Application.find({ studentId: { $in: studentIds }, isEventRegistration: false })
          .select('studentId jobId status interviewScheduledAt hardGaps')
          .lean()
      : [],
    studentIds.length ? Job.find({}).select('title companyName').lean() : [],
  ]);

  const flaggedStudentIds = new Set(
    actions
      .filter((action) => action.isPriorityFlagged)
      .map((action) => action.studentId.toString())
  );
  const studentMap = new Map(students.map((student) => [student._id.toString(), student]));
  const jobMap = new Map(interviewJobs.map((job) => [job._id.toString(), job]));

  const topSkillGaps = topTerms(
    applications.flatMap((application) => application.hardGaps ?? []),
    6
  );

  const upcomingInterviews = applications
    .filter(
      (application) =>
        application.status === 'interview_scheduled' &&
        application.interviewScheduledAt &&
        new Date(application.interviewScheduledAt) >= new Date()
    )
    .sort(
      (left, right) =>
        new Date(left.interviewScheduledAt ?? 0).getTime() -
        new Date(right.interviewScheduledAt ?? 0).getTime()
    )
    .slice(0, 5)
    .map((application) => ({
      id: application._id.toString(),
      studentName: studentMap.get(application.studentId.toString())?.name ?? 'Unknown student',
      jobTitle: jobMap.get(application.jobId.toString())?.title ?? 'Unknown role',
      companyName: jobMap.get(application.jobId.toString())?.companyName ?? 'Unknown company',
      scheduledAt: application.interviewScheduledAt?.toISOString() ?? new Date().toISOString(),
    }));

  const attentionStudents = students.slice(0, 6).map((student) => ({
    id: student._id.toString(),
    name: student.name,
    university: student.university,
    department: student.department,
    opportunityScore: student.opportunityScore ?? 0,
    profileCompleteness: student.profileCompleteness ?? 0,
    cgpa: student.cgpa,
    priorityFlagged:
      flaggedStudentIds.has(student._id.toString()) ||
      (student.opportunityScore ?? 0) < 40 ||
      (student.profileCompleteness ?? 0) < 60,
  }));

  const recentActions = actions.slice(0, 5).map((action) => ({
    id: action._id.toString(),
    studentName: studentMap.get(action.studentId.toString())?.name ?? 'Unknown student',
    actionType: action.actionType,
    createdAt: action.createdAt?.toISOString() ?? new Date().toISOString(),
    advisorNote: action.advisorNote,
  }));

  const priorityStudents = attentionStudents.filter((student) => student.priorityFlagged).length;

  return {
    chromeUser: {
      name: user.name,
      email: user.email,
      image: user.image,
      subtitle:
        [user.designation, user.institutionName].filter(Boolean).join(' at ') ||
        'Advisor workspace',
      ...chromeCounts,
    },
    advisor: {
      institutionName: user.institutionName,
      advisoryDepartment: user.advisoryDepartment,
      designation: user.designation,
    },
    stats: {
      totalAdvisees: students.length,
      priorityStudents,
      avgOpportunityScore: average(students.map((student) => student.opportunityScore ?? 0)),
      avgProfileCompleteness: average(students.map((student) => student.profileCompleteness ?? 0)),
      totalAdvisorActions: actions.length,
    },
    attentionStudents,
    recentActions,
    upcomingInterviews,
    topSkillGaps,
  };
}

export async function getDeptDashboardData(userId: string): Promise<DepartmentDashboardData> {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [user, benchmark, chromeCounts] = await Promise.all([
    User.findById(oid)
      .select('name email image institutionName advisoryDepartment designation')
      .lean(),
    DepartmentBenchmark.findOne({ deptHeadId: oid, isActive: true }).sort({ updatedAt: -1 }).lean(),
    getChromeCounts(oid),
  ]);

  if (!user) throw new Error('Department head not found');

  const students = await User.find({
    role: 'student',
    university: user.institutionName,
    department: user.advisoryDepartment,
  })
    .select('name opportunityScore profileCompleteness cgpa skills')
    .sort({ opportunityScore: -1 })
    .lean();

  const studentIds = students.map((student) => student._id);
  const applications = studentIds.length
    ? await Application.find({ studentId: { $in: studentIds }, isEventRegistration: false })
        .select('status')
        .lean()
    : [];

  const allOpenJobs = await Job.find({
    isActive: true,
    applicationDeadline: { $gte: new Date() },
  })
    .select(
      'title companyName type applicationDeadline applicationCount targetUniversities targetDepartments'
    )
    .sort({ applicationDeadline: 1 })
    .lean();

  const relevantJobs = allOpenJobs.filter((job) => {
    const matchesUniversity =
      !job.targetUniversities?.length ||
      job.targetUniversities.includes(user.institutionName ?? '');
    const matchesDepartment =
      !job.targetDepartments?.length ||
      job.targetDepartments.includes(user.advisoryDepartment ?? '');

    return matchesUniversity && matchesDepartment;
  });

  const topStudents = students.slice(0, 6).map((student) => ({
    id: student._id.toString(),
    name: student.name,
    opportunityScore: student.opportunityScore ?? 0,
    profileCompleteness: student.profileCompleteness ?? 0,
    cgpa: student.cgpa,
  }));

  return {
    chromeUser: {
      name: user.name,
      email: user.email,
      image: user.image,
      subtitle:
        [user.designation, user.advisoryDepartment].filter(Boolean).join(' | ') ||
        'Department workspace',
      ...chromeCounts,
    },
    department: {
      institutionName: user.institutionName,
      advisoryDepartment: user.advisoryDepartment,
      designation: user.designation,
      benchmark: benchmark
        ? {
            cohort: benchmark.cohort,
            minReadinessScore: benchmark.minReadinessScore,
            minFitScore: benchmark.minFitScore,
            minCGPA: benchmark.minCGPA,
          }
        : undefined,
    },
    stats: {
      totalStudents: students.length,
      activeOpenings: relevantJobs.length,
      totalApplications: applications.length,
      hiredStudents: applications.filter((application) => application.status === 'hired').length,
      avgOpportunityScore: average(students.map((student) => student.opportunityScore ?? 0)),
      avgCGPA: average(
        students
          .map((student) => (typeof student.cgpa === 'number' ? student.cgpa : 0))
          .filter(Boolean)
      ),
    },
    pipeline: buildPipeline(applications),
    topStudents,
    upcomingOpenings: relevantJobs.slice(0, 6).map((job) => ({
      id: job._id.toString(),
      title: job.title,
      companyName: job.companyName,
      type: job.type,
      applicationCount: job.applicationCount ?? 0,
      deadline: job.applicationDeadline?.toISOString(),
    })),
    skillSnapshot: topTerms(
      students.flatMap((student) => student.skills ?? []),
      8
    ),
  };
}
