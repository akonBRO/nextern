import 'server-only';

import mongoose from 'mongoose';
import { RtcRole, RtcTokenBuilder } from 'agora-token';
import { connectDB } from '@/lib/db';
import { createNotification } from '@/lib/notify';
import { onApplicationStatusChanged } from '@/lib/events';
import { executeJudge0 } from '@/lib/judge0';
import { syncInterviewToCalendar } from '@/lib/calendar';
import { Assessment } from '@/models/Assessment';
import { AssessmentAssignment } from '@/models/AssessmentAssignment';
import { AssessmentSubmission, type IAssessmentSubmission } from '@/models/AssessmentSubmission';
import { Application } from '@/models/Application';
import { InterviewSession } from '@/models/InterviewSession';
import { Job } from '@/models/Job';
import { Subscription } from '@/models/Subscription';
import { User } from '@/models/User';
import {
  averageInterviewScore,
  type AssessmentAnswerPayload,
  type AssessmentQuestionDraft,
  type InterviewRecommendation,
} from '@/lib/hiring-suite-shared';

const ACTIVE_APPLICATION_STATUSES = ['under_review', 'shortlisted', 'assessment_sent'] as const;
type SubmissionAnswer = IAssessmentSubmission['answers'][number];
type AssessmentTestCase = NonNullable<AssessmentQuestionDraft['testCases']>[number];

export class PremiumAccessError extends Error {
  status: number;

  constructor(message: string, status = 403) {
    super(message);
    this.name = 'PremiumAccessError';
    this.status = status;
  }
}

function asObjectId(value: string | mongoose.Types.ObjectId) {
  return typeof value === 'string' ? new mongoose.Types.ObjectId(value) : value;
}

function cleanText(value?: string | null) {
  return typeof value === 'string' ? value.trim() : '';
}

