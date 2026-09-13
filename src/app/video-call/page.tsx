'use client';

import BrandLoader from '@/components/ui/BrandLoader';
import { Suspense } from 'react';
import VideoCallClient from '@/components/mentorship/VideoCallClient';

export default function VideoCallPage() {
  return (
    <Suspense fallback={<BrandLoader variant="section" label="Loading video room" />}>
      <VideoCallClient />
    </Suspense>
  );
}
