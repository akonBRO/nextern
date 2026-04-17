'use client';

import { useState } from 'react';
import Link from 'next/link';
import { describeAIExecutionMeta, type AIExecutionMeta } from '@/lib/ai-meta';
import {
  Brain,
  CheckCircle2,
  Crown,
  LoaderCircle,
  MessageSquare,
  Rocket,
  Sparkles,
  Target,
} from 'lucide-react';

type AnalysisItem = {
  applicationId: string;
  jobId: string;
  jobTitle: string;
  companyName: string;
  fitScore: number;
  hardGaps: string[];
  softGaps: string[];
  metRequirements: string[];
  suggestedPath: string[];
  summary: string;
  analyzedAt?: string;
  meta: AIExecutionMeta;
};

type UsageSummary = {
  isPremium: boolean;
  counts: {
    skillGapAnalysis: number;
    mockInterview: number;
  };
  remaining: {
    skillGapAnalysis: number | null;
    mockInterview: number | null;
  };
};

type TrainingStep = {
  order: number;
  action: string;
  resource: string;
  url: string;
  estimatedDays: number;
  isFree: boolean;
  type: 'course' | 'project' | 'practice' | 'certification';
};

const C = {
  blue: '#2563EB',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  bg: '#F1F5F9',
  success: '#10B981',
  warning: '#F59E0B',
};

function Badge({
  label,
  tone = 'neutral',
}: {
  label: string;
  tone?: 'neutral' | 'warning' | 'success' | 'info';
}) {
  const palette = {
    neutral: { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' },
    warning: { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' },
    success: { bg: '#ECFDF5', color: '#166534', border: '#A7F3D0' },
    info: { bg: '#EFF6FF', color: '#2563EB', border: '#BFDBFE' },
  } as const;

  const colors = palette[tone];

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        background: colors.bg,
        color: colors.color,
        border: `1px solid ${colors.border}`,
      }}
    >
      {label}
    </span>
  );
}

