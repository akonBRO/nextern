'use client';

import Link from 'next/link';
import { signOut } from 'next-auth/react';
import {
  BriefcaseBusiness,
  ChevronDown,
  ClipboardList,
  Home,
  LogOut,
  Mail,
  UserCircle2,
} from 'lucide-react';
import { useState } from 'react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import NotificationBell from '@/components/notifications/NotificationBell';

interface NavbarProps {
  user: {
    name: string;
    email: string;
    image?: string;
    userId: string;
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

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign('/');
  }

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
        {/* ── Logo ── */}
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
          <NexternLogo
            markSize={38}
            markRadius={12}
            textSize={18}
            textColor="#FFFFFF"
            subtitle="Student dashboard"
            subtitleColor="#94A3B8"
          />
        </Link>

        {/* ── Nav links + user menu ── */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {/* Nav links */}
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

          <Link
            href="/student/jobs"
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
            <BriefcaseBusiness size={15} strokeWidth={2} />
            Jobs
          </Link>

          <Link
            href="/student/applications"
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
            <ClipboardList size={15} strokeWidth={2} />
            Applications
          </Link>

          {/* Messages chip — static */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              padding: '9px 12px',
              borderRadius: 999,
              border: '1px solid rgba(255,255,255,0.08)',
              background: 'rgba(255,255,255,0.05)',
              color: '#D8E3F1',
              fontSize: 12,
              fontWeight: 700,
            }}
          >
            <span style={{ display: 'inline-flex', color: '#22D3EE' }}>
              <Mail size={14} strokeWidth={2} />
            </span>
            <span>Messages</span>
            <span style={{ color: '#FFFFFF' }}>{user.unreadMessages}</span>
          </div>

          {/* ── Real-time Notification Bell ── */}
          {user.userId ? (
            <NotificationBell
              userId={user.userId}
              initialUnread={user.unreadNotifications}
              notificationsHref="/student/notifications"
            />
          ) : (
            // Fallback static chip if userId not provided
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                padding: '9px 12px',
                borderRadius: 999,
                border: '1px solid rgba(255,255,255,0.08)',
                background: 'rgba(255,255,255,0.05)',
                color: '#D8E3F1',
                fontSize: 12,
                fontWeight: 700,
              }}
            >
              <span style={{ display: 'inline-flex', color: '#22D3EE' }}>🔔</span>
              <span>Alerts</span>
              <span style={{ color: '#FFFFFF' }}>{user.unreadNotifications}</span>
            </div>
          )}

          {/* User menu */}
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
              <ChevronDown
                size={14}
                strokeWidth={2}
                style={{
                  transform: menuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                }}
              />
            </button>

            {menuOpen && (
              <div
                style={{
                  position: 'absolute',
                  right: 0,
                  top: 'calc(100% + 8px)',
                  width: 240,
                  background: '#FFFFFF',
                  borderRadius: 18,
                  border: '1px solid #D9E2EC',
                  boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
                  padding: 10,
                }}
              >
                {/* User info */}
                <div
                  style={{
                    padding: '10px 12px 14px',
                    borderBottom: '1px solid #E2E8F0',
                    marginBottom: 8,
                  }}
                >
                  <div style={{ fontSize: 14, fontWeight: 800, color: '#1E293B' }}>{user.name}</div>
                  <div style={{ marginTop: 3, fontSize: 12, color: '#64748B' }}>{user.email}</div>
                  <div
                    style={{
                      marginTop: 6,
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                      fontSize: 12,
                      color: '#2563EB',
                      fontWeight: 700,
                    }}
                  >
                    <UserCircle2 size={13} />
                    {user.profileCompleteness}% profile complete
                  </div>
                </div>

                <div style={{ display: 'grid', gap: 6 }}>
                  {/* My Profile */}
                  <Link
                    href="/student/profile"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 12px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: '#1E293B',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <UserCircle2 size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                        My Profile
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        View and edit your profile
                      </div>
                    </div>
                  </Link>

                  {/* Browse Jobs */}
                  <Link
                    href="/student/jobs"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 12px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: '#1E293B',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <BriefcaseBusiness size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                        Browse Jobs
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        Find internships and roles
                      </div>
                    </div>
                  </Link>

                  {/* My Applications */}
                  <Link
                    href="/student/applications"
                    onClick={() => setMenuOpen(false)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      padding: '11px 12px',
                      borderRadius: 12,
                      textDecoration: 'none',
                      color: '#1E293B',
                      background: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                    }}
                    onMouseOver={(e) => (e.currentTarget.style.background = '#EFF6FF')}
                    onMouseOut={(e) => (e.currentTarget.style.background = '#F8FAFC')}
                  >
                    <div
                      style={{
                        width: 32,
                        height: 32,
                        borderRadius: 10,
                        background: '#EFF6FF',
                        color: '#2563EB',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      <ClipboardList size={15} strokeWidth={2} />
                    </div>
                    <div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                        My Applications
                      </div>
                      <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                        Track your pipeline
                      </div>
                    </div>
                  </Link>

                  {/* Sign out */}
                  <button
                    onClick={handleSignOut}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: '100%',
                      border: 'none',
                      borderRadius: 12,
                      background: '#EFF6FF',
                      color: '#2563EB',
                      padding: '12px',
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
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
