export const ASSESSMENT_QUESTION_TYPES = ['mcq', 'short_answer', 'coding', 'case_study'] as const;

export const ASSESSMENT_TYPES = ['mcq', 'short_answer', 'coding', 'case_study', 'mixed'] as const;

export const ASSESSMENT_ASSIGNMENT_STATUSES = [
  'assigned',
  'started',
  'submitted',
  'graded',
  'expired',
] as const;

export const INTERVIEW_SESSION_STATUSES = ['scheduled', 'live', 'completed', 'cancelled'] as const;

export const INTERVIEW_SESSION_MODES = ['one_on_one', 'panel'] as const;

export const INTERVIEW_RECOMMENDATIONS = ['strong_yes', 'yes', 'maybe', 'no'] as const;

export const INTERVIEW_CONSENT_STATUSES = ['pending', 'granted', 'declined'] as const;

export const INTERVIEW_RECORDING_STATUSES = [
  'disabled',
  'waiting_for_consent',
  'ready',
  'recording',
  'uploaded',
  'failed',
] as const;

export const CODING_LANGUAGES = ['javascript', 'typescript', 'python', 'java', 'cpp'] as const;

export type AssessmentQuestionType = (typeof ASSESSMENT_QUESTION_TYPES)[number];
export type AssessmentType = (typeof ASSESSMENT_TYPES)[number];
export type AssessmentAssignmentStatus = (typeof ASSESSMENT_ASSIGNMENT_STATUSES)[number];
export type InterviewSessionStatus = (typeof INTERVIEW_SESSION_STATUSES)[number];
export type InterviewSessionMode = (typeof INTERVIEW_SESSION_MODES)[number];
export type InterviewRecommendation = (typeof INTERVIEW_RECOMMENDATIONS)[number];
export type InterviewConsentStatus = (typeof INTERVIEW_CONSENT_STATUSES)[number];
export type InterviewRecordingStatus = (typeof INTERVIEW_RECORDING_STATUSES)[number];
export type CodingLanguage = (typeof CODING_LANGUAGES)[number];

export type HiringAsset = {
  url: string;
  name: string;
  type: string;
};

export type CodingTestCase = {
  input: string;
  expectedOutput: string;
  isSample?: boolean;
};

export type AssessmentQuestionDraft = {
  index: number;
  type: AssessmentQuestionType;
  questionText: string;
  marks: number;
  options?: string[];
  correctOptionIndex?: number;
  acceptedAnswers?: string[];
  enablePlagiarismCheck?: boolean;
  language?: CodingLanguage;
  starterCode?: string;
  testCases?: CodingTestCase[];
  rubric?: string;
  attachments?: HiringAsset[];
  maxWords?: number;
};

export type AssessmentAnswerPayload = {
  questionIndex: number;
  answerText?: string;
  selectedOptionIndex?: number;
  code?: string;
  uploadedFiles?: HiringAsset[];
};

export function formatAssessmentAssignmentStatus(status: string) {
  return status
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function formatInterviewRecommendation(value?: string | null) {
  if (!value) return 'Not rated';
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

export function averageInterviewScore(parts: Array<number | null | undefined>) {
  const valid = parts.filter((value): value is number => typeof value === 'number');
  if (valid.length === 0) return null;
  return Math.round(valid.reduce((sum, value) => sum + value, 0) / valid.length);
}
