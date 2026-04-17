'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from 'react';
import { useUploadThing } from '@/lib/uploadthing';
import type { AssessmentAnswerPayload, HiringAsset } from '@/lib/hiring-suite-shared';
import { CheckCircle2, Clock3, Loader2, Play, Upload } from 'lucide-react';

type AssignmentData = {
  _id: string;
  status: string;
  dueAt?: string | null;
};

type AssessmentQuestion = {
  index: number;
  type: 'mcq' | 'short_answer' | 'coding' | 'case_study';
  questionText: string;
  marks: number;
  options?: string[];
  enablePlagiarismCheck?: boolean;
  language?: string;
  starterCode?: string;
  rubric?: string;
  maxWords?: number;
  attachments?: HiringAsset[];
  testCases?: { input: string; expectedOutput: string; isSample?: boolean }[];
};

type AssessmentData = {
  _id: string;
  title: string;
  instructions?: string;
  durationMinutes: number;
  passingMarks: number;
  isTimedAutoSubmit: boolean;
  allowLateSubmission: boolean;
  dueAt?: string | null;
  questions: AssessmentQuestion[];
};

type SubmissionData = {
  _id: string;
  startedAt: string;
  submittedAt?: string | null;
  totalScore?: number | null;
  isPassed?: boolean | null;
  answers?: Array<{
    questionIndex: number;
    answerText?: string;
    selectedOptionIndex?: number;
    code?: string;
    uploadedFiles?: HiringAsset[];
    objectiveMarksAwarded?: number;
    manualMarksAwarded?: number;
    marksAwarded?: number;
    executionStatus?: string;
    executionOutput?: string;
    executionError?: string;
    plagiarismScore?: number;
  }>;
};

type Props = {
  assignment: AssignmentData;
  assessment: AssessmentData;
  submission: SubmissionData | null;
};

type AnswerState = Record<
  number,
  {
    selectedOptionIndex?: number;
    answerText?: string;
    code?: string;
    uploadedFiles?: HiringAsset[];
  }
>;

