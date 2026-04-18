'use client';

import { useEffect, useEffectEvent, useMemo, useRef, useState, useTransition } from 'react';
import { useUploadThing } from '@/lib/uploadthing';
import type { AssessmentAnswerPayload, HiringAsset } from '@/lib/hiring-suite-shared';
import { formatDhakaDateTime } from '@/lib/datetime';
import { AlertTriangle, CheckCircle2, Clock3, Loader2, Play, Upload, X } from 'lucide-react';

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
  codingExecutionEnabled: boolean;
};

type AssignmentSyncResponse = {
  assignment?: AssignmentData;
  submission?: SubmissionData | null;
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

function formatRemainingTime(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, '0')}`;
}

const START_RULES = [
  'Do not use AI tools, ChatGPT, or any external assistant to answer the assessment.',
  'Do not copy answers from other people, websites, or past submissions. Plagiarism may lead to rejection.',
  'The countdown starts as soon as you begin and keeps running even if you leave this page or close the browser.',
  'Submit before the timer ends. If time runs out, the assessment will be submitted automatically.',
  'Use a stable internet connection and start only when you are ready to complete the attempt seriously.',
] as const;

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

export default function StudentAssessmentClient({
  assignment,
  assessment,
  submission,
  codingExecutionEnabled,
}: Props) {
  const [currentAssignment, setCurrentAssignment] = useState(assignment);
  const [currentSubmission, setCurrentSubmission] = useState(submission);
  const [answers, setAnswers] = useState<AnswerState>(() => buildInitialAnswers(submission));
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [draftState, setDraftState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [startDialogOpen, setStartDialogOpen] = useState(false);
  const [startRulesAccepted, setStartRulesAccepted] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [runOutput, setRunOutput] = useState<Record<number, string>>({});
  const [runningQuestion, setRunningQuestion] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();
  const autoSubmittedRef = useRef(false);
  const lastSavedDraftRef = useRef('');
  const draftSubmissionKeyRef = useRef('');
  const { startUpload, isUploading } = useUploadThing('assessmentAttachmentUploader');
  const startedAt = currentSubmission?.startedAt
    ? new Date(currentSubmission.startedAt).getTime()
    : null;
  const answerPayload = useMemo<AssessmentAnswerPayload[]>(
    () =>
      assessment.questions.map((question) => ({
        questionIndex: question.index,
        selectedOptionIndex: answers[question.index]?.selectedOptionIndex,
        answerText: answers[question.index]?.answerText,
        code: answers[question.index]?.code,
        uploadedFiles: answers[question.index]?.uploadedFiles ?? [],
      })),
    [answers, assessment.questions]
  );
  const serializedAnswerPayload = useMemo(() => JSON.stringify(answerPayload), [answerPayload]);
  const [now, setNow] = useState(Date.now());
  const remainingSeconds = useMemo(() => {
    if (!startedAt || assessment.durationMinutes <= 0) return null;
    const limit = assessment.durationMinutes * 60;
    return Math.max(0, limit - Math.floor((now - startedAt) / 1000));
  }, [assessment.durationMinutes, now, startedAt]);
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
    if (isSubmitted || remainingSeconds !== 0 || autoSubmittedRef.current) {
      return;
    }

    autoSubmittedRef.current = true;
    handleAutoSubmit();
  }, [isSubmitted, remainingSeconds]);

  function updateAnswer(questionIndex: number, patch: Partial<AnswerState[number]>) {
    setAnswers((current) => ({
      ...current,
      [questionIndex]: {
        ...(current[questionIndex] ?? {}),
        ...patch,
      },
    }));
  }

  useEffect(() => {
    const submissionKey = currentSubmission?._id ?? '';
    if (!submissionKey || draftSubmissionKeyRef.current === submissionKey) return;
    draftSubmissionKeyRef.current = submissionKey;
    lastSavedDraftRef.current = serializedAnswerPayload;
  }, [currentSubmission, serializedAnswerPayload]);

  useEffect(() => {
    if (!currentSubmission || isSubmitted) return;

    if (serializedAnswerPayload === lastSavedDraftRef.current) {
      return;
    }

    setDraftState('saving');

    const timer = window.setTimeout(async () => {
      try {
        const res = await fetch(`/api/assessments/assignments/${currentAssignment._id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answerPayload }),
        });
        const data = (await res.json()) as { error?: string; submission?: SubmissionData | null };

        if (!res.ok) {
          throw new Error(data.error ?? 'Unable to save draft.');
        }

        lastSavedDraftRef.current = serializedAnswerPayload;
        setDraftState('saved');

        if (data.submission?.submittedAt) {
          setCurrentSubmission(data.submission);
          setCurrentAssignment((current) => ({ ...current, status: 'submitted' }));
          setNotice({
            tone: 'success',
            text: 'Time expired, so your assessment was submitted automatically.',
          });
          autoSubmittedRef.current = true;
          return;
        }

        window.setTimeout(() => {
          setDraftState((current) => (current === 'saved' ? 'idle' : current));
        }, 1200);
      } catch {
        setDraftState('error');
      }
    }, 700);

    return () => window.clearTimeout(timer);
  }, [
    answerPayload,
    currentAssignment._id,
    currentSubmission,
    isSubmitted,
    serializedAnswerPayload,
  ]);

  const syncTimedSession = useEffectEvent(async () => {
    if (!currentSubmission || isSubmitted) return;

    try {
      const res = await fetch(`/api/assessments/assignments/${currentAssignment._id}`, {
        cache: 'no-store',
      });
      const data = (await res.json()) as AssignmentSyncResponse & { error?: string };

      if (!res.ok || !data.assignment) {
        return;
      }

      setCurrentAssignment(data.assignment);

      if (data.submission?.submittedAt && !currentSubmission.submittedAt) {
        setCurrentSubmission(data.submission);
        setAnswers(buildInitialAnswers(data.submission));
        setDraftState('idle');
        autoSubmittedRef.current = true;
        setNotice({
          tone: 'success',
          text: 'Time expired, so your assessment was submitted automatically.',
        });
      }
    } catch {
      // Keep the current session running locally; the next sync will recover the latest state.
    }
  });

  const flushDraftOnLeave = useEffectEvent(async () => {
    if (!currentSubmission || isSubmitted) return;
    if (serializedAnswerPayload === lastSavedDraftRef.current) return;

    try {
      await fetch(`/api/assessments/assignments/${currentAssignment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: answerPayload }),
        keepalive: true,
      });
    } catch {
      // Best-effort save for tab close / page hide.
    }
  });

  useEffect(() => {
    if (!currentSubmission || isSubmitted) return;

    const interval = window.setInterval(() => {
      void syncTimedSession();
    }, 15000);

    const handlePageHide = () => {
      void flushDraftOnLeave();
    };

    const handleFocus = () => {
      void syncTimedSession();
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void flushDraftOnLeave();
        return;
      }

      void syncTimedSession();
    };

    window.addEventListener('pagehide', handlePageHide);
    window.addEventListener('focus', handleFocus);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener('pagehide', handlePageHide);
      window.removeEventListener('focus', handleFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [currentAssignment._id, currentSubmission, isSubmitted]);

  function submitAssessment(autoSubmit = false) {
    startTransition(async () => {
      setNotice(null);
      try {
        const res = await fetch(`/api/assessments/assignments/${currentAssignment._id}/submit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ answers: answerPayload, autoSubmit }),
        });
        const data = (await res.json()) as {
          error?: string;
          result?: {
            totalScore: number;
            needsManualReview: boolean;
            isPassed: boolean;
            submittedAt?: string | null;
          };
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
          submittedAt: data.result?.submittedAt ?? new Date().toISOString(),
          totalScore: data.result?.totalScore ?? null,
          isPassed: data.result?.isPassed ?? null,
          answers: answerPayload,
        }));
        setCurrentAssignment((current) => ({
          ...current,
          status: data.result?.needsManualReview ? 'submitted' : 'graded',
        }));
        lastSavedDraftRef.current = JSON.stringify(answerPayload);
        setDraftState('idle');
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
    setIsStarting(true);
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
      setAnswers(buildInitialAnswers(data.submission ?? null));
      setCurrentAssignment((current) => ({
        ...current,
        status: data.submission?.submittedAt ? 'submitted' : 'started',
      }));
      setStartDialogOpen(false);
      setStartRulesAccepted(false);
      setNow(Date.now());
      window.requestAnimationFrame(() => {
        document
          .getElementById('assessment-live-workspace')
          ?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    } catch {
      setNotice({ tone: 'error', text: 'Network error while starting the assessment.' });
    } finally {
      setIsStarting(false);
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
            {formatDhakaDateTime(currentAssignment.dueAt ?? assessment.dueAt)}.
          </div>
          <div
            style={{
              marginTop: 14,
              borderRadius: 16,
              border: '1px solid #FDE68A',
              background: '#FFFBEB',
              padding: '14px 16px',
              display: 'flex',
              gap: 10,
              alignItems: 'flex-start',
            }}
          >
            <AlertTriangle size={16} style={{ color: '#B45309', flexShrink: 0, marginTop: 1 }} />
            <div style={{ fontSize: 13, color: '#92400E', lineHeight: 1.7, fontWeight: 700 }}>
              Your {assessment.durationMinutes}-minute timer will keep running after you start, even
              if you leave this page or close the browser. When time ends, the current attempt is
              submitted automatically.
            </div>
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
            onClick={() => {
              setStartRulesAccepted(false);
              setStartDialogOpen(true);
            }}
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
          id="assessment-live-workspace"
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
            <span>Started: {formatDhakaDateTime(currentSubmission.startedAt)}</span>
            <span>Duration: {assessment.durationMinutes} min</span>
            {!isSubmitted ? (
              <span
                style={{
                  color:
                    draftState === 'error'
                      ? '#991B1B'
                      : draftState === 'saving'
                        ? '#2563EB'
                        : '#047857',
                  fontWeight: 700,
                }}
              >
                {draftState === 'saving'
                  ? 'Saving draft...'
                  : draftState === 'error'
                    ? 'Draft save paused'
                    : draftState === 'saved'
                      ? 'Draft saved'
                      : 'Draft ready'}
              </span>
            ) : null}
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
              Time left: {formatRemainingTime(remainingSeconds)}
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
                  padding: 22,
                  boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                  display: 'grid',
                  gap: 16,
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
                  <div style={{ minWidth: 0, flex: 1, display: 'grid', gap: 10 }}>
                    <div
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: '#0F172A',
                        fontFamily: 'var(--font-display)',
                      }}
                    >
                      Question {question.index}
                    </div>
                    <div
                      style={{
                        borderRadius: 18,
                        border: '1px solid #D7E3F4',
                        background: 'linear-gradient(180deg, #F8FBFF 0%, #FFFFFF 100%)',
                        padding: '16px 18px',
                        boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.85)',
                      }}
                    >
                      <div
                        style={{
                          fontSize: 17,
                          color: '#0F172A',
                          lineHeight: 1.9,
                          fontWeight: 650,
                          whiteSpace: 'pre-wrap',
                          wordBreak: 'break-word',
                        }}
                      >
                        {question.questionText}
                      </div>
                    </div>
                  </div>
                  <span
                    style={{
                      borderRadius: 999,
                      padding: '8px 12px',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      color: '#0F172A',
                      fontSize: 13,
                      fontWeight: 800,
                      whiteSpace: 'nowrap',
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
                          gap: 12,
                          borderRadius: 16,
                          border: '1px solid #D7E3F4',
                          padding: '14px 16px',
                          background: '#FBFDFF',
                          fontSize: 15,
                          color: '#0F172A',
                          lineHeight: 1.75,
                          fontWeight: 600,
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
                          style={{ width: 17, height: 17, flexShrink: 0 }}
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
                      padding: '15px 16px',
                      fontSize: 15,
                      lineHeight: 1.85,
                      color: '#0F172A',
                      borderColor: '#CBD5E1',
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
                        padding: '16px 18px',
                        fontSize: 14,
                        lineHeight: 1.75,
                        color: '#0F172A',
                        borderColor: '#CBD5E1',
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
                        disabled={
                          !codingExecutionEnabled ||
                          runningQuestion === question.index ||
                          isSubmitted
                        }
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 8,
                          background:
                            !codingExecutionEnabled ||
                            runningQuestion === question.index ||
                            isSubmitted
                              ? '#F8FAFC'
                              : '#EFF6FF',
                          color:
                            !codingExecutionEnabled ||
                            runningQuestion === question.index ||
                            isSubmitted
                              ? '#94A3B8'
                              : '#2563EB',
                          border: `1px solid ${
                            !codingExecutionEnabled ||
                            runningQuestion === question.index ||
                            isSubmitted
                              ? '#E2E8F0'
                              : '#BFDBFE'
                          }`,
                          borderRadius: 12,
                          padding: '10px 14px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor:
                            !codingExecutionEnabled ||
                            runningQuestion === question.index ||
                            isSubmitted
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
                    {!codingExecutionEnabled ? (
                      <div
                        style={{
                          borderRadius: 14,
                          border: '1px solid #FDE68A',
                          background: '#FFFBEB',
                          padding: '12px 14px',
                          color: '#92400E',
                          fontSize: 12,
                          lineHeight: 1.7,
                          fontWeight: 700,
                        }}
                      >
                        Live code execution is not configured on this server yet. Add `
                        JUDGE0_API_BASE_URL ` or ` PISTON_API_BASE_URL ` to `.env.local`, then
                        restart the app to enable sample test runs.
                      </div>
                    ) : null}
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

      {startDialogOpen ? (
        <div
          onClick={() => {
            if (isStarting) return;
            setStartDialogOpen(false);
            setStartRulesAccepted(false);
          }}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15,23,42,0.58)',
            backdropFilter: 'blur(6px)',
            zIndex: 80,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 16px',
          }}
        >
          <div
            onClick={(event) => event.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="assessment-start-rules-title"
            style={{
              width: '100%',
              maxWidth: 640,
              borderRadius: 24,
              background: '#FFFFFF',
              border: '1px solid #D9E2EC',
              boxShadow: '0 24px 60px rgba(15,23,42,0.24)',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                padding: '22px 22px 18px',
                borderBottom: '1px solid #E2E8F0',
                display: 'flex',
                justifyContent: 'space-between',
                gap: 12,
                alignItems: 'flex-start',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  id="assessment-start-rules-title"
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: '#0F172A',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  Read Before You Start
                </div>
                <div style={{ marginTop: 6, fontSize: 13, color: '#64748B', lineHeight: 1.7 }}>
                  Starting this assessment launches your timed attempt immediately.
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setStartDialogOpen(false);
                  setStartRulesAccepted(false);
                }}
                disabled={isStarting}
                aria-label="Close start rules"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: 34,
                  height: 34,
                  borderRadius: 999,
                  border: '1px solid #D9E2EC',
                  background: '#FFFFFF',
                  color: '#475569',
                  cursor: isStarting ? 'not-allowed' : 'pointer',
                  flexShrink: 0,
                }}
              >
                <X size={16} />
              </button>
            </div>

            <div style={{ padding: 22, display: 'grid', gap: 16 }}>
              <div
                style={{
                  borderRadius: 18,
                  border: '1px solid #FDE68A',
                  background: '#FFFBEB',
                  padding: '16px 18px',
                  display: 'grid',
                  gap: 10,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 9,
                    color: '#92400E',
                    fontSize: 14,
                    fontWeight: 900,
                  }}
                >
                  <AlertTriangle size={16} />
                  Timer and integrity rules
                </div>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
                    gap: 10,
                  }}
                >
                  <div
                    style={{
                      borderRadius: 14,
                      border: '1px solid #FDE68A',
                      background: '#FFFFFF',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#A16207', fontWeight: 800 }}>Duration</div>
                    <div style={{ marginTop: 3, fontSize: 13, color: '#92400E', fontWeight: 800 }}>
                      {assessment.durationMinutes} minutes
                    </div>
                  </div>
                  <div
                    style={{
                      borderRadius: 14,
                      border: '1px solid #FDE68A',
                      background: '#FFFFFF',
                      padding: '10px 12px',
                    }}
                  >
                    <div style={{ fontSize: 11, color: '#A16207', fontWeight: 800 }}>Due</div>
                    <div style={{ marginTop: 3, fontSize: 13, color: '#92400E', fontWeight: 800 }}>
                      {formatDhakaDateTime(currentAssignment.dueAt ?? assessment.dueAt)}
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ display: 'grid', gap: 10 }}>
                {START_RULES.map((rule, index) => (
                  <div
                    key={rule}
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      gap: 10,
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                      padding: '12px 14px',
                    }}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 24,
                        height: 24,
                        borderRadius: 999,
                        background: '#DBEAFE',
                        color: '#1D4ED8',
                        fontSize: 12,
                        fontWeight: 900,
                        flexShrink: 0,
                      }}
                    >
                      {index + 1}
                    </span>
                    <div style={{ fontSize: 13, color: '#334155', lineHeight: 1.7 }}>{rule}</div>
                  </div>
                ))}
              </div>

              <label
                style={{
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 10,
                  borderRadius: 16,
                  border: '1px solid #D9E2EC',
                  background: '#FFFFFF',
                  padding: '12px 14px',
                  fontSize: 13,
                  color: '#334155',
                  lineHeight: 1.7,
                  fontWeight: 700,
                }}
              >
                <input
                  type="checkbox"
                  checked={startRulesAccepted}
                  onChange={(event) => setStartRulesAccepted(event.target.checked)}
                  disabled={isStarting}
                  style={{ marginTop: 2 }}
                />
                I understand these rules and want to begin my timed assessment now.
              </label>
            </div>

            <div
              style={{
                borderTop: '1px solid #E2E8F0',
                padding: '18px 22px 22px',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 10,
                flexWrap: 'wrap',
              }}
            >
              <button
                type="button"
                onClick={() => {
                  setStartDialogOpen(false);
                  setStartRulesAccepted(false);
                }}
                disabled={isStarting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#FFFFFF',
                  color: '#475569',
                  border: '1px solid #D9E2EC',
                  borderRadius: 14,
                  padding: '11px 14px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: isStarting ? 'not-allowed' : 'pointer',
                }}
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStart}
                disabled={!startRulesAccepted || isStarting}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background:
                    !startRulesAccepted || isStarting
                      ? '#CBD5E1'
                      : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 14,
                  padding: '11px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  cursor: !startRulesAccepted || isStarting ? 'not-allowed' : 'pointer',
                }}
              >
                {isStarting ? <Loader2 size={15} className="spin" /> : <Play size={15} />}
                {isStarting ? 'Starting...' : 'Start now'}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
