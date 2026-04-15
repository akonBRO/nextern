import Link from 'next/link';
import { Linkedin, Mail, Twitter } from 'lucide-react';
import { NexternLogo } from '@/components/brand/NexternLogo';

const CURRENT_YEAR = new Date().getFullYear();

const FOOTER_COLUMNS = [
  {
    title: 'Platform',
    links: [
      { label: 'For Students', href: '/#for-students' },
      { label: 'For Employers', href: '/#for-employers' },
      { label: 'For Universities', href: '/#universities' },
      { label: 'Pricing', href: '/student/premium' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Blog', href: '/' },
      { label: 'Career Guide', href: '/register' },
      { label: 'Help Center', href: 'mailto:support@nextern.app', external: true },
      {
        label: 'API Docs',
        href: 'mailto:support@nextern.app?subject=Nextern%20API%20Docs',
        external: true,
      },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/' },
      { label: 'Contact', href: 'mailto:support@nextern.app', external: true },
      {
        label: 'Privacy Policy',
        href: 'mailto:support@nextern.app?subject=Privacy%20Policy%20Request',
        external: true,
      },
      {
        label: 'Terms of Service',
        href: 'mailto:support@nextern.app?subject=Terms%20of%20Service%20Request',
        external: true,
      },
    ],
  },
] as const;

const SOCIAL_LINKS = [
  { label: 'X', href: 'https://x.com', icon: Twitter },
  { label: 'LinkedIn', href: 'https://www.linkedin.com', icon: Linkedin },
  { label: 'Email', href: 'mailto:support@nextern.app', icon: Mail },
] as const;

type FooterLink = {
  label: string;
  href: string;
  external?: boolean;
};

function FooterLinkItem({ label, href, external }: FooterLink) {
  const baseStyle = {
    color: '#475569',
    fontSize: 14,
    textDecoration: 'none',
  } as const;

  if (external) {
    return (
      <a
        href={href}
        className="landing-footer-link"
        style={baseStyle}
        target={href.startsWith('http') ? '_blank' : undefined}
        rel={href.startsWith('http') ? 'noreferrer' : undefined}
      >
        {label}
      </a>
    );
  }

  return (
    <Link href={href} className="landing-footer-link" style={baseStyle}>
      {label}
    </Link>
  );
}

export default function GlobalFooter() {
  return (
    <footer style={{ background: '#0F172A', padding: '64px 0 0' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
        <div
          className="site-footer-grid"
          style={{
            display: 'grid',
            gridTemplateColumns: '2fr 1fr 1fr 1fr',
            gap: 40,
            marginBottom: 56,
          }}
        >
          <div>
            <NexternLogo
              markSize={32}
              markRadius={9}
              textSize={20}
              textColor="#FFFFFF"
              style={{ marginBottom: 16 }}
            />
            <p
              style={{
                color: '#475569',
                fontSize: 14,
                lineHeight: 1.8,
                maxWidth: 300,
                marginBottom: 24,
              }}
            >
              Campus career readiness platform for Bangladesh university students and employers.
              AI-powered, mentor-backed, university-verified.
            </p>

            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
              {SOCIAL_LINKS.map(({ label, href, icon: Icon }) => (
                <a
                  key={label}
                  href={href}
                  aria-label={label}
                  className="site-footer-social"
                  target={href.startsWith('http') ? '_blank' : undefined}
                  rel={href.startsWith('http') ? 'noreferrer' : undefined}
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: 9,
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#64748B',
                    transition: 'color 0.15s, background 0.15s, border-color 0.15s',
                  }}
                >
                  <Icon size={16} strokeWidth={1.8} />
                </a>
              ))}
            </div>
          </div>

          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <div
                style={{
                  color: '#E2E8F0',
                  fontSize: 13,
                  fontWeight: 700,
                  letterSpacing: 0.5,
                  marginBottom: 18,
                }}
              >
                {column.title}
              </div>

              {column.links.map((link) => (
                <div key={`${column.title}:${link.label}`} style={{ marginBottom: 12 }}>
                  <FooterLinkItem {...link} />
                </div>
              ))}
            </div>
          ))}
        </div>

        <div
          className="site-footer-bottom"
          style={{
            borderTop: '1px solid rgba(255,255,255,0.06)',
            padding: '24px 0 32px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 8,
          }}
        >
          <p style={{ color: '#334155', fontSize: 13 }}>
            &copy; {CURRENT_YEAR} Nextern. Built by Group 05, CSE471, BRAC University.
          </p>
          <p style={{ color: '#334155', fontSize: 13 }}>Made with care for Bangladesh students</p>
        </div>
      </div>
    </footer>
  );
}
