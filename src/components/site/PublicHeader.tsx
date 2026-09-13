'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import '@/app/public-v2.css';
import './public-header.css';

export default function PublicHeader() {
  const [open, setOpen] = useState(false);
  const headerRef = useRef<HTMLElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    function escape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }
    function outside(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener('keydown', escape);
    document.addEventListener('mousedown', outside);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('mousedown', outside);
    };
  }, [open]);
  return (
    <header className="public-header" ref={headerRef}>
      <div className="public-container public-nav">
        <Link href="/" aria-label="Nextern home">
          <NexternLogo
            textColor="var(--public-logo-color, #182c39)"
            dotColor="#88bd9e"
            markSize={34}
            textSize={23}
          />
        </Link>
        <nav className="public-desktop-links" aria-label="Main navigation">
          <Link href="/#available-opportunities">Find opportunities</Link>
          <Link href="/#career-tools">Build your career</Link>
          <Link href="/#for-employers">For employers</Link>
        </nav>
        <div className="public-nav-actions">
          <Link className="public-sign-in" href="/login">
            Sign in
          </Link>
          <Link className="public-button public-button-small" href="/register">
            Join Nextern <ArrowUpRight size={16} aria-hidden="true" />
          </Link>
        </div>
        <button
          ref={triggerRef}
          className="public-menu-toggle"
          type="button"
          aria-label={open ? 'Close navigation' : 'Open navigation'}
          aria-expanded={open}
          aria-controls="public-mobile-navigation"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>
      {open && (
        <nav
          className="public-mobile-links"
          id="public-mobile-navigation"
          aria-label="Mobile navigation"
          onClick={() => setOpen(false)}
        >
          <Link href="/#available-opportunities">Find opportunities</Link>
          <Link href="/#career-tools">Build your career</Link>
          <Link href="/#for-employers">For employers</Link>
          <Link href="/login">Sign in</Link>
          <Link href="/register">Create an account</Link>
        </nav>
      )}
    </header>
  );
}
