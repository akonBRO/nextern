'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import NotificationBell from '@/components/notifications/NotificationBell';
import MessageBell from '@/components/messaging/MessageBell';
import {
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  Crown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
} from 'lucide-react';

type IconName =
  | 'dashboard'
  | 'briefcase'
  | 'users'
  | 'building'
  | 'graduation'
  | 'calendar'
  | 'file'
  | 'insights'
  | 'target'
  | 'sparkles'
  | 'messages'
  | 'book'
  | 'shield'
  | 'star';

export type DashboardNavItem = {
  label: string;
  href?: string;
  icon?: IconName;
  items?: {
    label: string;
    href: string;
    description: string;
    icon: IconName;
  }[];
};

type DashboardRole = 'student' | 'employer' | 'advisor' | 'departmentHead';

const profileConfig: Record<
  DashboardRole,
  { label: string; href: string; icon: 'users' | 'building' }
> = {
  student: { label: 'My Profile', href: '/student/profile', icon: 'users' },
  employer: { label: 'Company Profile', href: '/employer/profile', icon: 'building' },
  advisor: { label: 'My Profile', href: '/advisor/profile', icon: 'users' },
  departmentHead: { label: 'My Profile', href: '/dept/profile', icon: 'users' },
};

type DashboardShellProps = {
  role: DashboardRole;
  roleLabel: string;
  homeHref: string;
  navItems: DashboardNavItem[];
  user: {
    name: string;
    email: string;
    image?: string;
    subtitle: string;
    isPremium?: boolean;
    unreadNotifications: number; // initial count from server (SSR)
    unreadMessages: number;
    userId?: string; // needed by NotificationBell for Pusher channel
  };
  children: ReactNode;
  hideFooter?: boolean;
};

const iconMap = {
  dashboard: LayoutDashboard,
  briefcase: BriefcaseBusiness,
  users: Users,
  building: Building2,
  graduation: GraduationCap,
  calendar: CalendarDays,
  file: FileText,
  insights: LineChart,
  target: Target,
  sparkles: Sparkles,
  messages: MessageSquare,
  book: BookOpen,
  shield: ShieldCheck,
  star: Star,
};

function NavIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  const Icon = iconMap[name];
  return <Icon size={size} strokeWidth={1.9} />;
}

