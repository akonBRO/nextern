'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { describeAIExecutionMeta, type AIExecutionMeta } from '@/lib/ai-meta';
import {
  Brain,
  ChevronRight,
  Crown,
  LoaderCircle,
  Mic,
  RefreshCw,
  Send,
  Trophy,
} from 'lucide-react';

const C = {
  blue: '#2563EB',
  bg: '#F1F5F9',
  border: '#E2E8F0',
  text: '#0F172A',
  muted: '#64748B',
  success: '#10B981',
  warning: '#F59E0B',
};

const INDUSTRIES = [
  'IT/Software',
  'Banking & Finance',
  'NGO/Development',
  'RMG/Textile',
  'Telecom',
  'Pharma',
  'E-commerce/Startup',
  'FMCG',
  'Manufacturing',
];

const ROLES = [
  'Software Engineer Intern',
  'Frontend Developer Intern',
  'Backend Developer Intern',
  'Data Analyst Intern',
  'Business Analyst Intern',
  'Marketing Intern',
  'Finance Intern',
  'HR Intern',
  'UI/UX Design Intern',
  'Operations Intern',
];

type Stage = 'setup' | 'loading' | 'interview' | 'feedback';

type ChatMessage = { role: 'user' | 'assistant'; content: string };

type Feedback = {
  overallScore: number;
  overallFeedback: string;
  strengths: string[];
  areasToImprove: string[];
  communicationScore: number;
  technicalScore: number;
  confidenceScore: number;
  nextSteps: string[];
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

function MetaPanel({ label, meta }: { label: string; meta: AIExecutionMeta }) {
  const info = describeAIExecutionMeta(meta);

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <Badge label={`${label}: ${info.badgeLabel}`} tone={info.badgeTone} />
      <StatusNotice meta={meta} />
    </div>
  );
}