function formatDateTime(value?: string | null) {
  if (!value) return 'No deadline';
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

function buildInitialAnswers(submission: SubmissionData | null) {
  const answers: AnswerState = {};
  for (const answer of submission?.answers ?? []) {
    answers[answer.questionIndex] = {
      selectedOptionIndex: answer.selectedOptionIndex,
      answerText: answer.answerText ?? '',
      code: answer.code ?? answer.answerText ?? '',
      uploadedFiles: answer.uploadedFiles ?? [],
    };
  }
  return answers;
}

const fieldStyle = {
  width: '100%',
  padding: '11px 12px',
  borderRadius: 12,
  border: '1px solid #D9E2EC',
  background: '#FFFFFF',
  color: '#0F172A',
  fontSize: 13,
  outline: 'none',
} as const;

export default function StudentAssessmentClient({ assignment, assessment, submission }: Props) {
  const [currentAssignment, setCurrentAssignment] = useState(assignment);
  const [currentSubmission, setCurrentSubmission] = useState(submission);
  const [answers, setAnswers] = useState<AnswerState>(() => buildInitialAnswers(submission));
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [runOutput, setRunOutput] = useState<Record<number, string>>({});
  const [runningQuestion, setRunningQuestion] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const autoSubmittedRef = useRef(false);
  const { startUpload, isUploading } = useUploadThing('assessmentAttachmentUploader');
  const startedAt = currentSubmission?.startedAt
    ? new Date(currentSubmission.startedAt).getTime()
    : null;
  const [now, setNow] = useState(Date.now());
  const remainingSeconds = useMemo(() => {
    if (!startedAt || !assessment.isTimedAutoSubmit) return null;
    const limit = assessment.durationMinutes * 60;
    return Math.max(0, limit - Math.floor((now - startedAt) / 1000));
  }, [assessment.durationMinutes, assessment.isTimedAutoSubmit, now, startedAt]);
  const isSubmitted = Boolean(currentSubmission?.submittedAt);

  useEffect(() => {
    if (!startedAt || isSubmitted || remainingSeconds === null) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [isSubmitted, remainingSeconds, startedAt]);

  const handleAutoSubmit = useEffectEvent(() => {
    submitAssessment(true);
  });

  useEffect(() => {
    if (
      !assessment.isTimedAutoSubmit ||
      isSubmitted ||
      remainingSeconds !== 0 ||
      autoSubmittedRef.current
    ) {
      return;
    }

    autoSubmittedRef.current = true;
    handleAutoSubmit();
  }, [assessment.isTimedAutoSubmit, isSubmitted, remainingSeconds]);

  function updateAnswer(questionIndex: number, patch: Partial<AnswerState[number]>) {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: {
        ...(current[questionIndex] ?? {}),
        ...patch,
      },
    }));
  }

  function buildPayload(): AssessmentAnswerPayload[] {
    return assessment.questions.map((question) => ({
      questionIndex: question.index,
      selectedOptionIndex: answers[question.index]?.selectedOptionIndex,
      answerText: answers[question.index]?.answerText,
      code: answers[question.index]?.code,
      uploadedFiles: answers[question.index]?.uploadedFiles ?? [],
    }));
  }

  function submitAssessment(autoSubmit = false) {
    startTransition(async () => {
      setNotice(null);
      try {
        const res = await fetch(`/api/assessments/assignments/${currentAssignment._id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: buildPayload(), autoSubmit }),
        });
        const data = (await res.json()) as {
          error?: string;
          result?: { totalScore: number; needsManualReview: boolean; isPassed: boolean };
        };

        if (!res.ok) {
          setNotice({
            tone: 'error',
            text: data.error ?? 'Unable to submit the assessment right now.',
          });
          return;
        }

        setCurrentSubmission((current) => ({
          ...(current ?? { _id: 'submitted', startedAt: new Date().toISOString() }),
          submittedAt: new Date().toISOString(),
          totalScore: data.result?.totalScore ?? null,
          isPassed: data.result?.isPassed ?? null,
          answers: buildPayload(),
        }));
        setCurrentAssignment((current) => ({
          ...current,
          status: data.result?.needsManualReview ? 'submitted' : 'graded',
        }));
        setNotice({
          tone: 'success',
          text: autoSubmit
            ? 'Time expired, so your assessment was submitted automatically.'
            : 'Assessment submitted successfully.',
        });
      } catch {
        setNotice({
          tone: 'error',
          text: 'Network error while submitting the assessment. Please try again.',
        });
      }
    });
  }

  async function handleStart() {
    setNotice(null);
    try {
      const res = await fetch(`/api/assessments/assignments/${currentAssignment._id}/start`, {
        method: 'POST',
      });
      const data = (await res.json()) as { error?: string; submission?: SubmissionData };
      if (!res.ok) {
        setNotice({ tone: 'error', text: data.error ?? 'Unable to start the assessment.' });
        return;
      }

      setCurrentSubmission(data.submission ?? null);
      setCurrentAssignment((current) => ({ ...current, status: 'started' }));
      setNow(Date.now());
    } catch {
      setNotice({ tone: 'error', text: 'Network error while starting the assessment.' });
    }
  }

  async function handleRun(questionIndex: number) {
    const code = answers[questionIndex]?.code ?? '';
    setRunningQuestion(questionIndex);
    setRunOutput((current) => ({ ...current, [questionIndex]: '' }));

    try {
      const res = await fetch(`/api/assessments/assignments/${currentAssignment._id}/run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionIndex, code }),
      });
      const data = (await res.json()) as {
        error?: string;
        execution?: {
          stdout?: string;
          stderr?: string;
          compileOutput?: string;
          message?: string;
          status?: string;
        };
      };

      if (!res.ok) {
        setRunOutput((current) => ({
          ...current,
          [questionIndex]: data.error ?? 'Run failed.',
        }));
        return;
      }

      setRunOutput((current) => ({
        ...current,
        [questionIndex]:
          data.execution?.stdout ||
          data.execution?.stderr ||
          data.execution?.compileOutput ||
          data.execution?.message ||
          data.execution?.status ||
          'Code executed successfully.',
      }));
    } catch {
      setRunOutput((current) => ({
        ...current,
        [questionIndex]: 'Network error while running the code.',
      }));
    } finally {
      setRunningQuestion(null);
    }
  }

  async function handleUploadFiles(questionIndex: number, files: FileList | null) {
    if (!files?.length) return;
    const uploaded = await startUpload(Array.from(files));
    if (!uploaded?.length) return;

    updateAnswer(questionIndex, {
      uploadedFiles: [
        ...(answers[questionIndex]?.uploadedFiles ?? []),
        ...uploaded.map((file) => ({ url: file.ufsUrl, name: file.name, type: file.type })),
      ],
    });
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {notice ? (
        <div
          style={{
            borderRadius: 16,
            padding: '12px 14px',
            background: notice.tone === 'success' ? '#ECFDF5' : '#FEF2F2',
            color: notice.tone === 'success' ? '#065F46' : '#991B1B',
            border: `1px solid ${notice.tone === 'success' ? '#A7F3D0' : '#FECACA'}`,
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {notice.text}
        </div>
      ) : null}

      {!currentSubmission ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #D9E2EC',
            padding: 24,
            boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
          }}
        >
          <div
            style={{
              fontSize: 18,
              fontWeight: 900,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
            }}
          >
            Ready to start?
          </div>
          <div style={{ marginTop: 8, fontSize: 14, color: '#64748B', lineHeight: 1.7 }}>
            Once you begin, the timer starts immediately. Due date:{' '}
            {formatDateTime(assignment.dueAt ?? assessment.dueAt)}.
          </div>
          {assessment.instructions ? (
            <div
              style={{
                marginTop: 16,
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                padding: '14px 16px',
                fontSize: 13,
                color: '#334155',
                lineHeight: 1.7,
              }}
            >
              {assessment.instructions}
            </div>
          ) : null}
          <button
            type="button"
            onClick={handleStart}
            style={{
              marginTop: 18,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 14,
              padding: '12px 16px',
              fontSize: 13,
              fontWeight: 800,
              cursor: 'pointer',
            }}
          >
            <Play size={15} />
            Start assessment
          </button>
        </div>
      ) : null}

      {currentSubmission ? (
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 20,
            border: '1px solid #D9E2EC',
            padding: 18,
            boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
            display: 'flex',
            justifyContent: 'space-between',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div
            style={{ display: 'flex', gap: 18, flexWrap: 'wrap', fontSize: 13, color: '#475569' }}
          >
            <span>Started: {formatDateTime(currentSubmission.startedAt)}</span>
            <span>Duration: {assessment.durationMinutes} min</span>
            <span>Pass mark: {assessment.passingMarks}</span>
          </div>
          {remainingSeconds !== null && !isSubmitted ? (
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                borderRadius: 999,
                padding: '8px 12px',
                background: remainingSeconds < 300 ? '#FEF2F2' : '#EFF6FF',
                color: remainingSeconds < 300 ? '#991B1B' : '#2563EB',
                border: `1px solid ${remainingSeconds < 300 ? '#FECACA' : '#BFDBFE'}`,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <Clock3 size={14} />
              {Math.floor(remainingSeconds / 60)}m {remainingSeconds % 60}s left
            </div>
          ) : null}
        </div>
      ) : null}

      {currentSubmission && (
        <div style={{ display: 'grid', gap: 14 }}>
          {assessment.questions.map((question) => {
            const answer = answers[question.index] ?? {};
            const submittedAnswer = currentSubmission.answers?.find(
              (item) => item.questionIndex === question.index
            );
            return (
              <div
                key={question.index}
                style={{
                  background: '#FFFFFF',
                  borderRadius: 20,
                  border: '1px solid #D9E2EC',
                  padding: 18,
                  boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                  display: 'grid',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'space-between',
                    gap: 12,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: 15,
                        fontWeight: 900,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      Question {question.index}
                    </div>
                    <div style={{ marginTop: 4, fontSize: 13, color: '#334155', lineHeight: 1.7 }}>
                      {question.questionText}
                    </div>
                  </div>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '6px 10px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#475569',
                      fontSize: 12,
                      fontWeight: 800,
                    }}
                  >
                    {question.marks} marks
                  </span>
                </div>

                {(question.attachments ?? []).length > 0 ? (
                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    {question.attachments?.map((asset) => (
                      <a
                        key={asset.url}
                        href={asset.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          borderRadius: 999,
                          padding: '6px 10px',
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        {asset.name}
                      </a>
                    ))}
                  </div>
                ) : null}

                {question.type === 'mcq' ? (
                  <div style={{ display: 'grid', gap: 8 }}>
                    {(question.options ?? []).map((option, optionIndex) => (
                      <label
                        key={`${question.index}-option-${optionIndex}`}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          borderRadius: 14,
                          border: '1px solid #E2E8F0',
                          padding: '11px 12px',
                          background: '#FFFFFF',
                          fontSize: 13,
                          color: '#334155',
                        }}
                      >
                        <input
                          type="radio"
                          name={`question-${question.index}`}
                          checked={answer.selectedOptionIndex === optionIndex}
                          onChange={() =>
                            updateAnswer(question.index, { selectedOptionIndex: optionIndex })
                          }
                          disabled={isSubmitted}
                        />
                        {option}
                      </label>
                    ))}
                  </div>
                ) : null}

                {question.type === 'short_answer' || question.type === 'case_study' ? (
                  <textarea
                    value={answer.answerText ?? ''}
                    onChange={(event) =>
                      updateAnswer(question.index, { answerText: event.target.value })
                    }
                    rows={question.type === 'case_study' ? 8 : 4}
                    style={{
                      ...fieldStyle,
                      resize: 'vertical',
                      minHeight: question.type === 'case_study' ? 180 : 110,
                    }}
                    disabled={isSubmitted}
                  />
                ) : null}

                {question.type === 'coding' ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <textarea
                      value={answer.code ?? question.starterCode ?? ''}
                      onChange={(event) =>
                        updateAnswer(question.index, { code: event.target.value })
                      }
                      rows={10}
                      style={{
                        ...fieldStyle,
                        resize: 'vertical',
                        minHeight: 220,
                        fontFamily: 'monospace',
                      }}
                      disabled={isSubmitted}
                    />
                    <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                      <button
                        type="button"
                        onClick={() => handleRun(question.index)}
                        disabled={runningQuestion === question.index || isSubmitted}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: 12,
                          padding: '10px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor:
                            runningQuestion === question.index || isSubmitted
                              ? 'not-allowed'
                              : 'pointer',
                        }}
                      >
                        {runningQuestion === question.index ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <Play size={14} />
                        )}
                        Run sample tests
                      </button>
                    </div>
                    {runOutput[question.index] ? (
                      <pre
                        style={{
                          margin: 0,
                          borderRadius: 14,
                          border: '1px solid #E2E8F0',
                          background: '#0F172A',
                          color: '#E2E8F0',
                          padding: '12px 14px',
                          fontSize: 12,
                          overflowX: 'auto',
                        }}
                      >
                        {runOutput[question.index]}
                      </pre>
                    ) : null}
                  </div>
                ) : null}

                {question.type === 'case_study' ? (
                  <div style={{ display: 'grid', gap: 10 }}>
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        borderRadius: 10,
                        border: '1px solid #BFDBFE',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        padding: '8px 10px',
                        fontSize: 12,
                        fontWeight: 800,
                        cursor: isSubmitted || isUploading ? 'not-allowed' : 'pointer',
                        width: 'fit-content',
                      }}
                    >
                      <Upload size={13} />
                      {isUploading ? 'Uploading...' : 'Upload supporting file'}
                      <input
                        type="file"
                        accept="image/*,.pdf"
                        multiple
                        style={{ display: 'none' }}
                        onChange={async (event) => {
                          const input = event.currentTarget;
                          const files = input.files;
                          input.value = '';
                          await handleUploadFiles(question.index, files);
                        }}
                        disabled={isSubmitted}
                      />
                    </label>
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(answer.uploadedFiles ?? []).map((file) => (
                        <span
                          key={file.url}
                          style={{
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#F8FAFC',
                            border: '1px solid #E2E8F0',
                            color: '#334155',
                            fontSize: 12,
                            fontWeight: 700,
                          }}
                        >
                          {file.name}
                        </span>
                      ))}
                    </div>
                  </div>
                ) : null}

                {submittedAnswer ? (
                  <div
                    style={{
                      borderRadius: 14,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      padding: '12px 14px',
                      display: 'flex',
                      gap: 14,
                      flexWrap: 'wrap',
                      fontSize: 12,
                      color: '#475569',
                    }}
                  >
                    {typeof submittedAnswer.marksAwarded === 'number' ? (
                      <span>Marks: {submittedAnswer.marksAwarded}</span>
                    ) : null}
                    {submittedAnswer.executionStatus ? (
                      <span>Run: {submittedAnswer.executionStatus}</span>
                    ) : null}
                    {typeof submittedAnswer.plagiarismScore === 'number' ? (
                      <span>Similarity: {submittedAnswer.plagiarismScore}%</span>
                    ) : null}
                  </div>
                ) : null}
              </div>
            );
          })}

          {!isSubmitted ? (
            <button
              type="button"
              onClick={() => submitAssessment(false)}
              disabled={isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 15,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? <Loader2 size={15} className="spin" /> : <CheckCircle2 size={15} />}
              {isPending ? 'Submitting...' : 'Submit assessment'}
            </button>
          ) : null}
        </div>
      )}

      <style>{`
        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
