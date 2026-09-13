'use client';
import { useMemo, useState } from 'react';
import { formatAssessmentAssignmentStatus } from '@/lib/hiring-suite-shared';
import ApplicantActions from '@/app/employer/jobs/[jobId]/applicants/ApplicantActions';
import { formatDhakaDateTime } from '@/lib/datetime';
import { CheckCircle2, Loader2, Save } from 'lucide-react';

type AssessmentData = {
  _id: string;
  passingMarks: number;
  questions: Array<{
    index: number;
    type: string;
    questionText: string;
    marks: number;
    options?: string[];
  }>;
};

type AssignmentData = {
  _id: string;
  status: string;
  dueAt?: string | null;
  totalScore?: number | null;
  isPassed?: boolean | null;
  needsManualReview: boolean;
  student?: {
    _id: string;
    name: string;
    email: string;
    university: string;
    department: string;
  } | null;
  application?: {
    _id: string;
    status: string;
    fitScore?: number | null;
  } | null;
  submission?: {
    _id: string;
    submittedAt?: string | null;
    objectiveScore?: number | null;
    manualScore?: number | null;
    totalScore?: number | null;
    isPassed?: boolean | null;
    answers?: Array<{
      questionIndex: number;
      answerText?: string;
      selectedOptionIndex?: number;
      code?: string;
      uploadedFiles?: Array<{ url: string; name: string; type: string }>;
      marksAwarded?: number;
      objectiveMarksAwarded?: number;
      manualMarksAwarded?: number;
      executionStatus?: string;
      executionOutput?: string;
      executionError?: string;
      plagiarismScore?: number;
      evaluationNotes?: string;
    }>;
  } | null;
};

type Props = {
  assessment: AssessmentData;
  assignments: AssignmentData[];
};

const fieldStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: 12,
  border: '1px solid #D9E2EC',
  background: '#FFFFFF',
  color: '#182c39',
  fontSize: 13,
  outline: 'none',
} as const;

