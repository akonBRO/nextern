'use client';

import Link from 'next/link';
import { useMemo, useState, useTransition } from 'react';
import { useUploadThing } from '@/lib/uploadthing';
import {
  CODING_LANGUAGES,
  type AssessmentQuestionDraft,
  type AssessmentQuestionType,
  type HiringAsset,
} from '@/lib/hiring-suite-shared';
import {
  CalendarClock,
  CheckCircle2,
  ClipboardCheck,
  Crown,
  FileText,
  Loader2,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from 'lucide-react';

type JobOption = {
  _id: string;
  title: string;
  companyName: string;
  isActive: boolean;
};

type AssessmentListItem = {
  _id: string;
  title: string;
  type: string;
  totalMarks: number;
  passingMarks: number;
  durationMinutes: number;
  dueAt?: string | null;
  isActive: boolean;
  createdAt: string;
  job?: {
    _id: string;
    title: string;
    companyName: string;
  } | null;
  summary?: {
    assigned: number;
    submitted: number;
    graded: number;
    averageScore: number | null;
  };
};

type Props = {
  jobs: JobOption[];
  assessments: AssessmentListItem[];
  initialJobId?: string;
  initialApplicationIds: string[];
  isPremium: boolean;
};

type BuilderQuestion = AssessmentQuestionDraft & {
  acceptedAnswersText: string;
};

type ValidationIssue = {
  path?: string;
  message?: string;
};

function createQuestion(type: AssessmentQuestionType, index: number): BuilderQuestion {
  return {
    index,
    type,
    questionText: '',
    marks: type === 'coding' ? 20 : 10,
    options: type === 'mcq' ? ['', '', '', ''] : [],
    correctOptionIndex: type === 'mcq' ? 0 : undefined,
    acceptedAnswers: type === 'short_answer' ? [] : undefined,
    acceptedAnswersText: '',
    enablePlagiarismCheck: type === 'short_answer' || type === 'case_study',
    language: type === 'coding' ? 'javascript' : undefined,
    starterCode: type === 'coding' ? '' : undefined,
    testCases: type === 'coding' ? [{ input: '', expectedOutput: '', isSample: true }] : undefined,
    rubric: type === 'case_study' ? '' : undefined,
    attachments: [],
    maxWords: type === 'case_study' ? 300 : undefined,
  };
}

function deriveAssessmentType(questions: BuilderQuestion[]) {
  const types = Array.from(new Set(questions.map((question) => question.type)));
  return types.length === 1 ? types[0] : 'mixed';
}

function formatAssessmentType(value: string) {
  return value
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

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

function formatValidationPath(path?: string) {
  if (!path) return 'Validation';

  const normalized = path.replace(
    /\.(\d+)\./g,
    (_match, index) => ` question ${Number(index) + 1} `
  );

  return normalized
    .replace(/^jobId$/, 'Job')
    .replace(/^title$/, 'Assessment title')
    .replace(/^questions$/, 'Questions')
    .replace(/questionText/g, 'prompt')
    .replace(/correctOptionIndex/g, 'correct option')
    .replace(/acceptedAnswers/g, 'accepted answers')
    .replace(/attachments/g, 'attachments')
    .replace(/\./g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function formatAssessmentApiError(data: {
  error?: string;
  details?: Record<string, string[] | undefined>;
  issues?: ValidationIssue[];
}) {
  const firstIssue = data.issues?.find((issue) => issue.message);
  if (firstIssue?.message) {
    const label = formatValidationPath(firstIssue.path);
    return `${label}: ${firstIssue.message}`;
  }

  const detailEntry = Object.entries(data.details ?? {}).find(
    ([, messages]) => Array.isArray(messages) && messages.length > 0
  );
  if (detailEntry) {
    return `${formatValidationPath(detailEntry[0])}: ${detailEntry[1]?.[0]}`;
  }

  return data.error ?? 'Unable to create the assessment right now.';
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

export default function EmployerAssessmentsClient({
  jobs,
  assessments,
  initialJobId,
  initialApplicationIds,
  isPremium,
}: Props) {
  const [selectedJobId, setSelectedJobId] = useState(initialJobId ?? jobs[0]?._id ?? '');
  const [title, setTitle] = useState('');
  const [instructions, setInstructions] = useState('');
  const [durationMinutes, setDurationMinutes] = useState('45');
  const [passingMarks, setPassingMarks] = useState('30');
  const [dueAt, setDueAt] = useState('');
  const [allowLateSubmission, setAllowLateSubmission] = useState(false);
  const [isTimedAutoSubmit, setIsTimedAutoSubmit] = useState(true);
  const [questions, setQuestions] = useState<BuilderQuestion[]>([createQuestion('mcq', 1)]);
  const [notice, setNotice] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);
  const [assigningId, setAssigningId] = useState('');
  const [isPending, startTransition] = useTransition();
  const { startUpload, isUploading } = useUploadThing('assessmentAttachmentUploader');
  const totalMarks = useMemo(
    () => questions.reduce((sum, question) => sum + Math.max(1, Number(question.marks) || 0), 0),
    [questions]
  );
  const filteredAssessments = useMemo(() => {
    if (!selectedJobId) return assessments;
    return assessments.filter((assessment) => assessment.job?._id === selectedJobId);
  }, [assessments, selectedJobId]);

  function updateQuestion(index: number, updater: (question: BuilderQuestion) => BuilderQuestion) {
    setQuestions((current) =>
      current.map((question) => (question.index === index ? updater(question) : question))
    );
  }

  function addQuestion(type: AssessmentQuestionType) {
    setQuestions((current) => [...current, createQuestion(type, current.length + 1)]);
  }

  function removeQuestion(index: number) {
    setQuestions((current) =>
      current
        .filter((question) => question.index !== index)
        .map((question, nextIndex) => ({ ...question, index: nextIndex + 1 }))
    );
  }

  async function handleUploadAttachments(questionIndex: number, files: FileList | null) {
    if (!files?.length) return;
    const uploaded = await startUpload(Array.from(files));
    if (!uploaded?.length) return;

    const assets: HiringAsset[] = uploaded.map((file) => ({
      url: file.ufsUrl,
      name: file.name,
      type: file.type,
    }));

    updateQuestion(questionIndex, (question) => ({
      ...question,
      attachments: [...(question.attachments ?? []), ...assets].slice(0, 5),
    }));
  }

  function validateBuilder() {
    if (!selectedJobId) return 'Choose a job before creating an assessment.';
    if (title.trim().length < 3) return 'Assessment title must be at least 3 characters.';
    if (!questions.length) return 'Add at least one question.';

    const invalidQuestion = questions.find((question) => {
      if (question.questionText.trim().length < 10) return true;
      if ((question.attachments?.length ?? 0) > 5) return true;
      if (question.type === 'mcq') {
        const trimmedOptions = (question.options ?? []).map((option) => option.trim());
        const filledOptions = trimmedOptions.filter(Boolean);
        const selectedOption = trimmedOptions[question.correctOptionIndex ?? 0];
        return filledOptions.length < 2 || !selectedOption;
      }
      if (question.type === 'coding') {
        return !(question.testCases ?? []).some(
          (testCase) => testCase.input.trim() || testCase.expectedOutput.trim()
        );
      }
      return false;
    });
    return invalidQuestion
      ? 'Each question needs a prompt of at least 10 characters, valid answer setup, and no more than 5 attachments.'
      : null;
  }

  function buildPayloadQuestions() {
    return questions.map((question, index) => {
      const trimmedOptions = (question.options ?? []).map((option) => option.trim());
      const filledOptions = question.type === 'mcq' ? trimmedOptions.filter(Boolean) : undefined;
      const selectedOptionValue =
        question.type === 'mcq' ? trimmedOptions[question.correctOptionIndex ?? 0] : undefined;

      return {
        index: index + 1,
        type: question.type,
        questionText: question.questionText.trim(),
        marks: Math.max(1, Number(question.marks) || 0),
        options: filledOptions,
        correctOptionIndex:
          question.type === 'mcq'
            ? Math.max(0, filledOptions?.findIndex((option) => option === selectedOptionValue) ?? 0)
            : undefined,
        acceptedAnswers:
          question.type === 'short_answer'
            ? question.acceptedAnswersText
                .split('\n')
                .map((answer) => answer.trim())
                .filter(Boolean)
            : undefined,
        enablePlagiarismCheck:
          question.type === 'short_answer' || question.type === 'case_study'
            ? Boolean(question.enablePlagiarismCheck)
            : undefined,
        language: question.type === 'coding' ? question.language : undefined,
        starterCode: question.type === 'coding' ? question.starterCode : undefined,
        testCases:
          question.type === 'coding'
            ? (question.testCases ?? []).filter(
                (testCase) => testCase.input.trim() || testCase.expectedOutput.trim()
              )
            : undefined,
        rubric: question.type === 'case_study' ? question.rubric : undefined,
        attachments: question.attachments?.length ? question.attachments : undefined,
        maxWords: question.type === 'case_study' ? question.maxWords : undefined,
      };
    });
  }

  function handleCreateAssessment() {
    const validationError = validateBuilder();
    if (validationError) {
      setNotice({ tone: 'error', text: validationError });
      return;
    }

    startTransition(async () => {
      setNotice(null);
      try {
        const res = await fetch('/api/assessments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jobId: selectedJobId,
            title: title.trim(),
            type: deriveAssessmentType(questions),
            questions: buildPayloadQuestions(),
            totalMarks,
            passingMarks: Math.max(1, Number(passingMarks) || 0),
            durationMinutes: Math.max(10, Number(durationMinutes) || 45),
            instructions: instructions.trim() || undefined,
            isTimedAutoSubmit,
            allowLateSubmission,
            dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
            applicationIds: initialApplicationIds.length ? initialApplicationIds : undefined,
          }),
        });
        const data = (await res.json()) as {
          error?: string;
          details?: Record<string, string[] | undefined>;
          issues?: ValidationIssue[];
        };

        if (!res.ok) {
          setNotice({
            tone: 'error',
            text: formatAssessmentApiError(data),
          });
          return;
        }

        setNotice({
          tone: 'success',
          text: initialApplicationIds.length
            ? `Assessment created and sent to ${initialApplicationIds.length} selected candidate${initialApplicationIds.length > 1 ? 's' : ''}.`
            : 'Assessment created successfully.',
        });
        window.setTimeout(() => window.location.reload(), 900);
      } catch {
        setNotice({
          tone: 'error',
          text: 'Network error while creating the assessment. Please try again.',
        });
      }
    });
  }

  async function handleAssignExisting(assessmentId: string) {
    if (!initialApplicationIds.length) return;
    setAssigningId(assessmentId);
    setNotice(null);

    try {
      const res = await fetch(`/api/assessments/${assessmentId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'assign',
          applicationIds: initialApplicationIds,
          dueAt: dueAt ? new Date(dueAt).toISOString() : undefined,
        }),
      });
      const data = (await res.json()) as { error?: string };

      if (!res.ok) {
        setNotice({
          tone: 'error',
          text: data.error ?? 'Unable to assign the selected assessment.',
        });
        return;
      }

      setNotice({
        tone: 'success',
        text: `Assessment sent to ${initialApplicationIds.length} selected candidate${initialApplicationIds.length > 1 ? 's' : ''}.`,
      });
      window.setTimeout(
        () => window.location.assign(`/employer/jobs/${selectedJobId}/applicants`),
        900
      );
    } catch {
      setNotice({
        tone: 'error',
        text: 'Network error while assigning the assessment. Please try again.',
      });
    } finally {
      setAssigningId('');
    }
  }

  return (
    <div className="assessment-center-grid">
      <div
        className="assessment-builder-panel"
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          border: '1px solid #D9E2EC',
          boxShadow: '0 20px 42px rgba(15,23,42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '22px 24px',
            borderBottom: '1px solid #E2E8F0',
            background: 'linear-gradient(135deg, #F8FAFC, #EFF6FF)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: 16,
                background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#FFFFFF',
              }}
            >
              <ClipboardCheck size={20} />
            </div>
            <div style={{ flex: 1, minWidth: 220 }}>
              <div
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Assessment builder
              </div>
              <div style={{ marginTop: 4, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
                Build multiple-choice tests, short answers, coding challenges with the live code
                runner, or case-study tasks. When opened from the applicant pipeline, the created
                assessment is sent immediately and application status updates automatically.
              </div>
            </div>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                borderRadius: 999,
                padding: '6px 11px',
                background: isPremium ? '#FEF3C7' : '#F1F5F9',
                color: isPremium ? '#92400E' : '#64748B',
                border: `1px solid ${isPremium ? '#FDE68A' : '#E2E8F0'}`,
                fontSize: 12,
                fontWeight: 800,
              }}
            >
              <Crown size={13} />
              {isPremium ? 'Premium ready' : 'Premium required'}
            </span>
          </div>
        </div>

        <div style={{ padding: 24, display: 'grid', gap: 18 }}>
          {initialApplicationIds.length > 0 ? (
            <div
              style={{
                borderRadius: 18,
                padding: '14px 16px',
                background: '#F8FBFF',
                border: '1px solid #BFDBFE',
                color: '#1E3A8A',
                fontSize: 13,
                lineHeight: 1.6,
              }}
            >
              {initialApplicationIds.length} shortlisted candidate
              {initialApplicationIds.length > 1 ? 's are' : ' is'} already selected from the hiring
              dashboard. Create a new assessment or reuse an existing one from the right panel.
            </div>
          ) : null}

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

          <div className="assessment-meta-grid">
            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Job</span>
              <select
                value={selectedJobId}
                onChange={(event) => setSelectedJobId(event.target.value)}
                style={fieldStyle}
              >
                <option value="">Choose a job</option>
                {jobs.map((job) => (
                  <option key={job._id} value={job._id}>
                    {job.title} • {job.companyName}
                  </option>
                ))}
              </select>
            </label>

            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                Assessment title
              </span>
              <input
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                style={fieldStyle}
                placeholder="Frontend problem-solving sprint"
              />
            </label>

            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Duration</span>
              <input
                type="number"
                min={10}
                max={180}
                value={durationMinutes}
                onChange={(event) => setDurationMinutes(event.target.value)}
                style={fieldStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Passing marks</span>
              <input
                type="number"
                min={1}
                max={Math.max(1, totalMarks)}
                value={passingMarks}
                onChange={(event) => setPassingMarks(event.target.value)}
                style={fieldStyle}
              />
            </label>

            <label style={{ display: 'grid', gap: 7 }}>
              <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Due date</span>
              <input
                type="datetime-local"
                value={dueAt}
                onChange={(event) => setDueAt(event.target.value)}
                style={fieldStyle}
              />
            </label>

            <div
              style={{
                borderRadius: 16,
                border: '1px solid #E2E8F0',
                background: '#F8FAFC',
                padding: '12px 14px',
                display: 'grid',
                alignContent: 'center',
              }}
            >
              <div style={{ fontSize: 11, color: '#64748B', fontWeight: 700 }}>TOTAL MARKS</div>
              <div
                style={{
                  fontSize: 30,
                  lineHeight: 1,
                  color: '#2563EB',
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                }}
              >
                {totalMarks}
              </div>
            </div>
          </div>

          <label style={{ display: 'grid', gap: 7 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Instructions</span>
            <textarea
              value={instructions}
              onChange={(event) => setInstructions(event.target.value)}
              rows={3}
              style={{ ...fieldStyle, resize: 'vertical', minHeight: 92 }}
              placeholder="Explain timing, scoring expectations, and any permitted resources."
            />
          </label>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 14 }}>
            {[
              {
                checked: isTimedAutoSubmit,
                label: 'Auto-submit when time ends',
                onChange: () => setIsTimedAutoSubmit((value) => !value),
              },
              {
                checked: allowLateSubmission,
                label: 'Allow late submissions',
                onChange: () => setAllowLateSubmission((value) => !value),
              },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={item.onChange}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  borderRadius: 999,
                  border: `1px solid ${item.checked ? '#BFDBFE' : '#E2E8F0'}`,
                  background: item.checked ? '#EFF6FF' : '#FFFFFF',
                  color: item.checked ? '#2563EB' : '#475569',
                  padding: '9px 12px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                <CheckCircle2 size={14} />
                {item.label}
              </button>
            ))}
          </div>

          <div className="assessment-question-toolbar">
            <div className="assessment-question-toolbar-copy">
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 800,
                  color: '#0F172A',
                  fontFamily: 'var(--font-display)',
                }}
              >
                Questions
              </div>
              <div style={{ marginTop: 3, fontSize: 12, color: '#64748B' }}>
                Mix objective scoring with manual review where needed.
              </div>
            </div>

            <div className="assessment-question-toolbar-actions">
              {[
                { label: 'MCQ', type: 'mcq' },
                { label: 'Short answer', type: 'short_answer' },
                { label: 'Coding', type: 'coding' },
                { label: 'Case study', type: 'case_study' },
              ].map((item) => (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => addQuestion(item.type as AssessmentQuestionType)}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 7,
                    borderRadius: 12,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    padding: '10px 12px',
                    fontSize: 12,
                    fontWeight: 800,
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <Plus size={14} />
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display: 'grid', gap: 14 }}>
            {questions.map((question) => (
              <div
                key={question.index}
                style={{
                  borderRadius: 20,
                  border: '1px solid #E2E8F0',
                  background: '#FFFFFF',
                  boxShadow: '0 12px 28px rgba(15,23,42,0.05)',
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    padding: '16px 18px',
                    borderBottom: '1px solid #E2E8F0',
                    background: '#F8FAFC',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 12,
                    flexWrap: 'wrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        width: 30,
                        height: 30,
                        borderRadius: 10,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 900,
                      }}
                    >
                      {question.index}
                    </span>
                    <select
                      value={question.type}
                      onChange={(event) =>
                        updateQuestion(question.index, () =>
                          createQuestion(
                            event.target.value as AssessmentQuestionType,
                            question.index
                          )
                        )
                      }
                      style={{ ...fieldStyle, width: 180 }}
                    >
                      <option value="mcq">MCQ</option>
                      <option value="short_answer">Short answer</option>
                      <option value="coding">Coding</option>
                      <option value="case_study">Case study</option>
                    </select>
                    <input
                      type="number"
                      min={1}
                      value={question.marks}
                      onChange={(event) =>
                        updateQuestion(question.index, (current) => ({
                          ...current,
                          marks: Math.max(1, Number(event.target.value) || 1),
                        }))
                      }
                      style={{ ...fieldStyle, width: 120 }}
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeQuestion(question.index)}
                    disabled={questions.length === 1}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 7,
                      borderRadius: 10,
                      border: '1px solid #FECACA',
                      background: '#FEF2F2',
                      color: questions.length === 1 ? '#FCA5A5' : '#B91C1C',
                      padding: '9px 12px',
                      fontSize: 12,
                      fontWeight: 800,
                      cursor: questions.length === 1 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    <Trash2 size={13} />
                    Remove
                  </button>
                </div>

                <div style={{ padding: 18, display: 'grid', gap: 14 }}>
                  <label style={{ display: 'grid', gap: 7 }}>
                    <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>Prompt</span>
                    <textarea
                      value={question.questionText}
                      onChange={(event) =>
                        updateQuestion(question.index, (current) => ({
                          ...current,
                          questionText: event.target.value,
                        }))
                      }
                      rows={3}
                      style={{ ...fieldStyle, resize: 'vertical', minHeight: 90 }}
                    />
                  </label>

                  {question.type === 'mcq' ? (
                    <div style={{ display: 'grid', gap: 10 }}>
                      {(question.options ?? []).map((option, optionIndex) => (
                        <div
                          key={`${question.index}-option-${optionIndex}`}
                          style={{ display: 'grid', gridTemplateColumns: '1fr 140px', gap: 10 }}
                        >
                          <input
                            value={option}
                            onChange={(event) =>
                              updateQuestion(question.index, (current) => ({
                                ...current,
                                options: (current.options ?? []).map(
                                  (currentOption, currentIndex) =>
                                    currentIndex === optionIndex
                                      ? event.target.value
                                      : currentOption
                                ),
                              }))
                            }
                            style={fieldStyle}
                            placeholder={`Option ${optionIndex + 1}`}
                          />
                          <label
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 8,
                              borderRadius: 12,
                              border: '1px solid #E2E8F0',
                              padding: '0 12px',
                              background: '#FFFFFF',
                              color: '#334155',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <input
                              type="radio"
                              checked={question.correctOptionIndex === optionIndex}
                              onChange={() =>
                                updateQuestion(question.index, (current) => ({
                                  ...current,
                                  correctOptionIndex: optionIndex,
                                }))
                              }
                            />
                            Correct
                          </label>
                        </div>
                      ))}
                    </div>
                  ) : null}

                  {question.type === 'short_answer' ? (
                    <label style={{ display: 'grid', gap: 7 }}>
                      <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                        Accepted answers
                      </span>
                      <textarea
                        value={question.acceptedAnswersText}
                        onChange={(event) =>
                          updateQuestion(question.index, (current) => ({
                            ...current,
                            acceptedAnswersText: event.target.value,
                          }))
                        }
                        rows={3}
                        style={{ ...fieldStyle, resize: 'vertical', minHeight: 88 }}
                        placeholder={
                          'One acceptable answer per line\nREST API\nRepresentational state transfer'
                        }
                      />
                    </label>
                  ) : null}

                  {question.type === 'coding' ? (
                    <div style={{ display: 'grid', gap: 12 }}>
                      <div className="assessment-code-grid">
                        <label style={{ display: 'grid', gap: 7 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                            Language
                          </span>
                          <select
                            value={question.language}
                            onChange={(event) =>
                              updateQuestion(question.index, (current) => ({
                                ...current,
                                language: event.target.value as BuilderQuestion['language'],
                              }))
                            }
                            style={fieldStyle}
                          >
                            {CODING_LANGUAGES.map((language) => (
                              <option key={language} value={language}>
                                {language}
                              </option>
                            ))}
                          </select>
                        </label>

                        <label style={{ display: 'grid', gap: 7 }}>
                          <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                            Starter code
                          </span>
                          <textarea
                            value={question.starterCode}
                            onChange={(event) =>
                              updateQuestion(question.index, (current) => ({
                                ...current,
                                starterCode: event.target.value,
                              }))
                            }
                            rows={5}
                            style={{
                              ...fieldStyle,
                              resize: 'vertical',
                              minHeight: 120,
                              fontFamily: 'monospace',
                            }}
                          />
                        </label>
                      </div>

                      <div style={{ display: 'grid', gap: 10 }}>
                        {(question.testCases ?? []).map((testCase, testCaseIndex) => (
                          <div
                            key={`${question.index}-testcase-${testCaseIndex}`}
                            className="assessment-testcase-grid"
                          >
                            <textarea
                              value={testCase.input}
                              onChange={(event) =>
                                updateQuestion(question.index, (current) => ({
                                  ...current,
                                  testCases: (current.testCases ?? []).map(
                                    (currentCase, currentIndex) =>
                                      currentIndex === testCaseIndex
                                        ? { ...currentCase, input: event.target.value }
                                        : currentCase
                                  ),
                                }))
                              }
                              rows={2}
                              style={{
                                ...fieldStyle,
                                resize: 'vertical',
                                minHeight: 68,
                                fontFamily: 'monospace',
                              }}
                              placeholder="Input"
                            />
                            <textarea
                              value={testCase.expectedOutput}
                              onChange={(event) =>
                                updateQuestion(question.index, (current) => ({
                                  ...current,
                                  testCases: (current.testCases ?? []).map(
                                    (currentCase, currentIndex) =>
                                      currentIndex === testCaseIndex
                                        ? { ...currentCase, expectedOutput: event.target.value }
                                        : currentCase
                                  ),
                                }))
                              }
                              rows={2}
                              style={{
                                ...fieldStyle,
                                resize: 'vertical',
                                minHeight: 68,
                                fontFamily: 'monospace',
                              }}
                              placeholder="Expected output"
                            />
                            <label
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 8,
                                borderRadius: 12,
                                border: '1px solid #E2E8F0',
                                padding: '11px 12px',
                                background: '#FFFFFF',
                                color: '#334155',
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={Boolean(testCase.isSample)}
                                onChange={() =>
                                  updateQuestion(question.index, (current) => ({
                                    ...current,
                                    testCases: (current.testCases ?? []).map(
                                      (currentCase, currentIndex) =>
                                        currentIndex === testCaseIndex
                                          ? { ...currentCase, isSample: !currentCase.isSample }
                                          : currentCase
                                    ),
                                  }))
                                }
                              />
                              Sample
                            </label>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : null}

                  {question.type === 'case_study' ? (
                    <div className="assessment-case-grid">
                      <label style={{ display: 'grid', gap: 7 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                          Rubric
                        </span>
                        <textarea
                          value={question.rubric}
                          onChange={(event) =>
                            updateQuestion(question.index, (current) => ({
                              ...current,
                              rubric: event.target.value,
                            }))
                          }
                          rows={4}
                          style={{ ...fieldStyle, resize: 'vertical', minHeight: 110 }}
                        />
                      </label>

                      <label style={{ display: 'grid', gap: 7 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                          Max words
                        </span>
                        <input
                          type="number"
                          min={50}
                          max={2000}
                          value={question.maxWords ?? 300}
                          onChange={(event) =>
                            updateQuestion(question.index, (current) => ({
                              ...current,
                              maxWords: Number(event.target.value) || 300,
                            }))
                          }
                          style={fieldStyle}
                        />
                      </label>
                    </div>
                  ) : null}

                  {question.type === 'short_answer' || question.type === 'case_study' ? (
                    <label
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        borderRadius: 999,
                        border: '1px solid #E2E8F0',
                        background: '#FFFFFF',
                        padding: '9px 12px',
                        width: 'fit-content',
                        color: '#334155',
                        fontSize: 12,
                        fontWeight: 700,
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={Boolean(question.enablePlagiarismCheck)}
                        onChange={() =>
                          updateQuestion(question.index, (current) => ({
                            ...current,
                            enablePlagiarismCheck: !current.enablePlagiarismCheck,
                          }))
                        }
                      />
                      Enable plagiarism review
                    </label>
                  ) : null}

                  <div style={{ display: 'grid', gap: 10 }}>
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        gap: 10,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div style={{ fontSize: 12, fontWeight: 700, color: '#334155' }}>
                        Attachments
                      </div>
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
                          cursor: isUploading ? 'not-allowed' : 'pointer',
                        }}
                      >
                        <Upload size={13} />
                        {isUploading ? 'Uploading...' : 'Upload file'}
                        <input
                          type="file"
                          accept="image/*,.pdf"
                          multiple
                          style={{ display: 'none' }}
                          onChange={async (event) => {
                            const input = event.currentTarget;
                            const files = input.files;
                            input.value = '';
                            await handleUploadAttachments(question.index, files);
                          }}
                        />
                      </label>
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {(question.attachments ?? []).length > 0 ? (
                        (question.attachments ?? []).map((asset) => (
                          <span
                            key={asset.url}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 7,
                              borderRadius: 999,
                              padding: '6px 10px',
                              background: '#F8FAFC',
                              border: '1px solid #E2E8F0',
                              color: '#334155',
                              fontSize: 12,
                              fontWeight: 700,
                            }}
                          >
                            <FileText size={12} />
                            {asset.name}
                          </span>
                        ))
                      ) : (
                        <span style={{ fontSize: 12, color: '#94A3B8' }}>
                          Add prompt PDFs or reference files if needed.
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={handleCreateAssessment}
              disabled={!isPremium || isPending}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background:
                  !isPremium || isPending ? '#CBD5E1' : 'linear-gradient(135deg, #2563EB, #1D4ED8)',
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 15,
                padding: '12px 16px',
                fontSize: 13,
                fontWeight: 800,
                cursor: !isPremium || isPending ? 'not-allowed' : 'pointer',
              }}
            >
              {isPending ? <Loader2 size={15} className="spin" /> : <Sparkles size={15} />}
              {isPending
                ? 'Saving...'
                : initialApplicationIds.length
                  ? 'Create and send assessment'
                  : 'Create assessment'}
            </button>
            {!isPremium ? (
              <Link
                href="/employer/premium"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: '#FEF3C7',
                  color: '#92400E',
                  border: '1px solid #FDE68A',
                  borderRadius: 15,
                  padding: '12px 16px',
                  fontSize: 13,
                  fontWeight: 800,
                  textDecoration: 'none',
                }}
              >
                <Crown size={15} />
                Upgrade for hiring suite
              </Link>
            ) : null}
          </div>
        </div>
      </div>

      <aside
        className="assessment-library-panel"
        style={{ display: 'grid', gap: 16, alignContent: 'start' }}
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            border: '1px solid #D9E2EC',
            boxShadow: '0 18px 36px rgba(15,23,42,0.06)',
            padding: 22,
          }}
        >
          <div
            style={{
              fontSize: 17,
              fontWeight: 900,
              color: '#0F172A',
              fontFamily: 'var(--font-display)',
            }}
          >
            Assessment library
          </div>
          <div style={{ marginTop: 4, fontSize: 13, color: '#64748B', lineHeight: 1.6 }}>
            Reuse existing evaluations for the current role, review assignment progress, and open
            the grading workspace when manual review is needed.
          </div>

          <div style={{ marginTop: 16, display: 'grid', gap: 12 }}>
            {filteredAssessments.length === 0 ? (
              <div
                style={{
                  borderRadius: 18,
                  border: '1px dashed #CBD5E1',
                  background: '#F8FAFC',
                  padding: '18px 16px',
                  color: '#64748B',
                  fontSize: 13,
                  lineHeight: 1.7,
                }}
              >
                No assessments created for this job yet. Build your first evaluation on the left and
                it will appear here with assignment progress and average results.
              </div>
            ) : (
              filteredAssessments.map((assessment) => (
                <div
                  key={assessment._id}
                  style={{
                    borderRadius: 20,
                    border: '1px solid #E2E8F0',
                    background: '#FFFFFF',
                    padding: 16,
                    display: 'grid',
                    gap: 12,
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start',
                      justifyContent: 'space-between',
                      gap: 10,
                    }}
                  >
                    <div style={{ minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 15,
                          fontWeight: 800,
                          color: '#0F172A',
                          fontFamily: 'var(--font-display)',
                        }}
                      >
                        {assessment.title}
                      </div>
                      <div style={{ marginTop: 5, fontSize: 12, color: '#64748B' }}>
                        {assessment.job?.title ?? 'Role not available'} •{' '}
                        {formatAssessmentType(assessment.type)}
                      </div>
                    </div>
                    <span
                      style={{
                        borderRadius: 999,
                        padding: '5px 9px',
                        background: assessment.isActive ? '#ECFDF5' : '#F8FAFC',
                        color: assessment.isActive ? '#065F46' : '#64748B',
                        border: `1px solid ${assessment.isActive ? '#A7F3D0' : '#E2E8F0'}`,
                        fontSize: 11,
                        fontWeight: 800,
                      }}
                    >
                      {assessment.isActive ? 'Active' : 'Archived'}
                    </span>
                  </div>

                  <div className="assessment-stats-grid">
                    {[
                      { label: 'Assigned', value: assessment.summary?.assigned ?? 0 },
                      { label: 'Submitted', value: assessment.summary?.submitted ?? 0 },
                      { label: 'Graded', value: assessment.summary?.graded ?? 0 },
                      { label: 'Avg score', value: assessment.summary?.averageScore ?? '—' },
                    ].map((stat) => (
                      <div
                        key={stat.label}
                        style={{
                          borderRadius: 14,
                          background: '#F8FAFC',
                          border: '1px solid #E2E8F0',
                          padding: '10px 12px',
                        }}
                      >
                        <div
                          style={{
                            fontSize: 22,
                            lineHeight: 1,
                            fontWeight: 900,
                            color: '#2563EB',
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {stat.value}
                        </div>
                        <div
                          style={{ marginTop: 4, fontSize: 11, color: '#64748B', fontWeight: 700 }}
                        >
                          {stat.label}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'grid', gap: 5, fontSize: 12, color: '#64748B' }}>
                    <span>
                      <CalendarClock
                        size={13}
                        style={{ verticalAlign: 'text-bottom', marginRight: 6 }}
                      />
                      Due: {formatDateTime(assessment.dueAt)}
                    </span>
                    <span>
                      {assessment.totalMarks} marks • Pass at {assessment.passingMarks} •{' '}
                      {assessment.durationMinutes} min
                    </span>
                  </div>

                  <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                    <Link
                      href={`/employer/assessments/${assessment._id}`}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 7,
                        background: '#0F172A',
                        color: '#FFFFFF',
                        borderRadius: 12,
                        padding: '10px 12px',
                        fontSize: 12,
                        fontWeight: 800,
                        textDecoration: 'none',
                      }}
                    >
                      Open detail
                    </Link>
                    {initialApplicationIds.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => handleAssignExisting(assessment._id)}
                        disabled={assigningId === assessment._id}
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 7,
                          background: '#EFF6FF',
                          color: '#2563EB',
                          border: '1px solid #BFDBFE',
                          borderRadius: 12,
                          padding: '10px 12px',
                          fontSize: 12,
                          fontWeight: 800,
                          cursor: assigningId === assessment._id ? 'not-allowed' : 'pointer',
                        }}
                      >
                        {assigningId === assessment._id ? (
                          <Loader2 size={14} className="spin" />
                        ) : (
                          <Sparkles size={14} />
                        )}
                        Use for selected
                      </button>
                    ) : null}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <style>{`
        .assessment-center-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) minmax(300px, 360px);
          gap: 18px;
          align-items: start;
        }

        .assessment-builder-panel,
        .assessment-library-panel {
          min-width: 0;
        }

        .assessment-meta-grid {
          display: grid;
          grid-template-columns:
            minmax(0, 1.05fr)
            minmax(0, 1.3fr)
            minmax(110px, 0.72fr)
            minmax(110px, 0.72fr)
            minmax(170px, 1fr)
            minmax(96px, 0.6fr);
          gap: 14px;
          align-items: end;
        }

        .assessment-code-grid {
          display: grid;
          grid-template-columns: 220px 1fr;
          gap: 12px;
        }

        .assessment-testcase-grid {
          display: grid;
          grid-template-columns: 1fr 1fr 140px;
          gap: 10px;
          align-items: center;
        }

        .assessment-case-grid {
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 12px;
        }

        .assessment-stats-grid {
          display: grid;
          grid-template-columns: repeat(2, minmax(0, 1fr));
          gap: 10px;
        }

        .assessment-question-toolbar {
          display: flex;
          justify-content: space-between;
          gap: 10px;
          flex-wrap: wrap;
        }

        .assessment-question-toolbar-copy {
          min-width: 0;
        }

        .assessment-question-toolbar-actions {
          display: flex;
          gap: 8px;
          flex-wrap: wrap;
          max-width: 100%;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 1180px) {
          .assessment-center-grid,
          .assessment-meta-grid,
          .assessment-code-grid,
          .assessment-testcase-grid,
          .assessment-case-grid {
            grid-template-columns: 1fr !important;
          }

          .assessment-question-toolbar-actions {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
}
