'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Mail } from 'lucide-react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import '@/app/public-v2.css';

const columns = [
  {
    title: 'Explore',
    links: [
      { label: 'Internships & jobs', href: '/student/jobs' },
      { label: 'Freelance marketplace', href: '/student/freelance' },
      { label: 'Mentorship', href: '/student/mentorship' },
    ],
  },
  {
    title: 'Get started',
    links: [
      { label: 'For students', href: '/register?role=student' },
      { label: 'For employers', href: '/register?role=employer' },
      { label: 'University sign in', href: '/login' },
    ],
  },
  {
    title: 'Support',
    links: [
      { label: 'Contact us', href: 'mailto:support@nextern.app' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of service', href: '/terms' },
    ],
  },
];
export default function GlobalFooter() {
  const pathname = usePathname();
  if (/^\/(student|employer|advisor|dept)\/messages\/?$/.test(pathname ?? '')) return null;

  return (
    <footer className="footer-v2">
      <div className="public-container">
        <div className="footer-v2-grid">
          <div className="footer-v2-brand">
            <Link href="/" aria-label="Nextern home">
              <NexternLogo textColor="#182c39" dotColor="#087f72" markSize={32} textSize={22} />
            </Link>
            <p>
              A place to connect your education,
              <br />
              your ambition, and your next opportunity.
            </p>
            <a className="footer-v2-email" href="mailto:support@nextern.app">
              <Mail size={15} /> support@nextern.app
            </a>
          </div>
          {columns.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2>{column.title}</h2>
              {column.links.map((link) => (
                <Link key={link.label} href={link.href}>
                  {link.label}
                </Link>
              ))}
            </nav>
          ))}
        </div>
        <div className="footer-v2-bottom">
          <p>© {new Date().getFullYear()} Nextern. All rights reserved.</p>
          <p>Built by Group 05 · CSE471 · BRAC University</p>
        </div>
      </div>
    </footer>
  );
}
