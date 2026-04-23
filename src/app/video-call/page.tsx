'use client';

import { Suspense } from 'react';
import VideoCallClient from '@/components/mentorship/VideoCallClient';

export default function VideoCallPage() {
  return (
    <Suspense
      fallback={<div style={{ padding: 40, textAlign: 'center' }}>Loading video room...</div>}
    >
      <VideoCallClient />
    </Suspense>
  );
}
