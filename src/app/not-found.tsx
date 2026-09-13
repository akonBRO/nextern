import Link from 'next/link';
import { ArrowRight, Compass } from 'lucide-react';

export default function NotFound() {
  return (
    <section className="workspace-error">
      <div className="workspace-error-icon">
        <Compass size={30} strokeWidth={1.5} />
      </div>
      <p className="workspace-eyebrow">Page not found · 404</p>
      <h1>A different path forward.</h1>
      <p>
        This page may have moved or the link may be incomplete. Head back to Nextern to find your
        next step.
      </p>
      <div>
        <Link href="/" className="btn-primary">
          Return to Nextern <ArrowRight size={17} />
        </Link>
      </div>
    </section>
  );
}
