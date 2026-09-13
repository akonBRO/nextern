'use client';
import Link from 'next/link';
import { RefreshCw, TriangleAlert } from 'lucide-react';

export default function PageError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="workspace-error" role="alert">
      <div className="workspace-error-icon">
        <TriangleAlert size={28} strokeWidth={1.6} />
      </div>
      <p className="workspace-eyebrow">Let’s try that again</p>
      <h1>We couldn’t load this page.</h1>
      <p>Your next step is still here. Try refreshing the page, or return to your workspace.</p>
      <div>
        <button type="button" className="btn-primary" onClick={reset}>
          <RefreshCw size={17} /> Try again
        </button>
        <Link href="/" className="btn-outline">
          Go to workspace
        </Link>
      </div>
    </section>
  );
}
