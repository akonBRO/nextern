'use client';

import { useState } from 'react';
import Link from 'next/link';

const NAV_ITEMS = ['Features', 'For Students', 'For Employers', 'Universities'];

export default function MobileNav() {
  const [open, setOpen] = useState(false);

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative z-50 flex h-10 w-10 flex-col items-center justify-center gap-1.5"
        aria-label="Toggle menu"
      >
        <span
          className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${open ? 'translate-y-2 rotate-45' : ''}`}
        />
        <span
          className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${open ? 'opacity-0' : ''}`}
        />
        <span
          className={`block h-0.5 w-5 rounded-full bg-white transition-all duration-300 ${open ? '-translate-y-2 -rotate-45' : ''}`}
        />
      </button>

      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Slide-down panel */}
      <div
        className={`fixed inset-x-0 top-0 z-40 transform bg-[#1E293B] px-6 pt-20 pb-8 shadow-2xl transition-all duration-300 ${
          open ? 'translate-y-0 opacity-100' : 'pointer-events-none -translate-y-full opacity-0'
        }`}
      >
        <nav className="flex flex-col gap-1">
          {NAV_ITEMS.map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(/ /g, '-')}`}
              onClick={() => setOpen(false)}
              className="rounded-lg px-4 py-3 text-[15px] font-medium text-slate-300 transition-colors hover:bg-white/5 hover:text-white"
            >
              {item}
            </a>
          ))}
        </nav>

        <div className="mt-6 flex flex-col gap-3 border-t border-white/10 pt-6">
          <Link
            href="/login"
            onClick={() => setOpen(false)}
            className="rounded-lg px-4 py-3 text-center text-[15px] font-medium text-slate-200 transition-colors hover:bg-white/5"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            onClick={() => setOpen(false)}
            className="font-display rounded-xl bg-[#2563EB] px-4 py-3 text-center text-[15px] font-semibold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700"
          >
            Get started →
          </Link>
        </div>
      </div>
    </div>
  );
}
