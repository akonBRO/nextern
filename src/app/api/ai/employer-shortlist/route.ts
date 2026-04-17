import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { checkFeatureAccess, getUsageSummary } from '@/lib/premium';
import { Application } from '@/models/Application';
import { FeatureUsage } from '@/models/FeatureUsage';
import { Job } from '@/models/Job';

const ShortlistSchema = z.object({
  jobId: z.string().min(1),
  limit: z.number().int().min(1).max(20).optional(),
});

type PopulatedStudent = {
  _id?: unknown;
  name?: string;
  email?: string;
  university?: string;
  department?: string;
  cgpa?: number;
  skills?: string[];
  opportunityScore?: number;
  profileCompleteness?: number;
  resumeUrl?: string;
  yearOfStudy?: number;
};

type ShortlistApplication = {
  _id: unknown;
  studentId: PopulatedStudent | mongoose.Types.ObjectId;
  status: string;
  fitScore?: number;
  hardGaps?: string[];
  softGaps?: string[];
  metRequirements?: string[];
  suggestedPath?: string[];
  appliedAt?: Date;
  resumeUrlSnapshot?: string;
};

function toId(value: unknown) {
  if (value instanceof mongoose.Types.ObjectId) return value.toString();
  if (typeof value === 'object' && value && '_id' in value) {
    const nestedId = (value as { _id?: unknown })._id;
    return nestedId instanceof mongoose.Types.ObjectId
      ? nestedId.toString()
      : String(nestedId ?? '');
  }
  return String(value ?? '');
}

function asStudent(value: PopulatedStudent | mongoose.Types.ObjectId): PopulatedStudent {
  if (value instanceof mongoose.Types.ObjectId) return {};
  return value;
}

function normalizeSkill(value: string) {
  return value.trim().toLowerCase();
}

function estimateMissingFitScore(student: PopulatedStudent, requiredSkills: string[]) {
  const required = requiredSkills.map(normalizeSkill).filter(Boolean);
  const studentSkills = new Set((student.skills ?? []).map(normalizeSkill).filter(Boolean));
  const matched = required.filter((skill) => studentSkills.has(skill));
  const skillScore = required.length ? (matched.length / required.length) * 70 : 45;
  const cgpaScore = typeof student.cgpa === 'number' ? Math.min(20, (student.cgpa / 4) * 20) : 8;
  const profileScore =
    typeof student.profileCompleteness === 'number'
      ? Math.min(10, (student.profileCompleteness / 100) * 10)
      : 5;

  return Math.max(20, Math.min(95, Math.round(skillScore + cgpaScore + profileScore)));
}

function scoreCandidate(application: ShortlistApplication, requiredSkills: string[]) {
  const student = asStudent(application.studentId);
  if (typeof application.fitScore === 'number') return application.fitScore;
  return estimateMissingFitScore(student, requiredSkills);
}

function getRecommendation(score: number) {
  if (score >= 80) return 'Priority shortlist';
  if (score >= 65) return 'Strong review';
  if (score >= 45) return 'Review with gaps';
  return 'Lower fit';
}

function buildReasons(application: ShortlistApplication, requiredSkills: string[]) {
  const student = asStudent(application.studentId);
  const reasons: string[] = [];

  if (application.metRequirements?.length) {
    reasons.push(`Meets ${application.metRequirements.slice(0, 2).join(', ')}`);
  }

  const required = requiredSkills.map(normalizeSkill).filter(Boolean);
  const studentSkills = new Set((student.skills ?? []).map(normalizeSkill).filter(Boolean));
  const matchedSkills = required.filter((skill) => studentSkills.has(skill));
  if (matchedSkills.length > 0) {
    reasons.push(
      `${matchedSkills.length}/${required.length || matchedSkills.length} required skills matched`
    );
  }

  if (typeof student.cgpa === 'number') {
    reasons.push(`CGPA ${student.cgpa.toFixed(2)}`);
  }

  if (typeof student.opportunityScore === 'number' && student.opportunityScore > 0) {
    reasons.push(`Opportunity score ${student.opportunityScore}`);
  }

  if (application.hardGaps?.length) {
    reasons.push(
      `${application.hardGaps.length} hard gap${application.hardGaps.length === 1 ? '' : 's'} to check`
    );
  }

  return reasons.slice(0, 4);
}

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (session.user.role !== 'employer') {
      return NextResponse.json(
        { error: 'Only employers can use AI shortlisting.' },
        { status: 403 }
      );
    }

    const body = await req.json();
    const parsed = ShortlistSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten().fieldErrors },
        { status: 400 }
      );
    }

    const { jobId } = parsed.data;
    const limit = parsed.data.limit ?? 10;
    if (!mongoose.Types.ObjectId.isValid(jobId)) {
      return NextResponse.json({ error: 'Invalid job id.' }, { status: 400 });
    }

    await connectDB();

    const job = await Job.findOne({ _id: jobId, employerId: session.user.id })
      .select('title companyName requiredSkills minimumCGPA')
      .lean();

    if (!job) {
      return NextResponse.json({ error: 'Job not found.' }, { status: 404 });
    }

    const access = await checkFeatureAccess(session.user.id, 'aiApplicantShortlist');
    if (!access.allowed) {
      return NextResponse.json(
        { error: access.reason, requiresPremium: true, usage: access.usage },
        { status: 403 }
      );
    }

    const applications = (await Application.find({
      jobId,
      employerId: session.user.id,
      isEventRegistration: false,
      status: { $ne: 'withdrawn' },
    })
      .populate(
        'studentId',
        'name email university department cgpa skills opportunityScore profileCompleteness resumeUrl yearOfStudy'
      )
      .select(
        'studentId status fitScore hardGaps softGaps metRequirements suggestedPath appliedAt resumeUrlSnapshot'
      )
      .lean()) as unknown as ShortlistApplication[];

    if (applications.length === 0) {
      return NextResponse.json({
        job: { id: job._id.toString(), title: job.title },
        shortlist: [],
        usage: await getUsageSummary(session.user.id),
      });
    }

    const shortlist = applications
      .map((application) => {
        const student = asStudent(application.studentId);
        const score = scoreCandidate(application, job.requiredSkills ?? []);
        return {
          applicationId: toId(application._id),
          studentId: toId(application.studentId),
          studentName: student.name ?? 'Unknown candidate',
          email: student.email ?? '',
          university: student.university ?? '',
          department: student.department ?? '',
          yearOfStudy: student.yearOfStudy,
          status: application.status,
          fitScore: score,
          recommendation: getRecommendation(score),
          reasons: buildReasons(application, job.requiredSkills ?? []),
          hardGaps: application.hardGaps ?? [],
          softGaps: application.softGaps ?? [],
          resumeUrl: application.resumeUrlSnapshot || student.resumeUrl || '',
        };
      })
      .sort((left, right) => right.fitScore - left.fitScore)
      .slice(0, limit);

    await FeatureUsage.create({
      userId: session.user.id,
      feature: 'ai_applicant_shortlist',
      metadata: {
        jobId,
        candidateCount: String(applications.length),
        selectedCount: String(shortlist.length),
      },
    });

    return NextResponse.json({
      job: { id: job._id.toString(), title: job.title, companyName: job.companyName },
      shortlist,
      usage: await getUsageSummary(session.user.id),
    });
  } catch (error) {
    console.error('[EMPLOYER AI SHORTLIST ERROR]', error);
    return NextResponse.json({ error: 'Failed to generate AI shortlist.' }, { status: 500 });
  }
}
