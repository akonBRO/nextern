'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

const NAV_ITEMS = [
  { label: 'Find opportunities', href: '/#opportunities' },
  { label: 'Build your career', href: '/#career-tools' },
  { label: 'For employers', href: '/#for-employers' },
];

export default function MobileNav() {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    if (!open) return;
    const originalOverflow = document.body.style.overflow;
    const trigger = triggerRef.current;
    document.body.style.overflow = 'hidden';
    panelRef.current?.querySelector<HTMLElement>('a')?.focus();
    function onKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
      if (event.key !== 'Tab') return;
      const links = panelRef.current?.querySelectorAll<HTMLElement>('a,button');
      if (!links?.length) return;
      const first = links[0];
      const last = links[links.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    }
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = originalOverflow;
      window.removeEventListener('keydown', onKey);
      trigger?.focus();
    };
  }, [open]);
  return (
    <div className="md:hidden">
      <button
        ref={triggerRef}
        type="button"
        className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#dfe6e9] bg-white text-[#182c39]"
        onClick={() => setOpen(true)}
        aria-label="Open navigation"
        aria-expanded={open}
        aria-controls="public-mobile-navigation"
      >
        <Menu size={22} />
      </button>
      {open && (
        <>
          <div
            className="fixed inset-0 z-40 bg-[#182c39]/40"
            onClick={() => setOpen(false)}
            aria-hidden="true"
          />
          <div
            ref={panelRef}
            id="public-mobile-navigation"
            role="dialog"
            aria-modal="true"
            aria-label="Navigation"
            className="fixed inset-x-3 top-3 z-50 rounded-xl border border-[#dfe6e9] bg-white p-4 shadow-xl"
          >
            <nav className="flex flex-col gap-1">
              {NAV_ITEMS.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-[#304855] hover:bg-[#eff7f4]"
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="mt-3 grid gap-2 border-t border-[#dfe6e9] pt-3">
              <Link
                href="/login"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-[#dfe6e9] px-4 py-3 text-center text-sm font-medium text-[#304855]"
              >
                Sign in
              </Link>
              <Link
                href="/register"
                onClick={() => setOpen(false)}
                className="rounded-lg bg-[#087f72] px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Create an account
              </Link>
            </div>
            <button
              type="button"
              className="mt-3 flex min-h-11 w-full items-center justify-center gap-2 rounded-lg text-sm text-[#60717d]"
              onClick={() => setOpen(false)}
            >
              <X size={16} />
              Close navigation
            </button>
          </div>
        </>
      )}
    </div>
  );
}
