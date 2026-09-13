'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useSearchParams } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { NexternLogo } from '@/components/brand/NexternLogo';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import NotificationBell from '@/components/notifications/NotificationBell';
import MessageBell from '@/components/messaging/MessageBell';
import { readJsonSafely } from '@/lib/safe-json';
import {
  Bell,
  BookOpen,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Crown,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LineChart,
  LogOut,
  Mail,
  Menu,
  MessageSquare,
  ShieldCheck,
  Sparkles,
  Star,
  Target,
  Users,
  X,
} from 'lucide-react';
import styles from './DashboardShell.module.css';

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
  items?: { label: string; href: string; description: string; icon: IconName }[];
};

type DashboardRole = 'student' | 'employer' | 'advisor' | 'departmentHead' | 'alumni';
const profileConfig: Record<DashboardRole, { label: string; href: string; icon: IconName }> = {
  student: { label: 'My profile', href: '/student/profile', icon: 'users' },
  employer: { label: 'Company profile', href: '/employer/profile', icon: 'building' },
  advisor: { label: 'My profile', href: '/advisor/profile', icon: 'users' },
  departmentHead: { label: 'My profile', href: '/dept/profile', icon: 'users' },
  alumni: { label: 'My profile', href: '/student/mentorship/dashboard?tab=profile', icon: 'users' },
};

type DashboardShellProps = {
  /** Role layouts own the navigation; embedded pages render only their content. */
  embedded?: boolean;
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
    unreadNotifications: number;
    unreadMessages: number;
    userId?: string;
  };
  children: ReactNode;
  hideFooter?: boolean;
  navigationOnly?: boolean;
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
function NavIcon({ name }: { name: IconName }) {
  const Icon = iconMap[name];
  return <Icon size={17} strokeWidth={1.8} aria-hidden="true" />;
}
function isPathMatch(pathname: string | null, href: string | undefined, search: string) {
  if (!pathname || !href || href.includes('#')) return false;
  const [path, query] = href.split('?');
  if (pathname !== path && !pathname.startsWith(`${path}/`)) return false;
  const current = new URLSearchParams(search);
  if (query)
    return Array.from(new URLSearchParams(query)).every(
      ([key, value]) => (current.get(key) ?? (key === 'view' ? 'board' : '')) === value
    );
  if (path.endsWith('/mentorship/dashboard') && current.has('tab')) return false;
  return true;
}

const PREMIUM_STATUS_EVENT = 'nextern-premium-status-updated';