function ScorePill({ label, score }: { label: string; score: number }) {
  const color = score >= 75 ? C.success : score >= 50 ? C.warning : '#EF4444';

  return (
    <div
      style={{
        background: '#FFFFFF',
        borderRadius: 14,
        padding: '14px 18px',
        border: `1px solid ${C.border}`,
        textAlign: 'center',
      }}
    >
      <div
        style={{
          fontSize: 28,
          fontWeight: 900,
          color,
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}
      >
        {score}
      </div>
      <div style={{ color: C.muted, fontSize: 12, marginTop: 4, fontWeight: 600 }}>{label}</div>
      <div
        style={{
          height: 4,
          background: C.bg,
          borderRadius: 999,
          marginTop: 8,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${score}%`,
            height: '100%',
            background: color,
            borderRadius: 999,
            transition: 'width 0.8s ease',
          }}
        />
      </div>
    </div>
  );
}

export default function MockInterviewClient() {
  const [stage, setStage] = useState<Stage>('setup');
  const [targetRole, setTargetRole] = useState('');
  const [industry, setIndustry] = useState('');
  const [customRole, setCustomRole] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');
  const [usage, setUsage] = useState<UsageSummary | null>(null);
  const [usageLoading, setUsageLoading] = useState(true);
  const [questionMeta, setQuestionMeta] = useState<AIExecutionMeta | null>(null);
  const [conversationMeta, setConversationMeta] = useState<AIExecutionMeta | null>(null);
  const [feedbackMeta, setFeedbackMeta] = useState<AIExecutionMeta | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    let active = true;

    async function loadUsage() {
      try {
        const res = await fetch('/api/premium/status');
        const data = await res.json();
        if (res.ok && active) {
          setUsage(data);
        }
      } catch {
        // Silent fallback.
      } finally {
        if (active) {
          setUsageLoading(false);
        }
      }
    }

    loadUsage();
    return () => {
      active = false;
    };
  }, []);

  async function startInterview() {
    const role = customRole.trim() || targetRole;
    if (!role || !industry) {
      setError('Please select a role and industry.');
      return;
    }

    setError('');
    setStage('loading');
    setQuestionMeta(null);
    setConversationMeta(null);
    setFeedbackMeta(null);

    try {
      const res = await fetch('/api/mock-interview/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetRole: role, targetIndustry: industry }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (data.usage) setUsage(data.usage);
        setError(data.error ?? 'Failed to start interview. Please try again.');
        setStage('setup');
        return;
      }

      setSessionId(data.sessionId);
      if (data.usage) setUsage(data.usage);
      setQuestionMeta(data.questionMeta ?? null);
      setConversationMeta(data.conversationMeta ?? null);
      setMessages([{ role: 'assistant', content: data.firstQuestion }]);
      setStage('interview');
    } catch {
      setError('Network error. Please check your connection.');
      setStage('setup');
    }
  }

  async function sendMessage() {
    if (!input.trim() || sending) return;

    const message = input.trim();
    setMessages((prev) => [...prev, { role: 'user', content: message }]);
    setInput('');
    setSending(true);
    setError('');

    try {
      const res = await fetch('/api/mock-interview/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, message }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Failed to send message.');
        return;
      }

      setMessages((prev) => [...prev, { role: 'assistant', content: data.reply }]);
      setConversationMeta(data.meta ?? null);

      if (data.isComplete) {
        setStage('loading');
        const feedbackRes = await fetch('/api/mock-interview/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sessionId }),
        });
        const feedbackData = await feedbackRes.json();

        if (!feedbackRes.ok) {
          setError(feedbackData.error ?? 'Failed to generate feedback.');
          setStage('interview');
          return;
        }

        setFeedback(feedbackData.feedback);
        setFeedbackMeta(feedbackData.meta ?? null);
        setStage('feedback');
      }
    } catch {
      setError('Failed to send. Please try again.');
    } finally {
      setSending(false);
    }
  }

  function handleKeyDown(event: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage();
    }
  }

  function resetInterview() {
    setStage('setup');
    setTargetRole('');
    setIndustry('');
    setCustomRole('');
    setMessages([]);
    setInput('');
    setSending(false);
    setFeedback(null);
    setSessionId('');
    setError('');
    setQuestionMeta(null);
    setConversationMeta(null);
    setFeedbackMeta(null);
  }

  if (stage === 'feedback' && feedback) {
    const feedbackInfo = feedbackMeta ? describeAIExecutionMeta(feedbackMeta) : null;

    return (
      <div style={{ display: 'grid', gap: 20 }}>
        <div
          style={{
            background: '#FFFFFF',
            borderRadius: 24,
            padding: 28,
            border: `1px solid ${C.border}`,
            boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
          }}
        >
          <div style={{ textAlign: 'center', marginBottom: 24 }}>
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
                boxShadow: '0 12px 32px rgba(37,99,235,0.3)',
              }}
            >
              <Trophy size={32} color="#FFFFFF" />
            </div>
            <h2
              style={{
                fontSize: 28,
                fontWeight: 900,
                color: C.text,
                fontFamily: 'var(--font-display)',
                margin: 0,
              }}
            >
              Interview complete
            </h2>
            <div
              style={{
                fontSize: 48,
                fontWeight: 900,
                color: C.blue,
                fontFamily: 'var(--font-display)',
                lineHeight: 1,
                marginTop: 10,
              }}
            >
              {feedback.overallScore}
            </div>
            <div style={{ color: C.muted, fontSize: 14, marginTop: 4 }}>Overall score</div>
            {feedbackInfo ? (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: 12 }}>
                <Badge
                  label={`Feedback: ${feedbackInfo.badgeLabel}`}
                  tone={feedbackInfo.badgeTone}
                />
              </div>
            ) : null}
          </div>

          <div
            style={{
              background: '#F8FAFC',
              borderRadius: 20,
              padding: 20,
              border: `1px solid ${C.border}`,
            }}
          >
            <p style={{ color: C.text, fontSize: 15, lineHeight: 1.8, margin: 0 }}>
              {feedback.overallFeedback}
            </p>
          </div>

          {feedbackMeta ? (
            <div style={{ marginTop: 16 }}>
              <StatusNotice meta={feedbackMeta} />
            </div>
          ) : null}
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: 14 }}
          className="mock-grid"
        >
          <ScorePill label="Communication" score={feedback.communicationScore} />
          <ScorePill label="Technical" score={feedback.technicalScore} />
          <ScorePill label="Confidence" score={feedback.confidenceScore} />
        </div>

        <div
          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}
          className="mock-grid"
        >
          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 22,
              border: `1px solid ${C.border}`,
              boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: C.success,
                fontFamily: 'var(--font-display)',
                marginBottom: 14,
              }}
            >
              Strengths
            </h3>
            {feedback.strengths.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <span style={{ color: C.success, fontSize: 12, fontWeight: 700, minWidth: 18 }}>
                  {index + 1}.
                </span>
                <span style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>

          <div
            style={{
              background: '#FFFFFF',
              borderRadius: 20,
              padding: 22,
              border: `1px solid ${C.border}`,
              boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
            }}
          >
            <h3
              style={{
                fontSize: 15,
                fontWeight: 800,
                color: C.warning,
                fontFamily: 'var(--font-display)',
                marginBottom: 14,
              }}
            >
              Areas to improve
            </h3>
            {feedback.areasToImprove.map((item, index) => (
              <div key={index} style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
                <span style={{ color: C.warning, fontSize: 12, fontWeight: 700, minWidth: 18 }}>
                  {index + 1}.
                </span>
                <span style={{ color: C.text, fontSize: 13, lineHeight: 1.6 }}>{item}</span>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B, #1E3A5F)',
            borderRadius: 20,
            padding: 24,
          }}
        >
          <h3
            style={{
              fontSize: 15,
              fontWeight: 800,
              color: '#FFFFFF',
              fontFamily: 'var(--font-display)',
              marginBottom: 14,
            }}
          >
            Next steps
          </h3>
          {feedback.nextSteps.map((step, index) => (
            <div
              key={index}
              style={{ display: 'flex', gap: 10, marginBottom: 10, alignItems: 'flex-start' }}
            >
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: 6,
                  background: 'rgba(37,99,235,0.3)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  fontSize: 11,
                  fontWeight: 700,
                  color: '#93C5FD',
                }}
              >
                {index + 1}
              </div>
              <span style={{ color: '#CBD5E1', fontSize: 14, lineHeight: 1.6 }}>{step}</span>
            </div>
          ))}
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={resetInterview}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: C.blue,
              color: '#FFFFFF',
              border: 'none',
              borderRadius: 12,
              padding: '12px 18px',
              fontSize: 14,
              fontWeight: 800,
              fontFamily: 'var(--font-display)',
              cursor: 'pointer',
            }}
          >
            <RefreshCw size={15} />
            Start another interview
          </button>
        </div>

        <style>{`
          @media (max-width: 900px) {
            .mock-grid {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>
      </div>
    );
  }

  if (stage === 'interview') {
    const conversationInfo = conversationMeta ? describeAIExecutionMeta(conversationMeta) : null;

    return (
      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          border: `1px solid ${C.border}`,
          boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            padding: '18px 22px',
            borderBottom: `1px solid ${C.border}`,
            background: 'linear-gradient(135deg, #1E293B, rgba(37,99,235,0.96))',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 12,
            flexWrap: 'wrap',
          }}
        >
          <div>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: 18,
                fontWeight: 800,
                fontFamily: 'var(--font-display)',
              }}
            >
              Live mock interview
            </div>
            <div style={{ color: '#CBD5E1', fontSize: 12, marginTop: 4 }}>
              Answer naturally. The interview ends automatically after all questions.
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
            <div
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: conversationMeta?.mode === 'fallback' ? '#F59E0B' : '#10B981',
                boxShadow:
                  conversationMeta?.mode === 'fallback' ? '0 0 6px #F59E0B' : '0 0 6px #10B981',
              }}
            />
            <span style={{ color: '#CBD5E1', fontSize: 13 }}>
              {conversationInfo?.badgeLabel ?? 'Interviewer active'}
            </span>
          </div>
        </div>

        <div style={{ padding: 22 }}>
          {error ? (
            <div
              style={{
                background: '#FEF2F2',
                border: '1px solid #FECACA',
                borderRadius: 12,
                padding: '12px 16px',
                marginBottom: 16,
                color: '#991B1B',
                fontSize: 14,
              }}
            >
              {error}
            </div>
          ) : null}

          <div style={{ display: 'grid', gap: 12, marginBottom: 16 }}>
            {questionMeta ? <MetaPanel label="Question plan" meta={questionMeta} /> : null}
            {conversationMeta ? <MetaPanel label="Interviewer" meta={conversationMeta} /> : null}
          </div>

          <div
            style={{
              minHeight: 420,
              maxHeight: 520,
              overflowY: 'auto',
              padding: '4px 4px 0',
              marginBottom: 16,
            }}
          >
            {messages.map((message, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                  marginBottom: 16,
                }}
              >
                {message.role === 'assistant' ? (
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginRight: 10,
                      flexShrink: 0,
                      alignSelf: 'flex-end',
                    }}
                  >
                    <Brain size={18} color="#FFFFFF" />
                  </div>
                ) : null}

                <div
                  style={{
                    maxWidth: '72%',
                    padding: '14px 18px',
                    borderRadius:
                      message.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                    background: message.role === 'user' ? C.blue : '#FFFFFF',
                    border: message.role === 'user' ? 'none' : `1px solid ${C.border}`,
                    boxShadow: '0 4px 16px rgba(15,23,42,0.08)',
                    color: message.role === 'user' ? '#FFFFFF' : C.text,
                    fontSize: 15,
                    lineHeight: 1.7,
                  }}
                >
                  {message.content}
                </div>
              </div>
            ))}

            {sending ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <Brain size={18} color="#FFFFFF" />
                </div>
                <div
                  style={{
                    padding: '12px 18px',
                    borderRadius: '18px 18px 18px 4px',
                    background: '#FFFFFF',
                    border: `1px solid ${C.border}`,
                    color: C.muted,
                    fontSize: 13,
                  }}
                >
                  Thinking...
                </div>
              </div>
            ) : null}

            <div ref={bottomRef} />
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your answer... (Enter to send, Shift+Enter for new line)"
              rows={2}
              disabled={sending}
              style={{
                flex: 1,
                padding: '12px 16px',
                border: `1.5px solid ${C.border}`,
                borderRadius: 14,
                fontSize: 15,
                fontFamily: 'var(--font-body)',
                resize: 'none',
                outline: 'none',
                color: C.text,
                lineHeight: 1.6,
              }}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || sending}
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                background: C.blue,
                border: 'none',
                cursor: !input.trim() || sending ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                alignSelf: 'flex-end',
                opacity: !input.trim() || sending ? 0.5 : 1,
                boxShadow: '0 4px 12px rgba(37,99,235,0.3)',
              }}
            >
              <Send size={18} color="#FFFFFF" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gap: 20 }}>
      <div
        style={{
          background:
            'linear-gradient(135deg, rgba(30,41,59,0.98), rgba(37,99,235,0.96) 62%, rgba(34,211,238,0.88))',
          borderRadius: 24,
          padding: 24,
          boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
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
                border: '1px solid rgba(255,255,255,0.14)',
                background: 'rgba(255,255,255,0.08)',
                color: '#DCEBFF',
                fontSize: 12,
                fontWeight: 700,
                textTransform: 'uppercase',
              }}
            >
              <Brain size={14} />
              Nextern AI interview simulator
            </div>
            <h2
              style={{
                margin: '14px 0 0',
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
              }}
            >
              Practice interviews before the real one
            </h2>
            <p style={{ margin: '10px 0 0', color: '#D6E4FF', fontSize: 14, lineHeight: 1.7 }}>
              Nextern AI generates the question plan, powers the live interviewer, and prepares the
              final feedback. The page also tells you whenever backup logic is used instead.
            </p>
          </div>

          <div
            style={{
              background: 'rgba(255,255,255,0.08)',
              borderRadius: 16,
              border: '1px solid rgba(255,255,255,0.12)',
              padding: '14px 16px',
              minWidth: 240,
            }}
          >
            <div style={{ color: '#9FB4D0', fontSize: 12, fontWeight: 700 }}>Mock interviews</div>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: 28,
                fontWeight: 900,
                fontFamily: 'var(--font-display)',
                marginTop: 4,
              }}
            >
              {usageLoading
                ? '...'
                : usage?.isPremium
                  ? 'Unlimited'
                  : `${usage?.remaining.mockInterview ?? 0} left`}
            </div>
            <div style={{ color: '#D6E4FF', fontSize: 12, marginTop: 4 }}>
              {usage?.isPremium
                ? 'Premium practice is active'
                : `${usage?.counts.mockInterview ?? 0} used this month`}
            </div>
          </div>
        </div>

        {!usage?.isPremium ? (
          <div
            style={{
              marginTop: 16,
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              background: 'rgba(245,158,11,0.14)',
              border: '1px solid rgba(245,158,11,0.3)',
              borderRadius: 999,
              padding: '8px 14px',
              color: '#FDE68A',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Crown size={14} />
            Premium unlocks unlimited mock interviews.
            <Link href="/student/premium" style={{ color: '#FFFFFF', textDecoration: 'none' }}>
              Upgrade
            </Link>
          </div>
        ) : null}
      </div>

      <div
        style={{
          background: '#FFFFFF',
          borderRadius: 24,
          padding: 28,
          border: `1px solid ${C.border}`,
          boxShadow: '0 16px 34px rgba(15,23,42,0.06)',
          maxWidth: 760,
        }}
      >
        {error ? (
          <div
            style={{
              background: '#FEF2F2',
              border: '1px solid #FECACA',
              borderRadius: 12,
              padding: '12px 16px',
              marginBottom: 20,
              color: '#991B1B',
              fontSize: 14,
            }}
          >
            {error}
          </div>
        ) : null}

        <div style={{ marginBottom: 20 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              display: 'block',
              marginBottom: 8,
            }}
          >
            Target Role
          </label>
          <select
            value={targetRole}
            onChange={(event) => setTargetRole(event.target.value)}
            style={{
              width: '100%',
              padding: '10px 14px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 14,
              color: C.text,
              background: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              marginBottom: 10,
            }}
          >
            <option value="">Select a role...</option>
            {ROLES.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          <input
            value={customRole}
            onChange={(event) => setCustomRole(event.target.value)}
            placeholder="Or type a custom role (for example: Product Manager Intern)"
            style={{
              width: '100%',
              padding: '10px 14px',
              border: `1.5px solid ${C.border}`,
              borderRadius: 10,
              fontSize: 14,
              color: C.text,
              background: '#FFFFFF',
              fontFamily: 'var(--font-body)',
              outline: 'none',
              boxSizing: 'border-box',
            }}
          />
        </div>

        <div style={{ marginBottom: 28 }}>
          <label
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: C.text,
              display: 'block',
              marginBottom: 8,
            }}
          >
            Industry
          </label>
          <div
            style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}
            className="mock-setup-grid"
          >
            {INDUSTRIES.map((item) => (
              <button
                key={item}
                onClick={() => setIndustry(item)}
                style={{
                  padding: '10px 8px',
                  borderRadius: 10,
                  cursor: 'pointer',
                  fontSize: 12,
                  fontWeight: 600,
                  textAlign: 'center',
                  border: `2px solid ${industry === item ? C.blue : C.border}`,
                  background: industry === item ? '#EFF6FF' : '#FFFFFF',
                  color: industry === item ? C.blue : C.muted,
                  transition: 'all 0.15s',
                }}
              >
                {item}
              </button>
            ))}
          </div>
        </div>

        <button
          onClick={startInterview}
          disabled={stage === 'loading' || (!targetRole && !customRole.trim()) || !industry}
          style={{
            width: '100%',
            padding: '14px',
            background: stage === 'loading' ? '#93C5FD' : C.blue,
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 14,
            fontSize: 16,
            fontWeight: 800,
            fontFamily: 'var(--font-display)',
            cursor:
              stage === 'loading' || (!targetRole && !customRole.trim()) || !industry
                ? 'not-allowed'
                : 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: '0 6px 20px rgba(37,99,235,0.35)',
          }}
        >
          {stage === 'loading' ? (
            <>
              <LoaderCircle size={18} className="mock-spin" />
              Generating questions...
            </>
          ) : (
            <>
              <Mic size={18} />
              Start Interview
              <ChevronRight size={16} />
            </>
          )}
        </button>
      </div>

      <style>{`
        .mock-spin {
          animation: mock-spin 0.9s linear infinite;
        }

        @keyframes mock-spin {
          to {
            transform: rotate(360deg);
          }
        }

        @media (max-width: 900px) {
          .mock-setup-grid {
            grid-template-columns: repeat(2, 1fr) !important;
          }
        }
      `}</style>
    </div>
  );
}
