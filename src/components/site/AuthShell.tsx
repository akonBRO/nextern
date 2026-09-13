import Link from 'next/link';
import type { ReactNode } from 'react';
import { ArrowLeft, BriefcaseBusiness, FileText, Users } from 'lucide-react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import '@/app/public-v2.css';

export default function AuthShell({
  children,
  compact = false,
}: {
  children: ReactNode;
  compact?: boolean;
}) {
  return (
    <main className={compact ? 'auth-v2 auth-v2-compact' : 'auth-v2'}>
      <header className="auth-v2-header">
        <Link href="/" aria-label="Nextern home">
          <NexternLogo markSize={34} textSize={23} textColor="#182c39" dotColor="#087f72" />
        </Link>
        <Link href="/" className="auth-v2-home">
          <ArrowLeft size={15} /> Back to home
        </Link>
      </header>
      <div className="auth-v2-layout">
        {!compact && (
          <aside className="auth-v2-aside">
            <p className="public-eyebrow">From campus to career</p>
            <h2>
              Make room for
              <br />
              your next chapter.
            </h2>
            <p>
              Find work that moves you forward, build your skills, and connect with people who can
              help.
            </p>
            <div className="auth-v2-benefits">
              <div>
                <BriefcaseBusiness size={21} />
                <span>
                  <strong>Opportunities with direction</strong>
                  <small>Explore internships, jobs, and freelance work.</small>
                </span>
              </div>
              <div>
                <FileText size={21} />
                <span>
                  <strong>Put your best work forward</strong>
                  <small>Prepare your resume and practice for interviews.</small>
                </span>
              </div>
              <div>
                <Users size={21} />
                <span>
                  <strong>Support along the way</strong>
                  <small>Connect with mentors and your university.</small>
                </span>
              </div>
            </div>
            <p className="auth-v2-aside-note">
              A shared space for students, employers, and universities in Bangladesh.
            </p>
          </aside>
        )}
        <section className="auth-v2-form">{children}</section>
      </div>
    </main>
  );
}
