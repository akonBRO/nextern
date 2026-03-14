'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  MessageSquare,
  ShieldCheck,
  Sparkles,
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
  | 'shield';

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

type DashboardShellProps = {
  roleLabel: string;
  homeHref: string;
  navItems: DashboardNavItem[];
  user: {
    name: string;
    email: string;
    image?: string;
    subtitle: string;
    unreadNotifications: number;
    unreadMessages: number;
  };
  children: ReactNode;
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
};

function NavIcon({ name, size = 16 }: { name: IconName; size?: number }) {
  const Icon = iconMap[name];
  return <Icon size={size} strokeWidth={1.9} />;
}

function CounterChip({ label, value, icon }: { label: string; value: number; icon: ReactNode }) {
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

export default function DashboardShell({
  roleLabel,
  homeHref,
  navItems,
  user,
  children,
}: DashboardShellProps) {
  const pathname = usePathname();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const shellRef = useRef<HTMLDivElement>(null);

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

  const initials = user.name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const isActiveHref = (href?: string) => {
    if (!href) return false;
    const normalized = href.split('#')[0];
    return normalized === pathname && !href.includes('#');
  };

  return (
    <div
      ref={shellRef}
      style={{
        minHeight: '100vh',
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
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 14,
                    background: 'linear-gradient(135deg, #2563EB, #22D3EE)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: '0 12px 24px rgba(34,211,238,0.2)',
                  }}
                >
                  <span
                    style={{
                      color: '#FFFFFF',
                      fontSize: 18,
                      fontWeight: 900,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    N
                  </span>
                </div>
                <div>
                  <div
                    style={{
                      color: '#FFFFFF',
                      fontSize: 20,
                      lineHeight: 1.1,
                      fontWeight: 800,
                      fontFamily: 'var(--font-display)',
                    }}
                  >
                    nextern<span style={{ color: '#22D3EE' }}>.</span>
                  </div>
                  <div style={{ color: '#9FB4D0', fontSize: 12 }}>{roleLabel}</div>
                </div>
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
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <CounterChip
                label="Messages"
                value={user.unreadMessages}
                icon={<Mail size={14} strokeWidth={2} />}
              />
              <CounterChip
                label="Alerts"
                value={user.unreadNotifications}
                icon={<Bell size={14} strokeWidth={2} />}
              />

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

                {userMenuOpen ? (
                  <div
                    style={{
                      position: 'absolute',
                      right: 0,
                      top: 'calc(100% + 10px)',
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
                      <div
                        style={{ marginTop: 8, fontSize: 12, color: '#2563EB', fontWeight: 700 }}
                      >
                        {roleLabel}
                      </div>
                    </div>
                    <button
                      onClick={() => signOut({ callbackUrl: '/' })}
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
                ) : null}
              </div>
            </div>
          </div>
        </div>

        <div style={{ background: '#1E293B', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <div
            style={{
              maxWidth: 1320,
              margin: '0 auto',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              overflowX: 'auto',
            }}
            className="dashboard-shell-nav"
          >
            {navItems.map((item) => {
              const active = isActiveHref(item.href) || openDropdown === item.label;
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
                      {item.icon ? <NavIcon name={item.icon} /> : null}
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
                      {item.icon ? <NavIcon name={item.icon} /> : null}
                      {item.label}
                    </Link>
                  )}

                  {item.items && openDropdown === item.label ? (
                    <div
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
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
                          key={entry.href}
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
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      </header>

      <main>{children}</main>

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
          <div>
            <div
              style={{
                color: '#FFFFFF',
                fontSize: 14,
                fontWeight: 700,
                fontFamily: 'var(--font-display)',
              }}
            >
              nextern<span style={{ color: '#22D3EE' }}>.</span>
            </div>
            <div style={{ color: '#94A3B8', fontSize: 12, marginTop: 4 }}>
              A focused workspace for decisions, progress, and outcomes.
            </div>
          </div>
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

      <style>{`
        .dashboard-shell-nav::-webkit-scrollbar {
          display: none;
        }

        @media (max-width: 960px) {
          .dashboard-hero-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
