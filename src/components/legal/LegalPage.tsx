import Link from 'next/link';
import { NexternLogo } from '@/components/brand/NexternLogo';
import '@/app/public-v2.css';

export type LegalSection = { heading: string; paragraphs: string[] };
export function LegalPage({
  title,
  introduction,
  sections,
}: {
  title: string;
  introduction: string;
  sections: LegalSection[];
}) {
  return (
    <main className="legal-v2">
      <nav className="auth-v2-header" aria-label="Legal page navigation">
        <Link href="/" aria-label="Nextern home">
          <NexternLogo textColor="#182c39" dotColor="#087f72" markSize={34} textSize={23} />
        </Link>
        <Link className="public-button public-button-small public-button-outline" href="/login">
          Sign in
        </Link>
      </nav>
      <div className="legal-v2-layout">
        <aside className="legal-v2-contents">
          <p>On this page</p>
          <nav aria-label="Document contents">
            {sections.map((section, i) => (
              <a key={section.heading} href={'#section-' + (i + 1)}>
                {section.heading}
              </a>
            ))}
          </nav>
          <Link href={title.includes('Privacy') ? '/terms' : '/privacy'}>
            {title.includes('Privacy') ? 'Terms of Service' : 'Privacy Policy'} →
          </Link>
        </aside>
        <article>
          <p className="public-eyebrow">Effective 6 August 2026</p>
          <h1>{title}</h1>
          <p>{introduction}</p>
          {sections.map((section, i) => (
            <section key={section.heading} id={'section-' + (i + 1)}>
              <h2>{section.heading}</h2>
              {section.paragraphs.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}
          <p>
            Questions may be sent to <a href="mailto:support@nextern.app">support@nextern.app</a>.
          </p>
        </article>
      </div>
    </main>
  );
}
