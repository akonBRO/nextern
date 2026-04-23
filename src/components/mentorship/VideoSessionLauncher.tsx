'use client';

import { useState } from 'react';
import { Video, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface Props {
  sessionId: string;
}

export default function VideoSessionLauncher({ sessionId }: Props) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function launchVideo() {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/mentor-sessions/${sessionId}/agora-token`, {
        method: 'POST',
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to get video token.');
      }

      // Encode the data to pass to the shared Agora UI wrapper
      const params = new URLSearchParams({
        appId: data.appId,
        channel: data.channelName,
        token: data.token,
        uid: data.uid.toString(),
        returnUrl: window.location.pathname,
      });

      router.push(`/video-call?${params.toString()}`);
    } catch (err: unknown) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError(String(err));
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      {error && (
        <div
          style={{
            background: '#FEF2F2',
            border: '1px solid #FECACA',
            padding: '8px 12px',
            borderRadius: 8,
            color: '#DC2626',
            fontSize: 13,
            marginBottom: 12,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}
        >
          <AlertCircle size={16} />
          {error}
        </div>
      )}
      <button
        onClick={launchVideo}
        disabled={loading}
        style={{
          width: '100%',
          padding: '12px',
          borderRadius: 12,
          background: 'linear-gradient(135deg, #2563EB, #1D4ED8)',
          color: '#FFFFFF',
          fontWeight: 700,
          fontSize: 14,
          border: 'none',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          boxShadow: '0 4px 12px rgba(37,99,235,0.2)',
          opacity: loading ? 0.7 : 1,
        }}
      >
        {loading ? <Loader2 size={18} className="animate-spin" /> : <Video size={18} />}
        {loading ? 'Connecting...' : 'Join Video Session'}
      </button>
    </div>
  );
}