// ── Static chip — used for Messages (non-real-time for now) ───────────────
function StaticChip({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
  return (
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
      <span style={{ display: 'inline-flex', color: '#22D3EE' }}>{icon}</span>
      <span>{label}</span>
      <span style={{ color: '#FFFFFF' }}>{value}</span>
    </div>
  );
}

const PREMIUM_STATUS_EVENT = 'nextern-premium-status-updated';

export default function DashboardShell({
  role,
  roleLabel,
  homeHref,
  navItems,
  user,
  children,
  hideFooter = false,
}: DashboardShellProps) {
  const profile = profileConfig[role];
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [premiumActive, setPremiumActive] = useState(Boolean(user.isPremium));
  const shellRef = useRef<HTMLDivElement>(null);
  const resolvedNavItems =
    role === 'student' ? STUDENT_NAV_ITEMS : role === 'employer' ? EMPLOYER_NAV_ITEMS : navItems;

  // Derive notifications page href based on role
  const notificationsHref =
    role === 'student'
      ? '/student/notifications'
      : role === 'employer'
        ? '/employer/notifications'
        : role === 'advisor'
          ? '/advisor/notifications'
          : '/dept/notifications';

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (shellRef.current && !shellRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, []);

  useEffect(() => {
    if (role !== 'student' && role !== 'employer') return;
    let cancelled = false;

    async function loadPremiumStatus() {
      try {
        const res = await fetch('/api/premium/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = (await res.json()) as { isPremium?: boolean };
        if (!cancelled && typeof data.isPremium === 'boolean') {
          setPremiumActive(data.isPremium);
        }
      } catch {
        /* keep shell stable */
      }
    }

    loadPremiumStatus();

    function handlePremiumUpdate(event: Event) {
      const customEvent = event as CustomEvent<{ isPremium?: boolean }>;
      if (typeof customEvent.detail?.isPremium === 'boolean') {
        setPremiumActive(customEvent.detail.isPremium);
      }
    }

    window.addEventListener(PREMIUM_STATUS_EVENT, handlePremiumUpdate as EventListener);
    return () => {
      cancelled = true;
      window.removeEventListener(PREMIUM_STATUS_EVENT, handlePremiumUpdate as EventListener);
    };
  }, [role]);

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActiveHref = (href?: string) => {
    if (!href) return false;
    const normalized = href.split('#')[0].split('?')[0];
    return normalized === pathname && !href.includes('#');
  };

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign('/');
  }

  return (
    <div
      ref={shellRef}
      style={{
        height: hideFooter ? '100vh' : undefined,
        minHeight: hideFooter ? undefined : '100vh',
        overflow: hideFooter ? 'hidden' : undefined,
        display: hideFooter ? 'flex' : undefined,
        flexDirection: hideFooter ? 'column' : undefined,
        background: '#F1F5F9',
        color: '#1E293B',
        fontFamily: 'var(--font-body)',
      }}
    >
      <header
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 60,
          boxShadow: '0 18px 32px rgba(15,23,42,0.08)',
        }}
      >
        <div
          style={{
            background:
              'linear-gradient(135deg, rgba(30,41,59,1), rgba(30,41,59,0.98) 55%, rgba(37,99,235,0.96))',
            borderBottom: '1px solid rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '14px 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 18,
              flexWrap: 'wrap',
            }}
          >
            {/* Left: logo + badges */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
              <Link
                href={homeHref}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 11,
                  textDecoration: 'none',
                }}
              >
                <NexternLogo
                  markSize={40}
                  markRadius={14}
                  markShadow="0 12px 24px rgba(34,211,238,0.2)"
                  textSize={20}
                  textColor="#FFFFFF"
                  subtitle={roleLabel}
                  subtitleColor="#9FB4D0"
                />
              </Link>

              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '8px 12px',
                  borderRadius: 999,
                  background: 'rgba(37,99,235,0.14)',
                  border: '1px solid rgba(34,211,238,0.24)',
                  color: '#E2E8F0',
                  maxWidth: 360,
                }}
              >
                <ShieldCheck size={14} color="#22D3EE" />
                <span
                  style={{
                    fontSize: 12,
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {user.subtitle}
                </span>
              </div>

              {premiumActive && (
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '8px 12px',
                    borderRadius: 999,
                    background: 'rgba(245,158,11,0.14)',
                    border: '1px solid rgba(245,158,11,0.3)',
                    color: '#FDE68A',
                  }}
                >
                  <Crown size={14} />
                  <span style={{ fontSize: 12, fontWeight: 800 }}>Premium active</span>
                </div>
              )}
            </div>

            {/* Right: chips + bell + user menu */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              {user.userId ? (
                <MessageBell
                  userId={user.userId}
                  initialUnread={user.unreadMessages}
                  href={`/${role === 'employer' ? 'employer' : role === 'student' ? 'student' : role === 'advisor' ? 'advisor' : 'dept'}/messages`}
                />
              ) : (
                <StaticChip
                  label="Messages"
                  value={user.unreadMessages}
                  icon={<Mail size={14} strokeWidth={2} />}
                />
              )}

              {/* ── Real-time Notification Bell ── */}
              {user.userId ? (
                <NotificationBell
                  userId={user.userId}
                  initialUnread={user.unreadNotifications}
                  notificationsHref={notificationsHref}
                />
              ) : (
                // Fallback static chip if userId not provided
                <StaticChip
                  label="Notifications"
                  value={user.unreadNotifications}
                  icon={<span style={{ fontSize: 14 }}>🔔</span>}
                />
              )}

              {/* User menu */}
              <div style={{ position: 'relative' }}>
                <button
                  onClick={() => setUserMenuOpen((current) => !current)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '6px 10px 6px 6px',
                    borderRadius: 999,
                    border: '1px solid rgba(255,255,255,0.08)',
                    background: userMenuOpen ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)',
                    color: '#E2E8F0',
                    cursor: 'pointer',
                  }}
                >
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name}
                      style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
                    />
                  ) : (
                    <div
                      style={{
                        width: 36,
                        height: 36,
                        borderRadius: '50%',
                        background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: '#FFFFFF',
                        fontSize: 12,
                        fontWeight: 800,
                      }}
                    >
                      {initials}
                    </div>
                  )}
                  <div style={{ textAlign: 'left', minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: 13,
                        fontWeight: 700,
                        lineHeight: 1.2,
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.name}
                    </div>
                    <div
                      style={{
                        fontSize: 11,
                        color: '#9FB4D0',
                        maxWidth: 180,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {user.email}
                    </div>
                    {premiumActive && (
                      <div
                        style={{ color: '#FDE68A', fontSize: 11, fontWeight: 700, marginTop: 2 }}
                      >
                        Premium active
                      </div>
                    )}
                  </div>
                  <ChevronDown
                    size={14}
                    color="#9FB4D0"
                    style={{
                      transform: userMenuOpen ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 0.2s ease',
                    }}
                  />
                </button>

                {userMenuOpen && (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
                      zIndex: 120,
                      width: 248,
                      background: '#FFFFFF',
                      border: '1px solid #D9E2EC',
                      borderRadius: 20,
                      boxShadow: '0 18px 40px rgba(15,23,42,0.12)',
                      padding: 10,
                    }}
                  >
                    <div
                      style={{
                        padding: '10px 12px 14px',
                        borderBottom: '1px solid #E2E8F0',
                        marginBottom: 8,
                      }}
                    >
                      <div style={{ fontSize: 14, fontWeight: 700, color: '#1E293B' }}>
                        {user.name}
                      </div>
                      <div style={{ fontSize: 12, color: '#64748B', marginTop: 2 }}>
                        {user.email}
                      </div>
                      {premiumActive && (
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 6,
                            marginTop: 10,
                            padding: '4px 10px',
                            borderRadius: 999,
                            background: '#FEF3C7',
                            color: '#92400E',
                            fontSize: 11,
                            fontWeight: 800,
                          }}
                        >
                          <Crown size={12} /> Premium active
                        </div>
                      )}
                    </div>

                    <Link
                      href={profile.href}
                      onClick={() => setUserMenuOpen(false)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '11px 12px',
                        borderRadius: 12,
                        textDecoration: 'none',
                        color: '#1E293B',
                        marginBottom: 6,
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.background = '#F1F5F9';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.background = 'transparent';
                      }}
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
                        {profile.icon === 'building' ? (
                          <Building2 size={15} strokeWidth={2} />
                        ) : (
                          <Users size={15} strokeWidth={2} />
                        )}
                      </div>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 700, color: '#1E293B' }}>
                          {profile.label}
                        </div>
                        <div style={{ fontSize: 11, color: '#64748B', marginTop: 1 }}>
                          View and edit your profile
                        </div>
                      </div>
                    </Link>

                    <button
                      onClick={handleSignOut}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        padding: '12px 12px',
                        borderRadius: 12,
                        border: 'none',
                        background: '#EFF6FF',
                        color: '#2563EB',
                        fontSize: 14,
                        fontWeight: 700,
                        cursor: 'pointer',
                      }}
                    >
                      <LogOut size={15} strokeWidth={2} />
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ── Nav bar ── */}
        <div style={{ background: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              flexWrap: 'wrap',
            }}
            className="dashboard-shell-nav"
          >
            {resolvedNavItems.map((item) => {
              const hasActiveChild = item.items?.some((entry) => isActiveHref(entry.href)) ?? false;
              const active =
                isActiveHref(item.href) || hasActiveChild || openDropdown === item.label;
              return (
                <div key={item.label} style={{ position: 'relative' }}>
                  {item.items ? (
                    <button
                      onClick={() =>
                        setOpenDropdown((current) => (current === item.label ? null : item.label))
                      }
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '15px 12px',
                        border: 'none',
                        background: 'transparent',
                        color: active ? '#FFFFFF' : '#CBD5E1',
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        cursor: 'pointer',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.icon && <NavIcon name={item.icon} />}
                      {item.label}
                      <ChevronDown
                        size={14}
                        style={{
                          transform:
                            openDropdown === item.label ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease',
                        }}
                      />
                    </button>
                  ) : (
                    <Link
                      href={item.href ?? homeHref}
                      onClick={() => setOpenDropdown(null)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 8,
                        padding: '15px 12px',
                        textDecoration: 'none',
                        color: active ? '#FFFFFF' : '#CBD5E1',
                        fontSize: 14,
                        fontWeight: active ? 700 : 500,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {item.icon && <NavIcon name={item.icon} />}
                      {item.label}
                    </Link>
                  )}

                  {item.items && openDropdown === item.label && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 110,
                        minWidth: 292,
                        background: '#FFFFFF',
                        borderRadius: 18,
                        border: '1px solid #D9E2EC',
                        boxShadow: '0 18px 42px rgba(15,23,42,0.12)',
                        padding: 10,
                      }}
                    >
                      {item.items.map((entry) => (
                        <Link
                          key={`${item.label}:${entry.label}:${entry.href}`}
                          href={entry.href}
                          onClick={() => setOpenDropdown(null)}
                          style={{
                            display: 'flex',
                            alignItems: 'flex-start',
                            gap: 12,
                            padding: '11px 12px',
                            borderRadius: 12,
                            textDecoration: 'none',
                            color: '#1E293B',
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: 10,
                              background: '#EFF6FF',
                              color: '#2563EB',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              flexShrink: 0,
                            }}
                          >
                            <NavIcon name={entry.icon} size={16} />
                          </div>
                          <div>
                            <div
                              style={{
                                fontSize: 14,
                                fontWeight: 700,
                                color: '#1E293B',
                                marginBottom: 3,
                              }}
                            >
                              {entry.label}
                            </div>
                            <div style={{ fontSize: 12, color: '#64748B', lineHeight: 1.55 }}>
                              {entry.description}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main style={hideFooter ? { flex: 1, overflow: 'hidden' } : undefined}>{children}</main>

      {!hideFooter && (
        <footer
          style={{
            background: '#1E293B',
            borderTop: '1px solid rgba(255,255,255,0.06)',
            marginTop: 48,
          }}
        >
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '20px 24px 26px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
            }}
          >
            <NexternLogo
              markSize={28}
              markRadius={7}
              textSize={14}
              textWeight={700}
              textColor="#FFFFFF"
              subtitle="A focused workspace for decisions, progress, and outcomes."
              subtitleColor="#94A3B8"
              subtitleGap={4}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: 18, flexWrap: 'wrap' }}>
              <Link
                href={homeHref}
                style={{ color: '#CBD5E1', fontSize: 13, textDecoration: 'none' }}
              >
                Overview
              </Link>
              <a
                href="mailto:support@nextern.app"
                style={{ color: '#CBD5E1', fontSize: 13, textDecoration: 'none' }}
              >
                Support
              </a>
              <Link href="/" style={{ color: '#CBD5E1', fontSize: 13, textDecoration: 'none' }}>
                Home
              </Link>
            </div>
          </div>
        </footer>
      )}

      <style>{`
        .dashboard-shell-nav::-webkit-scrollbar { display: none; }
        @media (max-width: 960px) {
          .dashboard-hero-grid { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