export default function EmployerAssessmentDetailClient({ assessment, assignments }: Props) {
  const [gradingState, setGradingState] = useState<
    Record<string, Record<number, { marksAwarded: number; evaluationNotes: string }>>
  >({});
  const [gradingId, setGradingId] = useState('');
  const [notice, setNotice] = useState('');
  const leaderboard = useMemo(
    () =>
      [...assignments].sort(
        (left, right) => (right.submission?.totalScore ?? 0) - (left.submission?.totalScore ?? 0)
      ),
    [assignments]
  );

  async function saveManualGrade(assignmentId: string) {
    const adjustments = Object.entries(gradingState[assignmentId] ?? {}).map(
      ([questionIndex, value]) => ({
        questionIndex: Number(questionIndex),
        marksAwarded: Number(value.marksAwarded) || 0,
        evaluationNotes: value.evaluationNotes,
      })
    );

    setGradingId(assignmentId);
    setNotice('');
    try {
      const res = await fetch(`/api/assessments/${assessment._id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'grade_assignment',
          assignmentId,
          manualAdjustments: adjustments,
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) {
        setNotice(data.error ?? 'Unable to save manual grade.');
        return;
      }
      setNotice('Manual grading saved. Refreshing results...');
      window.setTimeout(() => window.location.reload(), 800);
    } catch {
      setNotice('Network error while saving manual grade.');
    } finally {
      setGradingId('');
    }
  }

  return (
    <div style={{ display: 'grid', gap: 16 }}>
      {notice ? (
        <div
          style={{
            borderRadius: 12,
            padding: '12px 14px',
            background: '#edf7f3',
            color: '#06665d',
            border: '1px solid #bdddd5',
            fontSize: 13,
            fontWeight: 700,
          }}
        >
          {notice}
        </div>
      ) : null}

      <div className="assessment-comparison-grid">
        {leaderboard.map((assignment) => (
          <div
            key={assignment._id}
            style={{
              background: '#FFFFFF',
              borderRadius: 12,
              border: '1px solid #D9E2EC',
              boxShadow: 'var(--shadow-card)',
              padding: 18,
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
                    fontSize: 16,
                    fontWeight: 700,
                    color: '#182c39',
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  {assignment.student?.name ?? 'Candidate'}
                </div>
                <div style={{ marginTop: 4, fontSize: 12, color: '#60717d' }}>
                  {[assignment.student?.university, assignment.student?.department]
                    .filter(Boolean)
                    .join(' • ')}
                </div>
              </div>
              <span
                style={{
                  borderRadius: 999,
                  padding: '6px 10px',
                  background: '#f6f8f9',
                  border: '1px solid #dfe6e9',
                  color: '#475569',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                {formatAssessmentAssignmentStatus(assignment.status)}
              </span>
            </div>

            <div
              style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: 10 }}
            >
              {[
                { label: 'Fit', value: assignment.application?.fitScore ?? '—' },
                { label: 'Objective', value: assignment.submission?.objectiveScore ?? '—' },
                { label: 'Manual', value: assignment.submission?.manualScore ?? '—' },
                { label: 'Total', value: assignment.submission?.totalScore ?? '—' },
              ].map((stat) => (
                <div
                  key={stat.label}
                  style={{
                    borderRadius: 14,
                    background: '#f6f8f9',
                    border: '1px solid #dfe6e9',
                    padding: '10px 12px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: '#087f72',
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div style={{ marginTop: 4, fontSize: 11, color: '#60717d', fontWeight: 700 }}>
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ fontSize: 12, color: '#60717d' }}>
              Submitted: {formatDhakaDateTime(assignment.submission?.submittedAt, 'Not submitted')}
            </div>

            {assignment.application?._id ? (
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid #dfe6e9',
                  background: '#f6f8f9',
                  padding: '12px 14px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'grid', gap: 4 }}>
                  <div style={{ fontSize: 12, color: '#60717d', fontWeight: 700 }}>
                    Candidate decision
                  </div>
                  <div style={{ fontSize: 13, color: '#182c39', fontWeight: 800 }}>
                    Update the pipeline status directly while you review this submission.
                  </div>
                </div>
                <ApplicantActions
                  appId={assignment.application._id}
                  currentStatus={assignment.application.status}
                />
              </div>
            ) : null}

            {(assignment.submission?.answers ?? []).map((answer) => {
              const question = assessment.questions.find(
                (item) => item.index === answer.questionIndex
              );
              const currentGrade =
                gradingState[assignment._id]?.[answer.questionIndex] ??
                ({
                  marksAwarded: answer.manualMarksAwarded ?? 0,
                  evaluationNotes: answer.evaluationNotes ?? '',
                } as const);

              return (
                <div
                  key={`${assignment._id}-${answer.questionIndex}`}
                  style={{
                    borderRadius: 12,
                    border: '1px solid #dfe6e9',
                    background: '#FFFFFF',
                    padding: 14,
                    display: 'grid',
                    gap: 10,
                  }}
                >
                  <div style={{ fontSize: 13, fontWeight: 700, color: '#182c39' }}>
                    Q{answer.questionIndex}. {question?.questionText ?? 'Question'}
                  </div>
                  <div
                    style={{
                      fontSize: 13,
                      color: '#334155',
                      lineHeight: 1.7,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {answer.answerText || answer.code || 'No answer submitted.'}
                  </div>
                  {answer.executionStatus ? (
                    <div style={{ fontSize: 12, color: '#60717d' }}>
                      Execution: {answer.executionStatus}
                    </div>
                  ) : null}
                  {typeof answer.plagiarismScore === 'number' ? (
                    <div style={{ fontSize: 12, color: '#60717d' }}>
                      Similarity flag: {answer.plagiarismScore}%
                    </div>
                  ) : null}
                  {typeof answer.objectiveMarksAwarded === 'number' ? (
                    <div style={{ fontSize: 12, color: '#60717d' }}>
                      Auto score: {answer.objectiveMarksAwarded}
                      {question ? ` / ${question.marks}` : ''}
                    </div>
                  ) : null}
                  {answer.evaluationNotes ? (
                    <div
                      style={{
                        borderRadius: 12,
                        border: '1px solid #dfe6e9',
                        background: '#f6f8f9',
                        padding: '10px 12px',
                        fontSize: 12,
                        color: '#475569',
                        lineHeight: 1.7,
                        whiteSpace: 'pre-wrap',
                      }}
                    >
                      {answer.evaluationNotes}
                    </div>
                  ) : null}
                  {(answer.uploadedFiles ?? []).length > 0 ? (
                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                      {answer.uploadedFiles?.map((file) => (
                        <a
                          key={file.url}
                          href={file.url}
                          target="_blank"
                          rel="noreferrer"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            borderRadius: 999,
                            padding: '6px 10px',
                            background: '#edf7f3',
                            border: '1px solid #bdddd5',
                            color: '#087f72',
                            fontSize: 12,
                            fontWeight: 700,
                            textDecoration: 'none',
                          }}
                        >
                          {file.name}
                        </a>
                      ))}
                    </div>
                  ) : null}
                  <div className="manual-grade-grid">
                    <input
                      type="number"
                      min={0}
                      max={question?.marks ?? 100}
                      value={currentGrade.marksAwarded}
                      onChange={(event) =>
                        setGradingState((current) => ({
                          ...current,
                          [assignment._id]: {
                            ...(current[assignment._id] ?? {}),
                            [answer.questionIndex]: {
                              ...currentGrade,
                              marksAwarded: Number(event.target.value) || 0,
                            },
                          },
                        }))
                      }
                      style={fieldStyle}
                      placeholder="Additional manual marks"
                    />
                    <input
                      value={currentGrade.evaluationNotes}
                      onChange={(event) =>
                        setGradingState((current) => ({
                          ...current,
                          [assignment._id]: {
                            ...(current[assignment._id] ?? {}),
                            [answer.questionIndex]: {
                              ...currentGrade,
                              evaluationNotes: event.target.value,
                            },
                          },
                        }))
                      }
                      style={fieldStyle}
                      placeholder="Evaluator note"
                    />
                  </div>
                </div>
              );
            })}

            {assignment.submission ? (
              <button
                type="button"
                onClick={() => saveManualGrade(assignment._id)}
                disabled={gradingId === assignment._id}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  background: '#182c39',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: 12,
                  padding: '10px 14px',
                  fontSize: 12,
                  fontWeight: 700,
                  cursor: gradingId === assignment._id ? 'not-allowed' : 'pointer',
                }}
              >
                {gradingId === assignment._id ? (
                  <Loader2 size={14} className="spin" />
                ) : (
                  <Save size={14} />
                )}
                {gradingId === assignment._id ? 'Saving...' : 'Save grading and notes'}
              </button>
            ) : (
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  color: '#60717d',
                  fontSize: 12,
                  fontWeight: 700,
                }}
              >
                <CheckCircle2 size={14} />
                Waiting for submission
              </div>
            )}
          </div>
        ))}
      </div>

      <style>{`
        .assessment-comparison-grid {
          display: grid;
          gap: 16px;
        }

        .manual-grade-grid {
          display: grid;
          grid-template-columns: 160px 1fr;
          gap: 10px;
        }

        .spin {
          animation: spin 0.9s linear infinite;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        @media (max-width: 860px) {
          .manual-grade-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
    </div>
  );
}