function StatusNotice({ meta }: { meta: AIExecutionMeta }) {
  const info = describeAIExecutionMeta(meta);
  const palette =
    meta.mode === 'ai'
      ? { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE' }
      : meta.mode === 'fallback'
        ? { bg: '#FFFBEB', color: '#92400E', border: '#FDE68A' }
        : { bg: '#F8FAFC', color: '#475569', border: '#E2E8F0' };

  return (
    <div
      style={{
        borderRadius: 14,
        border: `1px solid ${palette.border}`,
        background: palette.bg,
        color: palette.color,
        padding: '12px 14px',
        fontSize: 13,
        lineHeight: 1.7,
      }}
    >
      {info.detail}
    </div>
  );
}

export default function SkillsHubClient({
  analyses,
  usage,
}: {
  analyses: AnalysisItem[];
  usage: UsageSummary;
}) {
  const [selectedSkill, setSelectedSkill] = useState('');
  const [trainingPath, setTrainingPath] = useState<TrainingStep[]>([]);
  const [trainingMeta, setTrainingMeta] = useState<AIExecutionMeta | null>(null);
  const [trainingLoading, setTrainingLoading] = useState(false);
  const [trainingError, setTrainingError] = useState('');

  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState('');
  const [adviceMeta, setAdviceMeta] = useState<AIExecutionMeta | null>(null);
  const [adviceLoading, setAdviceLoading] = useState(false);
  const [adviceError, setAdviceError] = useState('');

  async function handleGenerateTrainingPath(skill: string, targetRole: string) {
    setSelectedSkill(skill);
    setTrainingLoading(true);
    setTrainingError('');
    setTrainingMeta(null);

    try {
      const res = await fetch('/api/ai/training-path', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ skill, targetRole }),
      });
      const data = await res.json();

      if (!res.ok) {
        setTrainingError(data.error ?? 'Failed to generate training path.');
        setTrainingPath([]);
        return;
      }

      setTrainingPath(data.steps ?? []);
      setTrainingMeta(data.meta ?? null);
    } catch {
      setTrainingError('Network error while generating the training path.');
      setTrainingPath([]);
    } finally {
      setTrainingLoading(false);
    }
  }

  async function handleAskAdvice() {
    if (!question.trim()) {
      setAdviceError('Enter a question first.');
      return;
    }

    setAdviceLoading(true);
    setAdviceError('');
    setAnswer('');
    setAdviceMeta(null);

    try {
      const res = await fetch('/api/ai/career-advice', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
      });
      const data = await res.json();

      if (!res.ok) {
        setAdviceError(data.error ?? 'Failed to generate career advice.');
        return;
      }

      setAnswer(data.answer ?? '');
      setAdviceMeta(data.meta ?? null);
    } catch {
      setAdviceError('Network error while contacting the career advisor.');
    } finally {
      setAdviceLoading(false);
    }
  }

  const trainingMetaInfo = trainingMeta ? describeAIExecutionMeta(trainingMeta) : null;
  const adviceMetaInfo = adviceMeta ? describeAIExecutionMeta(adviceMeta) : null;

  return (
    <div style={{ display: 'grid', gap: 18 }}>
      <div
        style={{
          borderRadius: 24,
          padding: 24,
          background: '#FFFFFF',
          border: `1px solid ${C.border}`,
          boxShadow: '0 26px 60px rgba(15,23,42,0.16)',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 18,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '8px 12px',
                borderRadius: 999,
                border: '1px solid #BFDBFE',
                background: '#EFF6FF',
                color: C.blue,
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <Sparkles size={14} />
              Nextern AI workspace
            </div>
            <h2
              style={{
                margin: '16px 0 0',
                fontSize: 30,
                lineHeight: 1.08,
                color: C.text,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
              }}
            >
              Understand your gaps, then close them fast
            </h2>
            <p
              style={{
                margin: '12px 0 0',
                color: C.muted,
                fontSize: 14,
                maxWidth: 640,
                lineHeight: 1.7,
              }}
            >
              Every AI feature now shows when Nextern AI generated the result directly and when
              fallback-generated logic was used instead.
            </p>
          </div>

          <div style={{ display: 'grid', gap: 10, minWidth: 260 }}>
            <div
              style={{
                background: C.bg,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: '14px 16px',
              }}
            >
              <div style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>
                Skill analyses this month
              </div>
              <div
                style={{
                  color: C.text,
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  marginTop: 4,
                }}
              >
                {usage.counts.skillGapAnalysis}
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                {usage.isPremium
                  ? 'Unlimited on Premium'
                  : `${usage.remaining.skillGapAnalysis ?? 0} free analyses left this month`}
              </div>
            </div>

            <div
              style={{
                background: C.bg,
                borderRadius: 16,
                border: `1px solid ${C.border}`,
                padding: '14px 16px',
              }}
            >
              <div style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>Mock interviews</div>
              <div
                style={{
                  color: C.text,
                  fontSize: 28,
                  fontWeight: 900,
                  fontFamily: 'var(--font-display)',
                  marginTop: 4,
                }}
              >
                {usage.counts.mockInterview}
              </div>
              <div style={{ color: C.muted, fontSize: 12, marginTop: 4 }}>
                {usage.isPremium
                  ? 'Unlimited on Premium'
                  : `${usage.remaining.mockInterview ?? 0} free mock interviews left this month`}
              </div>
            </div>
          </div>
        </div>

        {!usage.isPremium ? (
          <div
            style={{
              marginTop: 18,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: '#FFF7ED',
              border: '1px solid #FCD34D',
              borderRadius: 999,
              padding: '8px 14px',
              color: '#92400E',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Crown size={14} />
            Premium unlocks personalized training paths and unlimited AI runs.
            <Link
              href="/student/premium"
              style={{ color: C.blue, fontWeight: 700, textDecoration: 'none' }}
            >
              Upgrade
            </Link>
          </div>
        ) : null}
      </div>

      <div
        style={{ display: 'grid', gridTemplateColumns: '1.25fr 0.95fr', gap: 18 }}
        className="skills-grid"
      >
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            border: `1px solid ${C.border}`,
            boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
            padding: 22,
          }}
        >
          <div style={{ marginBottom: 18 }}>
            <h3
              style={{
                margin: 0,
                fontSize: 20,
                fontWeight: 800,
                color: C.text,
                fontFamily: 'var(--font-display)',
              }}
            >
              Saved fit analyses
            </h3>
            <p style={{ margin: '8px 0 0', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
              These are the saved fit analyses already attached to your applications.
            </p>
          </div>

          {analyses.length > 0 ? (
            <div style={{ display: 'grid', gap: 14 }}>
              {analyses.map((analysis) => {
                const metaInfo = describeAIExecutionMeta(analysis.meta);

                return (
                  <div
                    key={analysis.applicationId}
                    style={{
                      padding: 18,
                      borderRadius: 18,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 12,
                        flexWrap: 'wrap',
                      }}
                    >
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                          {analysis.jobTitle}
                        </div>
                        <div style={{ marginTop: 4, color: C.muted, fontSize: 13 }}>
                          {analysis.companyName}
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 10 }}>
                          <Badge label={metaInfo.badgeLabel} tone={metaInfo.badgeTone} />
                          {analysis.analyzedAt ? (
                            <Badge
                              label={new Date(analysis.analyzedAt).toLocaleDateString()}
                              tone="neutral"
                            />
                          ) : null}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: 30,
                            fontWeight: 900,
                            color:
                              analysis.fitScore >= 75
                                ? C.success
                                : analysis.fitScore >= 50
                                  ? C.blue
                                  : C.warning,
                            fontFamily: 'var(--font-display)',
                          }}
                        >
                          {analysis.fitScore}%
                        </div>
                        <div style={{ color: C.muted, fontSize: 12, fontWeight: 700 }}>
                          Fit score
                        </div>
                      </div>
                    </div>

                    {analysis.summary ? (
                      <p
                        style={{ margin: '12px 0 0', color: C.text, fontSize: 14, lineHeight: 1.7 }}
                      >
                        {analysis.summary}
                      </p>
                    ) : null}

                    <div style={{ marginTop: 12 }}>
                      <StatusNotice meta={analysis.meta} />
                    </div>

                    <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
                      <div>
                        <div
                          style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}
                        >
                          Hard gaps
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {analysis.hardGaps.length > 0 ? (
                            analysis.hardGaps.map((gap) => (
                              <button
                                key={gap}
                                onClick={() => handleGenerateTrainingPath(gap, analysis.jobTitle)}
                                style={{
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: 6,
                                  padding: '6px 10px',
                                  borderRadius: 999,
                                  border: '1px solid #FDE68A',
                                  background: '#FFFBEB',
                                  color: '#92400E',
                                  fontSize: 12,
                                  fontWeight: 700,
                                  cursor: 'pointer',
                                }}
                              >
                                <Target size={12} />
                                {gap}
                              </button>
                            ))
                          ) : (
                            <Badge label="No hard gaps detected" tone="success" />
                          )}
                        </div>
                      </div>

                      <div>
                        <div
                          style={{ fontSize: 12, fontWeight: 700, color: C.muted, marginBottom: 8 }}
                        >
                          Strengths
                        </div>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          {analysis.metRequirements.length > 0 ? (
                            analysis.metRequirements.map((item) => (
                              <Badge key={item} label={item} tone="success" />
                            ))
                          ) : (
                            <Badge
                              label="Run more analyses to unlock stronger signals"
                              tone="neutral"
                            />
                          )}
                        </div>
                      </div>

                      {analysis.suggestedPath.length > 0 ? (
                        <div>
                          <div
                            style={{
                              fontSize: 12,
                              fontWeight: 700,
                              color: C.muted,
                              marginBottom: 8,
                            }}
                          >
                            Suggested next actions
                          </div>
                          <div style={{ display: 'grid', gap: 8 }}>
                            {analysis.suggestedPath.map((item, index) => (
                              <div
                                key={`${analysis.applicationId}-${index}`}
                                style={{ display: 'flex', gap: 8 }}
                              >
                                <div
                                  style={{
                                    width: 22,
                                    height: 22,
                                    borderRadius: 7,
                                    background: '#EFF6FF',
                                    color: C.blue,
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontSize: 11,
                                    fontWeight: 800,
                                    flexShrink: 0,
                                  }}
                                >
                                  {index + 1}
                                </div>
                                <span style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>
                                  {item}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div
              style={{
                borderRadius: 20,
                border: '1px dashed #CBD5E1',
                background: '#F8FAFC',
                padding: '28px 18px',
                textAlign: 'center',
              }}
            >
              <Brain size={28} color={C.blue} style={{ marginBottom: 12 }} />
              <div style={{ fontSize: 16, fontWeight: 800, color: C.text }}>
                No saved analyses yet
              </div>
              <p
                style={{
                  margin: '8px auto 16px',
                  fontSize: 13,
                  color: C.muted,
                  maxWidth: 420,
                  lineHeight: 1.7,
                }}
              >
                Open a job detail page and run AI analysis, or apply to a role to let the platform
                save one automatically.
              </p>
              <Link
                href="/student/jobs"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  background: C.blue,
                  color: '#FFFFFF',
                  padding: '10px 16px',
                  borderRadius: 12,
                  fontSize: 14,
                  fontWeight: 700,
                  textDecoration: 'none',
                }}
              >
                <Rocket size={15} />
                Browse jobs
              </Link>
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gap: 18 }}>
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              border: `1px solid ${C.border}`,
              boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
              padding: 22,
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 19,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Premium training path
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Click any hard gap to generate a practical learning roadmap.
              </p>
            </div>

            {trainingMeta ? (
              <div style={{ display: 'grid', gap: 10, marginBottom: 14 }}>
                <Badge
                  label={trainingMetaInfo?.badgeLabel ?? 'Training path result'}
                  tone={trainingMetaInfo?.badgeTone ?? 'info'}
                />
                <StatusNotice meta={trainingMeta} />
              </div>
            ) : null}

            {trainingError ? (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  padding: '10px 12px',
                  color: '#991B1B',
                  fontSize: 13,
                  marginBottom: 14,
                }}
              >
                {trainingError}
              </div>
            ) : null}

            {trainingLoading ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  color: C.muted,
                  fontSize: 13,
                }}
              >
                <LoaderCircle size={18} className="skills-loader" />
                Building your training roadmap...
              </div>
            ) : trainingPath.length > 0 ? (
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                  Learning plan for {selectedSkill}
                </div>
                {trainingPath.map((step) => (
                  <div
                    key={`${selectedSkill}-${step.order}`}
                    style={{
                      padding: 14,
                      borderRadius: 16,
                      border: '1px solid #E2E8F0',
                      background: '#F8FAFC',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                      <div style={{ fontSize: 14, fontWeight: 800, color: C.text }}>
                        {step.action}
                      </div>
                      <Badge label={`${step.estimatedDays}d`} tone="info" />
                    </div>
                    <div style={{ marginTop: 6, fontSize: 12, color: C.muted, lineHeight: 1.6 }}>
                      {step.resource} | {step.type} | {step.isFree ? 'Free' : 'Paid'}
                    </div>
                    {step.url ? (
                      <a
                        href={step.url}
                        target="_blank"
                        rel="noreferrer"
                        style={{
                          display: 'inline-flex',
                          marginTop: 8,
                          color: C.blue,
                          fontSize: 12,
                          fontWeight: 700,
                          textDecoration: 'none',
                        }}
                      >
                        Open resource
                      </a>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ color: C.muted, fontSize: 13, lineHeight: 1.7 }}>
                Select a hard gap from the analysis list to generate a targeted training path.
              </div>
            )}
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 24,
              border: `1px solid ${C.border}`,
              boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
              padding: 22,
            }}
          >
            <div style={{ marginBottom: 14 }}>
              <h3
                style={{
                  margin: 0,
                  fontSize: 19,
                  fontWeight: 800,
                  color: C.text,
                  fontFamily: 'var(--font-display)',
                }}
              >
                Career advice coach
              </h3>
              <p style={{ margin: '8px 0 0', fontSize: 13, color: C.muted, lineHeight: 1.6 }}>
                Ask Nextern AI what to do next based on your profile and current career goals.
              </p>
            </div>

            <textarea
              value={question}
              onChange={(event) => setQuestion(event.target.value)}
              rows={5}
              placeholder="Example: I am getting shortlisted but not converting interviews. What should I improve this week?"
              style={{
                width: '100%',
                boxSizing: 'border-box',
                padding: '12px 14px',
                border: `1.5px solid ${C.border}`,
                borderRadius: 14,
                fontSize: 14,
                fontFamily: 'var(--font-body)',
                color: C.text,
                outline: 'none',
                resize: 'vertical',
              }}
            />

            {adviceError ? (
              <div
                style={{
                  background: '#FEF2F2',
                  border: '1px solid #FECACA',
                  borderRadius: 12,
                  padding: '10px 12px',
                  color: '#991B1B',
                  fontSize: 13,
                  marginTop: 12,
                }}
              >
                {adviceError}
              </div>
            ) : null}

            <button
              onClick={handleAskAdvice}
              disabled={adviceLoading}
              style={{
                marginTop: 14,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: adviceLoading ? '#93C5FD' : C.blue,
                color: '#FFFFFF',
                border: 'none',
                borderRadius: 12,
                padding: '11px 16px',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
                cursor: adviceLoading ? 'not-allowed' : 'pointer',
              }}
            >
              {adviceLoading ? (
                <LoaderCircle size={16} className="skills-loader" />
              ) : (
                <MessageSquare size={16} />
              )}
              {adviceLoading ? 'Thinking...' : 'Ask for advice'}
            </button>

            {answer ? (
              <div
                style={{
                  marginTop: 16,
                  borderRadius: 18,
                  border: '1px solid #BFDBFE',
                  background: '#EFF6FF',
                  padding: 16,
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    marginBottom: 8,
                    color: C.blue,
                    flexWrap: 'wrap',
                  }}
                >
                  <CheckCircle2 size={15} />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>Career advice result</span>
                  {adviceMetaInfo ? (
                    <Badge label={adviceMetaInfo.badgeLabel} tone={adviceMetaInfo.badgeTone} />
                  ) : null}
                </div>
                <p style={{ margin: 0, color: C.text, fontSize: 14, lineHeight: 1.8 }}>{answer}</p>
                {adviceMeta ? (
                  <div style={{ marginTop: 12 }}>
                    <StatusNotice meta={adviceMeta} />
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      <style>{`
        .skills-loader {
          animation: skills-spin 0.9s linear infinite;
        }

        @keyframes skills-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 980px) {
          .skills-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
