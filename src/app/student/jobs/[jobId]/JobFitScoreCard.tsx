'use client';

import { useEffect, useState } from 'react';

type AnalysisEventDetail = {
  jobId: string;
  fitScore: number | null;
};

const EVENT_NAME = 'student-job-ai-analysis-updated';

export default function JobFitScoreCard({
  jobId,
  estimatedFitScore,
  aiFitScore,
}: {
  jobId: string;
  estimatedFitScore: number | null;
  aiFitScore: number | null;
}) {
  const [overrideScore, setOverrideScore] = useState<number | null>(null);
  const [hasLiveAiScore, setHasLiveAiScore] = useState(false);

  useEffect(() => {
    function handleUpdate(event: Event) {
      const customEvent = event as CustomEvent<AnalysisEventDetail>;
      if (customEvent.detail?.jobId !== jobId) {
        return;
      }

      setOverrideScore(customEvent.detail.fitScore);
      setHasLiveAiScore(customEvent.detail.fitScore !== null);
    }

    window.addEventListener(EVENT_NAME, handleUpdate as EventListener);
    return () => {
      window.removeEventListener(EVENT_NAME, handleUpdate as EventListener);
    };
  }, [jobId]);

  const score = overrideScore ?? aiFitScore ?? estimatedFitScore;
  const isAiScore = hasLiveAiScore || aiFitScore !== null;
  const color =
    score === null ? '#94A3B8' : score >= 70 ? '#10B981' : score >= 40 ? '#2563EB' : '#F59E0B';

  return (
    <div
      style={{
        background: 'rgba(255,255,255,0.08)',
        border: '1px solid rgba(255,255,255,0.1)',
        borderRadius: 16,
        padding: '14px 20px',
        textAlign: 'center',
        minWidth: 120,
      }}
    >
      <div
        style={{
          fontSize: 32,
          fontWeight: 900,
          color,
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
        }}
      >
        {score === null ? '--' : `${score}%`}
      </div>
      <div style={{ color: '#9FB4D0', fontSize: 12, marginTop: 4, fontWeight: 600 }}>
        {isAiScore ? 'AI fit score' : 'Estimated match'}
      </div>
    </div>
  );
}