export default function DashboardShell(props: DashboardShellProps) {
  if (props.embedded) return <>{props.children}</>;
  return <WorkspaceChrome {...props} />;
}
function WorkspaceChrome({
  role,
  roleLabel,
  homeHref,
  navItems,
  user,
  children,
  hideFooter = false,
  navigationOnly = false,
}: DashboardShellProps) {
  const pathname = usePathname();
  const search = useSearchParams().toString();
  const headerRef = useRef<HTMLElement>(null);
  const drawerRef = useRef<HTMLElement>(null);
  const mobileTriggerRef = useRef<HTMLButtonElement>(null);
  const [desktopDropdown, setDesktopDropdown] = useState<string | null>(null);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cancelHover = () => {
    if (hoverTimer.current) clearTimeout(hoverTimer.current);
    hoverTimer.current = null;
  };
  const canHover = () =>
    window.matchMedia('(min-width: 1201px) and (hover: hover) and (pointer: fine)').matches;
  const openOnHover = (label: string, pointerType: string) => {
    if (pointerType !== 'mouse' || !canHover()) return;
    cancelHover();
    hoverTimer.current = setTimeout(() => {
      setDesktopDropdown(label === 'account' ? null : label);
      setUserMenuOpen(label === 'account');
    }, 110);
  };
  const closeAfterHover = (pointerType: string) => {
    if (pointerType !== 'mouse' || !canHover()) return;
    cancelHover();
    hoverTimer.current = setTimeout(() => {
      setDesktopDropdown(null);
      setUserMenuOpen(false);
    }, 220);
  };
  const resolvedNavItems =
    role === 'student' ? STUDENT_NAV_ITEMS : role === 'employer' ? EMPLOYER_NAV_ITEMS : navItems;
  const [mobileExpandedGroup, setMobileExpandedGroup] = useState<string | null>(
    () =>
      resolvedNavItems.find((item) =>
        item.items?.some((entry) => isPathMatch(pathname, entry.href, search))
      )?.label ?? null
  );
  const [premiumActive, setPremiumActive] = useState(Boolean(user.isPremium));
  const rolePath = role === 'alumni' ? 'student' : role === 'departmentHead' ? 'dept' : role;
  const notificationsHref = `/${rolePath}/notifications`;
  const messagesHref = `/${rolePath}/messages`;
  const profileMenuItems = [
    profileConfig[role],
    ...(role === 'alumni'
      ? []
      : [{ href: `/${rolePath}/badges`, label: 'Badges & achievements', icon: 'shield' as const }]),
  ];
  const initials = user.name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (!headerRef.current?.contains(event.target as Node)) {
        cancelHover();
        setDesktopDropdown(null);
        setUserMenuOpen(false);
      }
    }
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        cancelHover();
        const focused = document.activeElement;
        if (focused instanceof HTMLElement) {
          const disclosure = focused.closest('[data-disclosure]');
          disclosure?.querySelector<HTMLButtonElement>('button[aria-expanded]')?.focus();
        }
        setDesktopDropdown(null);
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('keydown', handleEscape);
    return () => {
      cancelHover();
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('keydown', handleEscape);
    };
  }, []);

  useEffect(() => {
    if (role !== 'student' && role !== 'employer') return;
    let cancelled = false;
    async function loadPremiumStatus() {
      try {
        const res = await fetch('/api/premium/status', { cache: 'no-store' });
        if (!res.ok) return;
        const data = await readJsonSafely<{ isPremium?: boolean }>(res, {});
        if (!cancelled && typeof data.isPremium === 'boolean') setPremiumActive(data.isPremium);
      } catch {
        /* Keep the navigation available if the status request fails. */
      }
    }
    void loadPremiumStatus();
    function handlePremiumUpdate(event: Event) {
      const detail = (event as CustomEvent<{ isPremium?: boolean }>).detail;
      if (typeof detail?.isPremium === 'boolean') setPremiumActive(detail.isPremium);
    }
    window.addEventListener(PREMIUM_STATUS_EVENT, handlePremiumUpdate);
    return () => {
      cancelled = true;
      window.removeEventListener(PREMIUM_STATUS_EVENT, handlePremiumUpdate);
    };
  }, [role]);

  useEffect(() => {
    if (!mobileNavOpen) return;
    const previousOverflow = document.body.style.overflow;
    const mobileTrigger = mobileTriggerRef.current;
    document.body.style.overflow = 'hidden';
    const drawer = drawerRef.current;
    drawer?.querySelector<HTMLButtonElement>('button')?.focus();
    function handleKey(event: KeyboardEvent) {
      if (event.key === 'Escape') setMobileNavOpen(false);
      if (event.key !== 'Tab' || !drawer) return;
      const elements = Array.from(
        drawer.querySelectorAll<HTMLElement>('a[href], button:not([disabled])')
      );
      const first = elements[0];
      const last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    function handleResize() {
      if (window.innerWidth > 1200) setMobileNavOpen(false);
    }
    window.addEventListener('keydown', handleKey);
    window.addEventListener('resize', handleResize);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', handleKey);
      window.removeEventListener('resize', handleResize);
      mobileTrigger?.focus();
    };
  }, [mobileNavOpen]);

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign('/');
  }
  const avatar = user.image ? (
    <Image src={user.image} alt="" width={34} height={34} unoptimized className={styles.avatar} />
  ) : (
    <span className={styles.avatar}>{initials}</span>
  );
  const closeNavigation = () => {
    cancelHover();
    setMobileNavOpen(false);
    setDesktopDropdown(null);
    setUserMenuOpen(false);
  };

  return (
    <div
      className={`${styles.shell} ${hideFooter ? styles.fixedShell : ''} ${navigationOnly ? styles.navigationOnly : ''}`}
    >
      <a href="#workspace-content" className={styles.skipLink}>
        Skip to content
      </a>
      <header className={styles.header} ref={headerRef}>
        <div className={styles.topbar}>
          <button
            ref={mobileTriggerRef}
            className={`${styles.iconButton} ${styles.mobileToggle}`}
            onClick={() => setMobileNavOpen(true)}
            aria-label="Open navigation"
            aria-expanded={mobileNavOpen}
            aria-controls="workspace-navigation"
            type="button"
          >
            <Menu size={21} />
          </button>
          <Link href={homeHref} className={styles.brand} aria-label="Nextern home">
            <NexternLogo
              markSize={34}
              markRadius={8}
              textSize={21}
              textColor="#f5f8f7"
              dotColor="#9bd7b9"
            />
          </Link>
          <span className={styles.workspaceLabel}>
            {roleLabel.replace('dashboard', 'workspace')}
          </span>
          <div className={styles.toolbar}>
            {user.userId ? (
              <MessageBell
                userId={user.userId}
                initialUnread={user.unreadMessages}
                href={messagesHref}
                compact
              />
            ) : (
              <Link href={messagesHref} className={styles.iconButton} aria-label="Messages">
                <Mail size={19} />
              </Link>
            )}
            {user.userId ? (
              <NotificationBell
                userId={user.userId}
                initialUnread={user.unreadNotifications}
                notificationsHref={notificationsHref}
                compact
              />
            ) : (
              <Link
                href={notificationsHref}
                className={styles.iconButton}
                aria-label="Notifications"
              >
                <Bell size={19} />
              </Link>
            )}
            <div
              className={styles.account}
              data-disclosure
              onPointerEnter={(event) => openOnHover('account', event.pointerType)}
              onPointerLeave={(event) => closeAfterHover(event.pointerType)}
              onBlur={(event) => {
                if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                  cancelHover();
                  setUserMenuOpen(false);
                }
              }}
            >
              <button
                type="button"
                className={styles.accountButton}
                onClick={(event) => {
                  cancelHover();
                  setUserMenuOpen((current) => (event.detail > 0 && canHover() ? true : !current));
                  setDesktopDropdown(null);
                }}
                aria-expanded={userMenuOpen}
                aria-controls="workspace-account-menu"
                aria-label={`Account: ${user.name}`}
              >
                {avatar}
                <span className={styles.accountCopy}>
                  <span className={styles.accountName}>{user.name}</span>
                  <small>{premiumActive ? 'Premium member' : 'Your account'}</small>
                </span>
                <ChevronDown size={14} />
              </button>
              {userMenuOpen && (
                <div id="workspace-account-menu" className={styles.accountMenu}>
                  <div className={styles.accountIdentity}>
                    <strong>{user.name}</strong>
                    <span>{user.email}</span>
                    <span>{user.subtitle}</span>
                    {premiumActive && (
                      <span className={styles.premium}>
                        <Crown size={13} /> Premium active
                      </span>
                    )}
                  </div>
                  {profileMenuItems.map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={closeNavigation}
                      className={styles.accountLink}
                    >
                      <NavIcon name={item.icon} />
                      {item.label}
                    </Link>
                  ))}
                  <button type="button" className={styles.signOut} onClick={handleSignOut}>
                    <LogOut size={16} /> Sign out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <nav className={styles.desktopNav} aria-label={roleLabel + ' navigation'}>
          {resolvedNavItems.map((item) => {
            const active =
              isPathMatch(pathname, item.href, search) ||
              item.items?.some((entry) => isPathMatch(pathname, entry.href, search));
            const expanded = desktopDropdown === item.label;
            const id = 'nav-' + item.label.replaceAll(' ', '-');
            return (
              <div
                key={item.label}
                className={styles.navItem}
                data-disclosure
                onPointerEnter={(event) => {
                  if (item.items) openOnHover(item.label, event.pointerType);
                }}
                onPointerLeave={(event) => {
                  if (item.items) closeAfterHover(event.pointerType);
                }}
                onBlur={(event) => {
                  if (!event.currentTarget.contains(event.relatedTarget as Node)) {
                    cancelHover();
                    setDesktopDropdown(null);
                  }
                }}
              >
                {item.items ? (
                  <>
                    <button
                      type="button"
                      className={styles.navLink + (active ? ' ' + styles.navActive : '')}
                      aria-expanded={expanded}
                      aria-controls={id}
                      onClick={(event) => {
                        cancelHover();
                        setDesktopDropdown(
                          event.detail > 0 && canHover() ? item.label : expanded ? null : item.label
                        );
                        setUserMenuOpen(false);
                      }}
                    >
                      {item.icon && <NavIcon name={item.icon} />} {item.label}{' '}
                      <ChevronDown size={14} />
                    </button>
                    {expanded && (
                      <div className={styles.navDropdown} id={id}>
                        {item.items.map((entry) => (
                          <Link
                            key={entry.href + entry.label}
                            href={entry.href}
                            className={
                              styles.dropdownLink +
                              (isPathMatch(pathname, entry.href, search)
                                ? ' ' + styles.dropdownActive
                                : '')
                            }
                            aria-current={
                              isPathMatch(pathname, entry.href, search) ? 'page' : undefined
                            }
                            onClick={closeNavigation}
                          >
                            <span className={styles.dropdownIcon}>
                              <NavIcon name={entry.icon} />
                            </span>
                            <span>
                              <strong>{entry.label}</strong>
                              <small>{entry.description}</small>
                            </span>
                          </Link>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <Link
                    className={styles.navLink + (active ? ' ' + styles.navActive : '')}
                    href={item.href ?? homeHref}
                    onClick={closeNavigation}
                    aria-current={active ? 'page' : undefined}
                  >
                    {item.icon && <NavIcon name={item.icon} />}
                    {item.label}
                  </Link>
                )}
              </div>
            );
          })}
        </nav>
      </header>
      {mobileNavOpen && (
        <>
          <div
            className={styles.overlay}
            onClick={() => setMobileNavOpen(false)}
            aria-hidden="true"
          />
          <aside
            id="workspace-navigation"
            ref={drawerRef}
            className={styles.drawer}
            role="dialog"
            aria-modal="true"
            aria-label="Workspace navigation"
          >
            <div className={styles.drawerHeader}>
              <NexternLogo markSize={32} markRadius={8} textSize={20} textColor="#182c39" />
              <button
                type="button"
                className={styles.iconButton}
                onClick={() => setMobileNavOpen(false)}
                aria-label="Close navigation"
              >
                <X size={21} />
              </button>
            </div>
            <div className={styles.drawerUser}>
              {avatar}
              <div>
                <strong>{user.name}</strong>
                <span>{user.email}</span>
                <small>{user.subtitle}</small>
              </div>
            </div>
            <nav className={styles.drawerNav} aria-label="Main navigation">
              {resolvedNavItems.map((item) => {
                const active =
                  isPathMatch(pathname, item.href, search) ||
                  item.items?.some((entry) => isPathMatch(pathname, entry.href, search));
                return (
                  <div key={item.label}>
                    {item.items ? (
                      <>
                        <button
                          type="button"
                          className={`${styles.mobileLink} ${active ? styles.dropdownActive : ''}`}
                          aria-expanded={mobileExpandedGroup === item.label}
                          onClick={() =>
                            setMobileExpandedGroup((current) =>
                              current === item.label ? null : item.label
                            )
                          }
                        >
                          {item.icon && <NavIcon name={item.icon} />}
                          <span>{item.label}</span>
                          <ChevronDown size={16} />
                        </button>
                        {mobileExpandedGroup === item.label && (
                          <div className={styles.mobileChildren}>
                            {item.items.map((entry) => (
                              <Link
                                key={`${entry.label}:${entry.href}`}
                                href={entry.href}
                                className={`${styles.mobileChild} ${isPathMatch(pathname, entry.href, search) ? styles.dropdownActive : ''}`}
                                onClick={closeNavigation}
                              >
                                {entry.label}
                              </Link>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <Link
                        href={item.href ?? homeHref}
                        className={`${styles.mobileLink} ${active ? styles.dropdownActive : ''}`}
                        onClick={closeNavigation}
                        aria-current={active ? 'page' : undefined}
                      >
                        {item.icon && <NavIcon name={item.icon} />}
                        <span>{item.label}</span>
                        <ChevronRight size={15} />
                      </Link>
                    )}
                  </div>
                );
              })}
            </nav>
            <div className={styles.drawerAccount}>
              {profileMenuItems.map((item) => (
                <Link
                  key={item.href}
                  className={styles.accountLink}
                  href={item.href}
                  onClick={closeNavigation}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              ))}
              {premiumActive && (
                <span className={styles.premium}>
                  <Crown size={13} />
                  Premium active
                </span>
              )}
              <button type="button" onClick={handleSignOut} className={styles.signOut}>
                <LogOut size={16} />
                Sign out
              </button>
            </div>
          </aside>
        </>
      )}
      {!navigationOnly && (
        <main
          id="workspace-content"
          tabIndex={-1}
          className={styles.content}
          data-workspace-role={role}
        >
          {children}
        </main>
      )}
    </div>
  );
}
