'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import { Bell, ChevronDown, Home, LogOut, Mail, UserCircle2 } from 'lucide-react';
import { useState } from 'react';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    image?: string;
    opportunityScore: number;
    profileCompleteness: number;
    unreadNotifications: number;
    unreadMessages: number;
  };
}

export default function StudentNavbar({ user }: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <nav
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#1E293B',
        borderBottom: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: '0 auto',
          padding: '12px 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 16,
          flexWrap: 'wrap',
        }}
      >
        <Link
          href="/student/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 10,
            color: '#FFFFFF',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: 38,
              height: 38,
              borderRadius: 12,
              background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <span style={{ color: '#FFFFFF', fontWeight: 900, fontFamily: 'var(--font-display)' }}>
              N
            </span>
          </div>
          <div>
            <div style={{ fontSize: 18, fontWeight: 800, fontFamily: 'var(--font-display)' }}>
              nextern<span style={{ color: '#22D3EE' }}>.</span>
            </div>
            <div style={{ fontSize: 12, color: '#94A3B8' }}>Student dashboard</div>
          </div>
        </Link>

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          <Link
            href="/student/dashboard"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              color: '#CBD5E1',
              textDecoration: 'none',
              fontSize: 13,
              fontWeight: 700,
            }}
          >
            <Home size={15} strokeWidth={2} />
            Overview
          </Link>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.05)',
              color: '#D8E3F1',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Mail size={14} strokeWidth={2} color="#22D3EE" />
            {user.unreadMessages}
          </div>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '8px 12px',
              borderRadius: 999,
              background: 'rgba(255,255,255,0.05)',
              color: '#D8E3F1',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <Bell size={14} strokeWidth={2} color="#22D3EE" />
            {user.unreadNotifications}
          </div>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setMenuOpen((value) => !value)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 10,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: '#FFFFFF',
                borderRadius: 999,
                padding: '6px 10px 6px 6px',
                cursor: 'pointer',
              }}
            >
              {user.image ? (
                <img
                  src={user.image}
                  alt={user.name}
                  style={{ width: 34, height: 34, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: '50%',
                    background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 12,
                    fontWeight: 800,
                  }}
                >
                  {initials}
                </div>
              )}
              <div style={{ textAlign: 'left' }}>
                <div style={{ fontSize: 13, fontWeight: 700 }}>{user.name}</div>
                <div style={{ fontSize: 11, color: '#94A3B8' }}>{user.opportunityScore} score</div>
              </div>
              <ChevronDown size={14} strokeWidth={2} />
            </button>
            {menuOpen ? (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 220,
                  background: '#FFFFFF',
                  borderRadius: 18,
                  border: '1px solid #D9E2EC',
                  boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
                  padding: 10,
                }}
              >
                <div
                  style={{
                    padding: '10px 12px',
                    borderBottom: '1px solid #E2E8F0',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{user.name}</div>
                  <div style={{ marginTop: 4, fontSize: 12, color: '#64748B' }}>{user.email}</div>
                </div>
                <div style={{ display: 'grid', gap: 8 }}>
                  <div
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      fontSize: 13,
                      color: '#1E293B',
                      fontWeight: 700,
                    }}
                  >
                    <UserCircle2 size={15} strokeWidth={2} />
                    {user.profileCompleteness}% complete
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      border: 'none',
                      borderRadius: 12,
                      background: '#EFF6FF',
                      color: '#2563EB',
                      padding: '12px 12px',
                      fontSize: 14,
                      fontWeight: 700,
                      cursor: 'pointer',
                    }}
                  >
                    <LogOut size={15} strokeWidth={2} />
                    Sign out
                  </button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </nav>
  );
}