function normalizeComparisonText(value?: string | null) {
  return cleanText(value)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

function splitTokens(value?: string | null) {
  return Array.from(
    new Set(
      normalizeComparisonText(value)
        .split(' ')
        .map((token) => token.trim())
        .filter(Boolean)
    )
  );
}

function similarityScore(left?: string | null, right?: string | null) {
  const leftTokens = splitTokens(left);
  const rightTokens = splitTokens(right);
  if (leftTokens.length === 0 || rightTokens.length === 0) {
    return 0;
  }

  const rightSet = new Set(rightTokens);
  const overlap = leftTokens.filter((token) => rightSet.has(token)).length;
  return Math.round((overlap / new Set([...leftTokens, ...rightTokens]).size) * 100);
}

function derivedAgoraUid(seed: string) {
  const hex = seed.replace(/[^a-fA-F0-9]/g, '').slice(-8);
  const parsed = parseInt(hex || '1001', 16);
  return Math.max(1, parsed % 2147483000);
}

function ensureAgoraConfig() {
  const appId = process.env.AGORA_APP_ID?.trim() ?? process.env.NEXT_PUBLIC_AGORA_APP_ID?.trim();
  if (!appId) {
    throw new Error('AGORA_APP_ID is not configured.');
  }

  return {
    appId,
    appCertificate: process.env.AGORA_APP_CERTIFICATE?.trim() ?? '',
  };
}

async function getPremiumEligibleUserIds(userIds: string[]) {
  const uniqueUserIds = Array.from(new Set(userIds));
  const now = new Date();
  const [subscriptions, users] = await Promise.all([
    Subscription.find({
      userId: { $in: uniqueUserIds.map((value) => asObjectId(value)) },
      status: { $in: ['active', 'cancelled'] },
      endDate: { $gt: now },
    })
      .select('userId')
      .lean(),
    User.find({
      _id: { $in: uniqueUserIds.map((value) => asObjectId(value)) },
      isPremium: true,
      $or: [{ premiumExpiresAt: { $gt: now } }, { premiumExpiresAt: null }],
    })
      .select('_id')
      .lean(),
  ]);

  const eligible = new Set<string>();
  for (const item of subscriptions) {
    eligible.add(item.userId.toString());
  }
  for (const user of users) {
    eligible.add(user._id.toString());
  }
  return eligible;
}

async function assertEmployerPremiumEligibility(employerId: string) {
  const eligibleIds = await getPremiumEligibleUserIds([employerId]);
  if (!eligibleIds.has(employerId)) {
    throw new PremiumAccessError('Employer Premium is required to use assessments and interviews.');
  }
}

async function assertStudentPremiumAccess(studentId: string, feature: 'assessment' | 'interview') {
  const eligibleIds = await getPremiumEligibleUserIds([studentId]);
  if (eligibleIds.has(studentId)) {
    return;
  }

  throw new PremiumAccessError(
    feature === 'assessment'
      ? 'Student Premium is required to start this assessment. Upgrade your plan to continue.'
      : 'Student Premium is required to join this interview. Upgrade your plan to continue.'
  );
}

async function updateApplicationForAssessment(input: {
  applicationId: mongoose.Types.ObjectId;
  employerId: string;
  assessmentId: mongoose.Types.ObjectId;
  assignmentId: mongoose.Types.ObjectId;
  dueAt?: Date;
}) {
  const application = await Application.findById(input.applicationId)
    .select('status studentId')
    .lean();
  if (!application) return;

  const pushHistory =
    application.status !== 'assessment_sent'
      ? {
          status: 'assessment_sent',
          changedAt: new Date(),
          changedBy: asObjectId(input.employerId),
          note: 'Assessment assigned from the hiring suite.',
        }
      : null;

  await Application.findByIdAndUpdate(input.applicationId, {
    $set: {
      assessmentId: input.assessmentId,
      assessmentAssignmentId: input.assignmentId,
      assessmentDueAt: input.dueAt ?? null,
      ...(application.status !== 'assessment_sent' ? { status: 'assessment_sent' } : {}),
    },
    ...(pushHistory ? { $push: { statusHistory: pushHistory } } : {}),
  });

  if (application.status !== 'assessment_sent') {
    await onApplicationStatusChanged(application.studentId.toString(), 'assessment_sent').catch(
      () => {}
    );
  }
}

async function updateApplicationForInterview(input: {
  applicationId: mongoose.Types.ObjectId;
  employerId: string;
  interviewId: mongoose.Types.ObjectId;
  scheduledAt: Date;
  agoraChannelName: string;
}) {
  const application = await Application.findById(input.applicationId)
    .select('status studentId jobId googleCalendarEventId')
    .lean();
  if (!application) return;

  const pushHistory =
    application.status !== 'interview_scheduled'
      ? {
          status: 'interview_scheduled',
          changedAt: new Date(),
          changedBy: asObjectId(input.employerId),
          note: 'Interview scheduled from the hiring suite.',
        }
      : null;

  await Application.findByIdAndUpdate(input.applicationId, {
    $set: {
      status: 'interview_scheduled',
      interviewScheduledAt: input.scheduledAt,
      interviewSessionId: input.interviewId,
      agoraChannelId: input.agoraChannelName,
    },
    ...(pushHistory ? { $push: { statusHistory: pushHistory } } : {}),
  });

  const job = await Job.findById(application.jobId).select('title companyName').lean();
  if (job) {
    await syncInterviewToCalendar(
      application.studentId.toString(),
      input.applicationId.toString(),
      job.title,
      job.companyName,
      input.scheduledAt,
      application.googleCalendarEventId
    ).catch(() => {});
  }

  if (application.status !== 'interview_scheduled') {
    await onApplicationStatusChanged(application.studentId.toString(), 'interview_scheduled').catch(
      () => {}
    );
  }
}

function scoreMcq(question: AssessmentQuestionDraft, selectedOptionIndex?: number) {
  const isCorrect =
    typeof selectedOptionIndex === 'number' &&
    typeof question.correctOptionIndex === 'number' &&
    selectedOptionIndex === question.correctOptionIndex;
  return isCorrect ? question.marks : 0;
}

function scoreShortAnswer(question: AssessmentQuestionDraft, answerText?: string) {
  const accepted = (question.acceptedAnswers ?? []).map(normalizeComparisonText).filter(Boolean);
  const normalizedAnswer = normalizeComparisonText(answerText);
  if (!accepted.length || !normalizedAnswer) {
    return { score: 0, needsManualReview: true };
  }

  const matched = accepted.some(
    (candidate) => normalizedAnswer === candidate || normalizedAnswer.includes(candidate)
  );
  return {
    score: matched ? question.marks : 0,
    needsManualReview: false,
  };
}

async function scoreCodingQuestion(question: AssessmentQuestionDraft, code?: string) {
  if (!question.language) {
    throw new Error('Coding question is missing a configured language.');
  }

  if (!code || !cleanText(code)) {
    return { score: 0, runs: [] as Awaited<ReturnType<typeof executeJudge0>>[] };
  }

  const testCases = question.testCases ?? [];
  if (!testCases.length) {
    return { score: 0, runs: [] as Awaited<ReturnType<typeof executeJudge0>>[] };
  }

  const runs = [];
  let passed = 0;

  for (const testCase of testCases) {
    const execution = await executeJudge0({
      language: question.language,
      sourceCode: code,
      stdin: testCase.input,
      expectedOutput: testCase.expectedOutput,
    });
    if (execution.passed) {
      passed += 1;
    }
    runs.push(execution);
  }

  return {
    score: Math.round((passed / testCases.length) * question.marks),
    runs,
  };
}

async function computePlagiarismForSubmission(
  assessmentId: mongoose.Types.ObjectId,
  submissionId: mongoose.Types.ObjectId,
  answers: Array<{ questionIndex: number; answerText?: string }>
) {
  const peerSubmissions = await AssessmentSubmission.find({
    assessmentId,
    _id: { $ne: submissionId },
    submittedAt: { $exists: true },
  })
    .select('answers')
    .lean();

  return answers.map((answer) => {
    const text = cleanText(answer.answerText);
    if (!text) {
      return { questionIndex: answer.questionIndex, plagiarismScore: 0, plagiarismMatches: [] };
    }

    const matches = peerSubmissions
      .map((submission) => {
        const peerAnswer = submission.answers.find(
          (item: SubmissionAnswer) => item.questionIndex === answer.questionIndex
        );
        const score = similarityScore(text, peerAnswer?.answerText);
        return { submissionId: submission._id, score };
      })
      .filter((item) => item.score >= 25)
      .sort((left, right) => right.score - left.score)
      .slice(0, 3);

    return {
      questionIndex: answer.questionIndex,
      plagiarismScore: matches[0]?.score ?? 0,
      plagiarismMatches: matches,
    };
  });
}

export async function createAssessment(input: {
  employerId: string;
  jobId: string;
  title: string;
  type: string;
  questions: AssessmentQuestionDraft[];
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  instructions?: string;
  isTimedAutoSubmit?: boolean;
  allowLateSubmission?: boolean;
  dueAt?: Date | null;
  reminderOffsetsMinutes?: number[];
  applicationIds?: string[];
}) {
  await connectDB();
  await assertEmployerPremiumEligibility(input.employerId);

  const job = await Job.findOne({ _id: input.jobId, employerId: input.employerId })
    .select('_id')
    .lean();
  if (!job) {
    throw new Error('Job not found.');
  }

  const assessment = await Assessment.create({
    employerId: input.employerId,
    jobId: input.jobId,
    title: input.title,
    type: input.type,
    questions: input.questions,
    totalMarks: input.totalMarks,
    passingMarks: input.passingMarks,
    durationMinutes: input.durationMinutes,
    instructions: cleanText(input.instructions) || undefined,
    dueAt: input.dueAt ?? undefined,
    reminderOffsetsMinutes:
      input.reminderOffsetsMinutes && input.reminderOffsetsMinutes.length > 0
        ? input.reminderOffsetsMinutes
        : [1440, 60],
    isTimedAutoSubmit: input.isTimedAutoSubmit ?? true,
    allowLateSubmission: input.allowLateSubmission ?? false,
  });

  if (input.applicationIds?.length) {
    await assignAssessmentToApplications({
      employerId: input.employerId,
      assessmentId: assessment._id.toString(),
      applicationIds: input.applicationIds,
      dueAt: input.dueAt ?? undefined,
    });
  }

  return assessment;
}

export async function assignAssessmentToApplications(input: {
  employerId: string;
  assessmentId: string;
  applicationIds: string[];
  dueAt?: Date | null;
}) {
  await connectDB();

  const assessment = await Assessment.findOne({
    _id: input.assessmentId,
    employerId: input.employerId,
  }).lean();
  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  const applicationIds = Array.from(new Set(input.applicationIds));
  const applications = await Application.find({
    _id: { $in: applicationIds.map(asObjectId) },
    employerId: input.employerId,
    jobId: assessment.jobId,
    isEventRegistration: false,
  })
    .select('studentId status')
    .lean();

  if (applications.length !== applicationIds.length) {
    throw new Error('Some selected applications could not be found.');
  }

  const invalidStatuses = applications.filter(
    (application) =>
      !ACTIVE_APPLICATION_STATUSES.includes(
        application.status as (typeof ACTIVE_APPLICATION_STATUSES)[number]
      )
  );
  if (invalidStatuses.length) {
    throw new Error('Only under-review or shortlisted candidates can receive assessments.');
  }

  await assertEmployerPremiumEligibility(input.employerId);

  const assignmentDueAt = input.dueAt ?? assessment.dueAt ?? undefined;
  const createdAssignments: mongoose.Types.ObjectId[] = [];

  for (const application of applications) {
    const assignment = await AssessmentAssignment.findOneAndUpdate(
      {
        assessmentId: assessment._id,
        applicationId: application._id,
      },
      {
        $set: {
          jobId: assessment.jobId,
          employerId: assessment.employerId,
          studentId: application.studentId,
          dueAt: assignmentDueAt,
        },
        $setOnInsert: {
          assessmentId: assessment._id,
          applicationId: application._id,
          assignedAt: new Date(),
          needsManualReview: assessment.questions.some((question: AssessmentQuestionDraft) =>
            question.type === 'case_study'
              ? true
              : question.type === 'short_answer'
                ? !(question.acceptedAnswers?.length ?? 0)
                : false
          ),
        },
      },
      { upsert: true, new: true }
    );

    createdAssignments.push(assignment._id);
    await updateApplicationForAssessment({
      applicationId: application._id,
      employerId: input.employerId,
      assessmentId: assessment._id,
      assignmentId: assignment._id,
      dueAt: assignmentDueAt,
    });
  }

  await Assessment.findByIdAndUpdate(assessment._id, {
    $addToSet: {
      assignedApplicationIds: { $each: applications.map((application) => application._id) },
    },
    ...(assignmentDueAt ? { $set: { dueAt: assignmentDueAt } } : {}),
  });

  return createdAssignments;
}

export async function startAssessmentAssignment(assignmentId: string, studentId: string) {
  await connectDB();

  const assignment = await AssessmentAssignment.findOne({
    _id: assignmentId,
    studentId,
  });
  if (!assignment) {
    throw new Error('Assessment assignment not found.');
  }

  const assessment = await Assessment.findById(assignment.assessmentId).lean();
  if (!assessment || !assessment.isActive) {
    throw new Error('This assessment is no longer active.');
  }

  await assertStudentPremiumAccess(studentId, 'assessment');

  if (assignment.dueAt && !assessment.allowLateSubmission && assignment.dueAt < new Date()) {
    assignment.status = 'expired';
    await assignment.save();
    throw new Error('The assessment deadline has already passed.');
  }

  let submission = await AssessmentSubmission.findOne({ assignmentId: assignment._id });
  if (!submission) {
    submission = await AssessmentSubmission.create({
      assessmentId: assignment.assessmentId,
      assignmentId: assignment._id,
      employerId: assignment.employerId,
      studentId: assignment.studentId,
      applicationId: assignment.applicationId,
      startedAt: new Date(),
      answers: [],
    });
  }

  if (assignment.status === 'assigned') {
    assignment.status = 'started';
    assignment.startedAt = submission.startedAt;
  }
  assignment.lastOpenedAt = new Date();
  await assignment.save();

  return submission;
}

export async function runAssessmentCodingQuestion(input: {
  assignmentId: string;
  studentId: string;
  questionIndex: number;
  code: string;
  stdin?: string;
}) {
  await connectDB();

  const assignment = await AssessmentAssignment.findOne({
    _id: input.assignmentId,
    studentId: input.studentId,
  }).lean();
  if (!assignment) {
    throw new Error('Assessment assignment not found.');
  }

  await assertStudentPremiumAccess(input.studentId, 'assessment');

  const assessment = await Assessment.findById(assignment.assessmentId).lean();
  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  const question = (assessment.questions as unknown as AssessmentQuestionDraft[]).find(
    (item: AssessmentQuestionDraft) => item.index === input.questionIndex
  );
  if (!question || question.type !== 'coding' || !question.language) {
    throw new Error('Coding question not found.');
  }

  const sampleTestCase =
    question.testCases?.find((testCase: AssessmentTestCase) => testCase.isSample) ??
    question.testCases?.[0];
  return executeJudge0({
    language: question.language,
    sourceCode: input.code,
    stdin: typeof input.stdin === 'string' ? input.stdin : sampleTestCase?.input,
    expectedOutput: sampleTestCase?.expectedOutput,
  });
}

export async function submitAssessmentAssignment(input: {
  assignmentId: string;
  studentId: string;
  answers: AssessmentAnswerPayload[];
  autoSubmit?: boolean;
}) {
  await connectDB();

  const assignment = await AssessmentAssignment.findOne({
    _id: input.assignmentId,
    studentId: input.studentId,
  });
  if (!assignment) {
    throw new Error('Assessment assignment not found.');
  }

  await assertStudentPremiumAccess(input.studentId, 'assessment');

  const assessment = await Assessment.findById(assignment.assessmentId).lean();
  if (!assessment) {
    throw new Error('Assessment not found.');
  }

  if (!assessment.allowLateSubmission && assignment.dueAt && assignment.dueAt < new Date()) {
    assignment.status = 'expired';
    await assignment.save();
    throw new Error('The assessment deadline has already passed.');
  }

  let submission = await AssessmentSubmission.findOne({ assignmentId: assignment._id });
  if (!submission) {
    submission = await AssessmentSubmission.create({
      assessmentId: assignment.assessmentId,
      assignmentId: assignment._id,
      employerId: assignment.employerId,
      studentId: assignment.studentId,
      applicationId: assignment.applicationId,
      startedAt: new Date(),
      answers: [],
    });
  }

  const answerMap = new Map(input.answers.map((answer) => [answer.questionIndex, answer]));
  const evaluatedAnswers: Array<(typeof submission.answers)[number]> = [];
  let objectiveScore = 0;
  const manualScore = 0;
  let needsManualReview = false;

  for (const question of assessment.questions as unknown as AssessmentQuestionDraft[]) {
    const rawAnswer = answerMap.get(question.index);

    if (question.type === 'mcq') {
      const score = scoreMcq(question, rawAnswer?.selectedOptionIndex);
      objectiveScore += score;
      evaluatedAnswers.push({
        questionIndex: question.index,
        selectedOptionIndex: rawAnswer?.selectedOptionIndex,
        answerText:
          typeof rawAnswer?.selectedOptionIndex === 'number'
            ? (question.options?.[rawAnswer.selectedOptionIndex] ?? '')
            : '',
        objectiveMarksAwarded: score,
        marksAwarded: score,
      });
      continue;
    }

    if (question.type === 'short_answer') {
      const shortResult = scoreShortAnswer(question, rawAnswer?.answerText);
      objectiveScore += shortResult.score;
      needsManualReview ||= shortResult.needsManualReview;
      evaluatedAnswers.push({
        questionIndex: question.index,
        answerText: cleanText(rawAnswer?.answerText),
        objectiveMarksAwarded: shortResult.score,
        marksAwarded: shortResult.score,
      });
      continue;
    }

    if (question.type === 'coding') {
      const codingResult = await scoreCodingQuestion(question, rawAnswer?.code);
      objectiveScore += codingResult.score;
      const finalRun = codingResult.runs.at(-1);
      evaluatedAnswers.push({
        questionIndex: question.index,
        code: cleanText(rawAnswer?.code),
        answerText: cleanText(rawAnswer?.code),
        objectiveMarksAwarded: codingResult.score,
        marksAwarded: codingResult.score,
        executionStatus: finalRun?.status ?? 'Not executed',
        executionOutput: finalRun?.stdout ?? '',
        executionError: finalRun?.stderr || finalRun?.compileOutput || finalRun?.message || '',
        judge0SubmissionToken: finalRun?.token,
      });
      continue;
    }

    needsManualReview = true;
    evaluatedAnswers.push({
      questionIndex: question.index,
      answerText: cleanText(rawAnswer?.answerText),
      uploadedFiles: rawAnswer?.uploadedFiles ?? [],
      objectiveMarksAwarded: 0,
      marksAwarded: 0,
    });
  }

  submission.answers = evaluatedAnswers;
  submission.objectiveScore = objectiveScore;
  submission.manualScore = manualScore;
  submission.totalScore = objectiveScore + manualScore;
  submission.isPassed = !needsManualReview && submission.totalScore >= assessment.passingMarks;
  submission.submittedAt = new Date();
  submission.isAutoSubmitted = Boolean(input.autoSubmit);
  submission.timeTakenSeconds = Math.max(
    1,
    Math.round((submission.submittedAt.getTime() - submission.startedAt.getTime()) / 1000)
  );

  const plagiarism = await computePlagiarismForSubmission(
    assessment._id,
    submission._id,
    submission.answers
  );
  submission.answers = submission.answers.map((answer: SubmissionAnswer) => {
    const match = plagiarism.find((item) => item.questionIndex === answer.questionIndex);
    if (!match) return answer;
    return {
      ...answer,
      plagiarismScore: match.plagiarismScore,
      plagiarismMatches: match.plagiarismMatches,
    };
  });

  await submission.save();

  assignment.status = needsManualReview ? 'submitted' : 'graded';
  assignment.startedAt = submission.startedAt;
  assignment.submittedAt = submission.submittedAt;
  assignment.gradedAt = needsManualReview ? undefined : new Date();
  assignment.objectiveScore = objectiveScore;
  assignment.manualScore = manualScore;
  assignment.totalScore = submission.totalScore;
  assignment.isPassed = submission.isPassed;
  assignment.needsManualReview = needsManualReview;
  await assignment.save();

  await Application.findByIdAndUpdate(assignment.applicationId, {
    assessmentScore: submission.totalScore,
    assessmentPassed: submission.isPassed,
    assessmentSubmittedAt: submission.submittedAt,
  });

  return {
    submissionId: submission._id.toString(),
    totalScore: submission.totalScore ?? 0,
    needsManualReview,
    isPassed: submission.isPassed ?? false,
  };
}

export async function gradeAssessmentAssignment(input: {
  employerId: string;
  assignmentId: string;
  manualAdjustments: Array<{
    questionIndex: number;
    marksAwarded: number;
    evaluationNotes?: string;
  }>;
}) {
  await connectDB();

  const assignment = await AssessmentAssignment.findOne({
    _id: input.assignmentId,
    employerId: input.employerId,
  });
  if (!assignment) {
    throw new Error('Assessment assignment not found.');
  }

  const assessment = await Assessment.findById(assignment.assessmentId).lean();
  const submission = await AssessmentSubmission.findOne({
    assignmentId: assignment._id,
  });
  if (!assessment || !submission) {
    throw new Error('Assessment submission not found.');
  }

  let manualScore = 0;
  submission.answers = submission.answers.map((answer: SubmissionAnswer) => {
    const adjustment = input.manualAdjustments.find(
      (item) => item.questionIndex === answer.questionIndex
    );
    if (!adjustment) return answer;
    manualScore += adjustment.marksAwarded;
    return {
      ...answer,
      manualMarksAwarded: adjustment.marksAwarded,
      marksAwarded: (answer.objectiveMarksAwarded ?? 0) + adjustment.marksAwarded,
      evaluationNotes: cleanText(adjustment.evaluationNotes),
    };
  });

  submission.manualScore = manualScore;
  submission.totalScore = (submission.objectiveScore ?? 0) + manualScore;
  submission.isPassed = submission.totalScore >= assessment.passingMarks;
  await submission.save();

  assignment.manualScore = manualScore;
  assignment.totalScore = submission.totalScore;
  assignment.isPassed = submission.isPassed;
  assignment.status = 'graded';
  assignment.gradedAt = new Date();
  assignment.needsManualReview = false;
  await assignment.save();

  await Application.findByIdAndUpdate(assignment.applicationId, {
    assessmentScore: submission.totalScore,
    assessmentPassed: submission.isPassed,
  });

  return submission;
}

export async function scheduleInterviewSessions(input: {
  employerId: string;
  applicationIds: string[];
  title: string;
  description?: string;
  mode?: 'one_on_one' | 'panel';
  scheduledAt: Date;
  durationMinutes: number;
  panelists?: { name: string; email?: string }[];
}) {
  await connectDB();

  const applications = await Application.find({
    _id: { $in: input.applicationIds.map(asObjectId) },
    employerId: input.employerId,
    isEventRegistration: false,
  })
    .select('studentId status jobId')
    .lean();

  if (applications.length !== input.applicationIds.length) {
    throw new Error('Some selected applications could not be found.');
  }

  await assertEmployerPremiumEligibility(input.employerId);

  const interviews = [];
  for (const application of applications) {
    const channelName = `nextern-${application._id.toString().slice(-8)}-${Date.now().toString(36)}`;
    const session = await InterviewSession.findOneAndUpdate(
      { applicationId: application._id },
      {
        $set: {
          jobId: application.jobId,
          employerId: input.employerId,
          studentId: application.studentId,
          title: input.title,
          description: cleanText(input.description) || undefined,
          mode: input.mode ?? 'one_on_one',
          scheduledAt: input.scheduledAt,
          durationMinutes: input.durationMinutes,
          panelists:
            input.panelists && input.panelists.length > 0
              ? input.panelists.map((panelist, index) => ({
                  name: panelist.name,
                  email: cleanText(panelist.email) || undefined,
                  role: index === 0 ? 'panelist' : 'guest',
                }))
              : [],
          agoraChannelName: channelName,
          status: 'scheduled',
        },
        $setOnInsert: {
          consentStatus: 'pending',
          recordingStatus: 'waiting_for_consent',
        },
      },
      { upsert: true, new: true }
    );

    interviews.push(session);
    await updateApplicationForInterview({
      applicationId: application._id,
      employerId: input.employerId,
      interviewId: session._id,
      scheduledAt: input.scheduledAt,
      agoraChannelName: session.agoraChannelName,
    });
  }

  return interviews;
}

export async function issueInterviewJoinToken(input: {
  interviewId: string;
  userId: string;
  role: 'student' | 'employer';
}) {
  await connectDB();

  const interview = await InterviewSession.findById(input.interviewId).lean();
  if (!interview) {
    throw new Error('Interview session not found.');
  }

  if (
    (input.role === 'student' && interview.studentId.toString() !== input.userId) ||
    (input.role === 'employer' && interview.employerId.toString() !== input.userId)
  ) {
    throw new Error('You do not have access to this interview.');
  }

  if (input.role === 'student') {
    await assertStudentPremiumAccess(input.userId, 'interview');
  } else {
    await assertEmployerPremiumEligibility(input.userId);
  }

  const { appId, appCertificate } = ensureAgoraConfig();
  const uid = derivedAgoraUid(`${input.userId}:${interview._id.toString()}:${input.role}`);
  const expireSeconds = Number(process.env.AGORA_TOKEN_EXPIRE_SECONDS ?? 3600);
  const privilegeExpire = Math.floor(Date.now() / 1000) + expireSeconds;
  const token = appCertificate
    ? RtcTokenBuilder.buildTokenWithUid(
        appId,
        appCertificate,
        interview.agoraChannelName,
        uid,
        input.role === 'student' ? RtcRole.SUBSCRIBER : RtcRole.PUBLISHER,
        privilegeExpire,
        privilegeExpire
      )
    : null;

  if (interview.status === 'scheduled') {
    await InterviewSession.findByIdAndUpdate(interview._id, {
      $set: { status: 'live', startedAt: new Date() },
    });
  }

  return {
    appId,
    channelName: interview.agoraChannelName,
    token,
    uid,
  };
}

export async function updateInterviewSession(input: {
  interviewId: string;
  actorId: string;
  role: 'student' | 'employer';
  action:
    | 'update_notes'
    | 'update_scorecard'
    | 'mark_live'
    | 'mark_completed'
    | 'cancel'
    | 'consent_granted'
    | 'consent_declined'
    | 'recording_uploaded';
  liveNotes?: string;
  scorecard?: {
    communication?: number;
    technical?: number;
    problemSolving?: number;
    cultureFit?: number;
    confidence?: number;
    recommendation?: InterviewRecommendation;
    summary?: string;
  };
  recordingAsset?: { url: string; name: string; type: string };
}) {
  await connectDB();

  const interview = await InterviewSession.findById(input.interviewId);
  if (!interview) {
    throw new Error('Interview session not found.');
  }

  if (
    (input.role === 'student' && interview.studentId.toString() !== input.actorId) ||
    (input.role === 'employer' && interview.employerId.toString() !== input.actorId)
  ) {
    throw new Error('You do not have permission to update this interview.');
  }

  switch (input.action) {
    case 'update_notes':
      if (input.role !== 'employer') {
        throw new Error('Only the hiring team can update interview notes.');
      }
      interview.liveNotes = cleanText(input.liveNotes);
      break;
    case 'update_scorecard':
      if (input.role !== 'employer') {
        throw new Error('Only the hiring team can update interview scores.');
      }
      interview.scorecard = {
        ...interview.scorecard,
        ...input.scorecard,
      };
      interview.scorecard.overallScore =
        averageInterviewScore([
          interview.scorecard.communication,
          interview.scorecard.technical,
          interview.scorecard.problemSolving,
          interview.scorecard.cultureFit,
          interview.scorecard.confidence,
        ]) ?? undefined;
      break;
    case 'mark_live':
      interview.status = 'live';
      interview.startedAt = interview.startedAt ?? new Date();
      break;
    case 'mark_completed':
      if (input.role !== 'employer') {
        throw new Error('Only the hiring team can complete the interview.');
      }
      interview.status = 'completed';
      interview.completedAt = new Date();
      break;
    case 'cancel':
      if (input.role !== 'employer') {
        throw new Error('Only the hiring team can cancel the interview.');
      }
      interview.status = 'cancelled';
      break;
    case 'consent_granted':
      interview.consentStatus = 'granted';
      interview.consentUpdatedAt = new Date();
      interview.recordingStatus = 'ready';
      break;
    case 'consent_declined':
      interview.consentStatus = 'declined';
      interview.consentUpdatedAt = new Date();
      interview.recordingStatus = 'disabled';
      break;
    case 'recording_uploaded':
      if (input.role !== 'employer') {
        throw new Error('Only the hiring team can attach the interview recording.');
      }
      if (!input.recordingAsset) {
        throw new Error('Recording asset is required.');
      }
      interview.recordingAsset = input.recordingAsset;
      interview.recordingStatus = 'uploaded';
      break;
  }

  await interview.save();

  if (
    input.action === 'mark_completed' ||
    input.action === 'update_scorecard' ||
    input.action === 'recording_uploaded'
  ) {
    await Application.findByIdAndUpdate(interview.applicationId, {
      interviewNotes: interview.liveNotes,
      interviewRecordingUrl: interview.recordingAsset?.url,
      interviewScore: interview.scorecard.overallScore,
    });
  }

  return interview;
}

async function sendAssessmentReminderNotifications(now: Date) {
  const upcomingAssignments = await AssessmentAssignment.find({
    status: { $in: ['assigned', 'started'] },
    dueAt: { $gt: now, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
  })
    .populate('assessmentId', 'title reminderOffsetsMinutes')
    .populate('applicationId', 'jobId')
    .lean();

  for (const assignment of upcomingAssignments) {
    const assessment = assignment.assessmentId as {
      title?: string;
      reminderOffsetsMinutes?: number[];
    } | null;
    const application = assignment.applicationId as { jobId?: mongoose.Types.ObjectId } | null;
    if (!assessment?.title || !assignment.dueAt) continue;

    const minutesLeft = Math.round((new Date(assignment.dueAt).getTime() - now.getTime()) / 60000);
    const offsets = assessment.reminderOffsetsMinutes?.length
      ? assessment.reminderOffsetsMinutes
      : [1440, 60];
    const nextOffset = offsets.find(
      (offset) => minutesLeft <= offset && !assignment.reminderSentOffsetsMinutes.includes(offset)
    );

    if (!nextOffset) continue;

    await createNotification({
      userId: assignment.studentId.toString(),
      type: 'assessment_assigned',
      title: `Assessment reminder — ${assessment.title}`,
      body:
        nextOffset >= 1440
          ? `Your assessment "${assessment.title}" is due within 24 hours.`
          : `Your assessment "${assessment.title}" is due within the next hour.`,
      link: `/student/assessments/${assignment._id}`,
      meta: {
        assignmentId: assignment._id.toString(),
        jobId: application?.jobId?.toString(),
      },
      preferenceKey: 'application_assessment_sent',
    });

    await AssessmentAssignment.findByIdAndUpdate(assignment._id, {
      $addToSet: { reminderSentOffsetsMinutes: nextOffset },
    });
  }
}

async function sendInterviewReminderNotifications(now: Date) {
  const interviews = await InterviewSession.find({
    status: 'scheduled',
    scheduledAt: { $gt: now, $lt: new Date(now.getTime() + 24 * 60 * 60 * 1000) },
  }).lean();

  for (const interview of interviews) {
    const minutesLeft = Math.round(
      (new Date(interview.scheduledAt).getTime() - now.getTime()) / 60000
    );
    const offsets = [1440, 60];
    const nextOffset = offsets.find(
      (offset) => minutesLeft <= offset && !interview.reminderSentOffsetsMinutes.includes(offset)
    );

    if (!nextOffset) continue;

    await createNotification({
      userId: interview.studentId.toString(),
      type: 'interview_scheduled',
      title: `Interview reminder — ${interview.title}`,
      body:
        nextOffset >= 1440
          ? `Your interview "${interview.title}" is scheduled within 24 hours.`
          : `Your interview "${interview.title}" starts within the next hour.`,
      link: `/student/interviews/${interview._id}`,
      meta: {
        interviewId: interview._id.toString(),
        scheduledAt: interview.scheduledAt.toISOString(),
      },
      preferenceKey: 'application_interview',
    });

    await InterviewSession.findByIdAndUpdate(interview._id, {
      $addToSet: { reminderSentOffsetsMinutes: nextOffset },
    });
  }
}

export async function sendHiringSuiteReminders() {
  await connectDB();
  const now = new Date();
  await Promise.all([
    sendAssessmentReminderNotifications(now),
    sendInterviewReminderNotifications(now),
  ]);
}
