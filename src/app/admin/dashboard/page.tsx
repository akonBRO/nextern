// src/app/(admin)/dashboard/page.tsx — Premium redesign
'use client';

import { useState, useEffect, useCallback } from 'react';
import { signOut, useSession } from 'next-auth/react';
import React from 'react';

type User = {
  _id: string;
  name: string;
  email: string;
  role: string;
  verificationStatus: string;
  companyName?: string;
  institutionName?: string;
  industry?: string;
  tradeLicenseNo?: string;
  createdAt: string;
  isVerified: boolean;
};

type Summary = {
  pendingEmployers: number;
  pendingAdvisors: number;
  totalStudents: number;
  approvedCompanies: number;
};

/* ── ICONS ─────────────────────────────────────────────────────────── */
const BuildingIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <rect x="4" y="2" width="16" height="20" rx="2" />
    <path d="M9 22V12h6v10M8 7h.01M12 7h.01M16 7h.01M8 11h.01M16 11h.01" />
  </svg>
);
const UsersIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
    <circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const GradCapIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M22 10v6M2 10l10-5 10 5-10 5z" />
    <path d="M6 12v5c3 3 9 3 12 0v-5" />
  </svg>
);
const CheckCircleIcon = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <polyline points="9 12 11 14 15 10" />
  </svg>
);
const SearchIcon = () => (
  <svg
    width="16"
    height="16"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="11" cy="11" r="8" />
    <line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);
const RefreshIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="23 4 23 10 17 10" />
    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
  </svg>
);
const CheckIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="20 6 9 17 4 12" />
  </svg>
);
const XIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <line x1="18" y1="6" x2="6" y2="18" />
    <line x1="6" y1="6" x2="18" y2="18" />
  </svg>
);
const InboxIcon = () => (
  <svg
    width="44"
    height="44"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
    <path d="M5.45 5.11 2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
  </svg>
);
const LogoutIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const ShieldIcon = () => (
  <svg
    width="13"
    height="13"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
  </svg>
);
const ChevronDownIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const NoteIcon = () => (
  <svg
    width="14"
    height="14"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z" />
    <polyline points="14 2 14 8 20 8" />
    <line x1="16" y1="13" x2="8" y2="13" />
    <line x1="16" y1="17" x2="8" y2="17" />
  </svg>
);

/* ── CONFIGS ────────────────────────────────────────────────────────── */
const TABS = [
  {
    key: 'employer',
    label: 'Employers',
    Icon: BuildingIcon,
    accent: '#7C3AED',
    bg: '#EDE9FE',
    border: '#DDD6FE',
  },
  {
    key: 'advisor',
    label: 'Advisors',
    Icon: UsersIcon,
    accent: '#0284C7',
    bg: '#E0F2FE',
    border: '#BAE6FD',
  },
  {
    key: 'dept_head',
    label: 'Dept Heads',
    Icon: BuildingIcon,
    accent: '#B45309',
    bg: '#FEF3C7',
    border: '#FDE68A',
  },
  {
    key: 'student',
    label: 'Students',
    Icon: GradCapIcon,
    accent: '#059669',
    bg: '#DCFCE7',
    border: '#BBF7D0',
  },
];

const STATUS_CFG: Record<
  string,
  { bg: string; color: string; border: string; dot: string; label: string }
> = {
  pending: { bg: '#FEFCE8', color: '#92400E', border: '#FDE68A', dot: '#F59E0B', label: 'Pending' },
  approved: {
    bg: '#F0FDF4',
    color: '#166534',
    border: '#BBF7D0',
    dot: '#22C55E',
    label: 'Approved',
  },
  rejected: {
    bg: '#FEF2F2',
    color: '#991B1B',
    border: '#FECACA',
    dot: '#EF4444',
    label: 'Rejected',
  },
};

/* ── STAT CARD ─────────────────────────────────────────────────────── */
function StatCard({
  label,
  value,
  Icon,
  accent,
  bg,
  border,
}: {
  label: string;
  value: string;
  Icon: (p: { size?: number }) => React.JSX.Element;
  accent: string;
  bg: string;
  border: string;
}) {
  return (
    <div
      style={{
        background: '#fff',
        borderRadius: 16,
        padding: '20px 22px',
        border: '1px solid #E2E8F0',
        boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          marginBottom: 14,
        }}
      >
        <div
          style={{
            width: 40,
            height: 40,
            background: bg,
            border: `1px solid ${border}`,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: accent,
          }}
        >
          <Icon />
        </div>
      </div>
      <div
        style={{
          fontSize: 30,
          fontWeight: 900,
          color: '#0F172A',
          fontFamily: 'var(--font-display)',
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      <div style={{ fontSize: 13, color: '#64748B', fontWeight: 500 }}>{label}</div>
    </div>
  );
}

/* ── STATUS BADGE ──────────────────────────────────────────────────── */
function StatusBadge({ status }: { status: string }) {
  const c = STATUS_CFG[status] ?? STATUS_CFG.pending;
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        background: c.bg,
        color: c.color,
        border: `1px solid ${c.border}`,
        padding: '3px 10px',
        borderRadius: 999,
        fontSize: 12,
        fontWeight: 700,
        whiteSpace: 'nowrap',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: c.dot,
          display: 'inline-block',
        }}
      />
      {c.label}
    </span>
  );
}

/* ── DETAIL TAG ────────────────────────────────────────────────────── */
function Tag({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
      <span
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: '#94A3B8',
          textTransform: 'uppercase',
          letterSpacing: 0.6,
        }}
      >
        {label}
      </span>
      <span style={{ fontSize: 13, color: '#334155', fontWeight: 500 }}>{value}</span>
    </div>
  );
}

/* ── MAIN ──────────────────────────────────────────────────────────── */
export default function AdminDashboard() {
  const { data: session } = useSession();
  const [tab, setTab] = useState('employer');
  const [status, setStatus] = useState('pending');
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [note, setNote] = useState('');
  const [noteTarget, setNoteTarget] = useState<string | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [summary, setSummary] = useState<Summary>({
    pendingEmployers: 0,
    pendingAdvisors: 0,
    totalStudents: 0,
    approvedCompanies: 0,
  });

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ role: tab, status, limit: '20' });
      if (search) params.set('search', search);
      const res = await fetch(`/api/admin/users?${params}`);
      const data = await res.json();
      setUsers(data.users ?? []);
      setTotal(data.pagination?.total ?? 0);
      setSummary({
        pendingEmployers: data.summary?.pendingEmployers ?? 0,
        pendingAdvisors: data.summary?.pendingAdvisors ?? 0,
        totalStudents: data.summary?.totalStudents ?? 0,
        approvedCompanies: data.summary?.approvedCompanies ?? 0,
      });
    } finally {
      setLoading(false);
    }
  }, [tab, status, search]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setSearch(searchInput), 350);
    return () => clearTimeout(t);
  }, [searchInput]);

  async function handleSignOut() {
    await signOut({ redirect: false });
    window.location.assign('/');
  }

  async function handleAction(userId: string, action: 'approve' | 'reject') {
    setActionLoading(userId);
    try {
      const res = await fetch(`/api/admin/approve/${userId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, note: noteTarget === userId ? note : undefined }),
      });
      if (res.ok) {
        setNoteTarget(null);
        setNote('');
        setExpandedUser(null);
        await fetchUsers();
      }
    } finally {
      setActionLoading(null);
    }
  }

  const activeTab = TABS.find((t) => t.key === tab)!;

  return (
    <div style={{ minHeight: '100vh', background: '#F1F5F9', fontFamily: 'var(--font-body)' }}>
      {/* ── TOPBAR ──────────────────────────────────────────────── */}
      <nav
        style={{
          background: '#0F172A',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          position: 'sticky',
          top: 0,
          zIndex: 50,
        }}
      >
        <div
          style={{
            maxWidth: 1400,
            margin: '0 auto',
            padding: '0 28px',
            height: 62,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  background: 'linear-gradient(135deg,#2563EB,#22D3EE)',
                  borderRadius: 9,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 2px 8px rgba(37,99,235,0.4)',
                }}
              >
                <span
                  style={{
                    color: '#fff',
                    fontSize: 16,
                    fontWeight: 900,
                    fontFamily: 'var(--font-display)',
                  }}
                >
                  N
                </span>
              </div>
              <span
                style={{
                  color: '#fff',
                  fontSize: 18,
                  fontWeight: 800,
                  fontFamily: 'var(--font-display)',
                  letterSpacing: '-0.3px',
                }}
              >
                nextern<span style={{ color: '#22D3EE' }}>.</span>
              </span>
            </div>
            <div style={{ width: 1, height: 18, background: 'rgba(255,255,255,0.1)' }} />
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 5,
                background: 'rgba(37,99,235,0.15)',
                border: '1px solid rgba(37,99,235,0.3)',
                borderRadius: 7,
                padding: '4px 10px',
              }}
            >
              <ShieldIcon />
              <span style={{ color: '#93C5FD', fontSize: 11, fontWeight: 700, letterSpacing: 0.5 }}>
                ADMIN PANEL
              </span>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ color: '#CBD5E1', fontSize: 13, fontWeight: 600 }}>
                {session?.user?.name ?? 'Administrator'}
              </div>
              <div style={{ color: '#475569', fontSize: 12 }}>{session?.user?.email}</div>
            </div>
            <div
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #2563EB, #7C3AED)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#fff',
                fontSize: 13,
                fontWeight: 800,
              }}
            >
              {(session?.user?.name?.[0] ?? 'A').toUpperCase()}
            </div>
            <button
              onClick={handleSignOut}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                color: '#475569',
                background: 'none',
                border: '1px solid rgba(255,255,255,0.08)',
                cursor: 'pointer',
                fontSize: 13,
                padding: '7px 12px',
                borderRadius: 8,
                transition: 'all 0.15s',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = '#CBD5E1';
                e.currentTarget.style.background = 'rgba(255,255,255,0.06)';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = '#475569';
                e.currentTarget.style.background = 'none';
              }}
            >
              <LogoutIcon /> Sign out
            </button>
          </div>
        </div>
      </nav>

      <div style={{ maxWidth: 1400, margin: '0 auto', padding: '28px 28px' }}>
        {/* ── PAGE HEADER ─────────────────────────────────────── */}
        <div
          style={{
            marginBottom: 24,
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 22,
                fontWeight: 900,
                color: '#0F172A',
                fontFamily: 'var(--font-display)',
                letterSpacing: '-0.4px',
                marginBottom: 3,
              }}
            >
              User Management
            </h1>
            <p style={{ color: '#64748B', fontSize: 14 }}>
              Review and approve registrations across all roles
            </p>
          </div>
          <button
            onClick={fetchUsers}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 7,
              background: '#fff',
              border: '1px solid #E2E8F0',
              color: '#475569',
              padding: '9px 16px',
              borderRadius: 10,
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
              transition: 'all 0.15s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.borderColor = '#2563EB';
              e.currentTarget.style.color = '#2563EB';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.borderColor = '#E2E8F0';
              e.currentTarget.style.color = '#475569';
            }}
          >
            <RefreshIcon /> Refresh
          </button>
        </div>

        {/* ── STATS ───────────────────────────────────────────── */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: 16,
            marginBottom: 24,
          }}
        >
          <StatCard
            label="Pending Employers"
            value={summary.pendingEmployers.toString()}
            Icon={BuildingIcon}
            accent="#7C3AED"
            bg="#EDE9FE"
            border="#DDD6FE"
          />
          <StatCard
            label="Pending Advisors"
            value={summary.pendingAdvisors.toString()}
            Icon={UsersIcon}
            accent="#0284C7"
            bg="#E0F2FE"
            border="#BAE6FD"
          />
          <StatCard
            label="Total Students"
            value={summary.totalStudents.toString()}
            Icon={GradCapIcon}
            accent="#059669"
            bg="#DCFCE7"
            border="#BBF7D0"
          />
          <StatCard
            label="Approved Companies"
            value={summary.approvedCompanies.toString()}
            Icon={CheckCircleIcon}
            accent="#D97706"
            bg="#FEF3C7"
            border="#FDE68A"
          />
        </div>

        {/* ── TABLE CARD ──────────────────────────────────────── */}
        <div
          style={{
            background: '#fff',
            borderRadius: 20,
            border: '1px solid #E2E8F0',
            boxShadow: '0 2px 16px rgba(0,0,0,0.05)',
            overflow: 'hidden',
          }}
        >
          {/* Tab bar */}
          <div
            style={{
              display: 'flex',
              borderBottom: '1px solid #F1F5F9',
              padding: '0 20px',
              overflowX: 'auto',
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.key;
              return (
                <button
                  key={t.key}
                  onClick={() => {
                    setTab(t.key);
                    setNoteTarget(null);
                    setExpandedUser(null);
                  }}
                  style={{
                    padding: '15px 16px',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: 14,
                    fontWeight: active ? 700 : 500,
                    fontFamily: 'var(--font-display)',
                    color: active ? t.accent : '#64748B',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 7,
                    whiteSpace: 'nowrap',
                    borderBottom: `2.5px solid ${active ? t.accent : 'transparent'}`,
                    marginBottom: -1,
                    transition: 'color 0.15s',
                  }}
                >
                  <div style={{ color: active ? t.accent : '#94A3B8' }}>
                    <t.Icon />
                  </div>
                  {t.label}
                </button>
              );
            })}
          </div>

          {/* Controls */}
          <div
            style={{
              padding: '14px 20px',
              borderBottom: '1px solid #F8FAFC',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexWrap: 'wrap',
              background: '#FAFBFC',
            }}
          >
            <div style={{ position: 'relative', flex: '1 1 220px', maxWidth: 300 }}>
              <div
                style={{
                  position: 'absolute',
                  left: 11,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#94A3B8',
                  pointerEvents: 'none',
                }}
              >
                <SearchIcon />
              </div>
              <input
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search name or email…"
                style={{
                  width: '100%',
                  padding: '9px 12px 9px 33px',
                  border: '1.5px solid #E2E8F0',
                  borderRadius: 10,
                  fontSize: 14,
                  fontFamily: 'var(--font-body)',
                  background: '#fff',
                  color: '#0F172A',
                  outline: 'none',
                  boxSizing: 'border-box',
                  transition: 'border-color 0.15s, box-shadow 0.15s',
                }}
                onFocus={(e) => {
                  e.target.style.borderColor = '#2563EB';
                  e.target.style.boxShadow = '0 0 0 3px rgba(37,99,235,0.1)';
                }}
                onBlur={(e) => {
                  e.target.style.borderColor = '#E2E8F0';
                  e.target.style.boxShadow = 'none';
                }}
              />
            </div>
            <div style={{ display: 'flex', gap: 6 }}>
              {(['pending', 'approved', 'rejected'] as const).map((s) => {
                const c = STATUS_CFG[s];
                const active = status === s;
                return (
                  <button
                    key={s}
                    onClick={() => setStatus(s)}
                    style={{
                      padding: '7px 14px',
                      borderRadius: 9,
                      border: `1.5px solid ${active ? c.border : '#E2E8F0'}`,
                      background: active ? c.bg : '#fff',
                      color: active ? c.color : '#64748B',
                      fontSize: 13,
                      fontWeight: active ? 700 : 500,
                      cursor: 'pointer',
                      transition: 'all 0.15s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 5,
                    }}
                  >
                    {active && (
                      <span
                        style={{
                          width: 6,
                          height: 6,
                          borderRadius: '50%',
                          background: c.dot,
                          display: 'inline-block',
                        }}
                      />
                    )}
                    {c.label}
                  </button>
                );
              })}
            </div>
            <div
              style={{
                marginLeft: 'auto',
                color: '#94A3B8',
                fontSize: 13,
                fontWeight: 500,
                whiteSpace: 'nowrap',
              }}
            >
              {loading ? 'Loading…' : `${total} result${total !== 1 ? 's' : ''}`}
            </div>
          </div>

          {/* Body */}
          {loading ? (
            <div
              style={{
                padding: '60px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  border: '3px solid #F1F5F9',
                  borderTopColor: activeTab.accent,
                  borderRadius: '50%',
                  animation: 'spin 0.7s linear infinite',
                }}
              />
              <span style={{ color: '#94A3B8', fontSize: 14 }}>
                Loading {activeTab.label.toLowerCase()}…
              </span>
            </div>
          ) : users.length === 0 ? (
            <div
              style={{
                padding: '68px 0',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
              }}
            >
              <div style={{ color: '#CBD5E1' }}>
                <InboxIcon />
              </div>
              <div style={{ textAlign: 'center' }}>
                <div
                  style={{
                    color: '#475569',
                    fontSize: 16,
                    fontWeight: 700,
                    fontFamily: 'var(--font-display)',
                    marginBottom: 4,
                  }}
                >
                  No results found
                </div>
                <div style={{ color: '#94A3B8', fontSize: 14 }}>
                  No {activeTab.label.toLowerCase()} with &quot;{STATUS_CFG[status]?.label}&quot;
                  status{search ? ` matching "${search}"` : ''}
                </div>
              </div>
              {search && (
                <button
                  onClick={() => {
                    setSearchInput('');
                    setSearch('');
                  }}
                  style={{
                    background: '#EFF6FF',
                    color: '#2563EB',
                    border: '1px solid #BFDBFE',
                    borderRadius: 8,
                    padding: '7px 16px',
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Clear search
                </button>
              )}
            </div>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ background: '#F8FAFC', borderBottom: '1px solid #F1F5F9' }}>
                    {['User', 'Details', 'Registered', 'Email Verified', 'Status', 'Actions'].map(
                      (h) => (
                        <th
                          key={h}
                          style={{
                            padding: '11px 18px',
                            textAlign: 'left',
                            fontSize: 11,
                            fontWeight: 700,
                            color: '#94A3B8',
                            textTransform: 'uppercase',
                            letterSpacing: 0.8,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {h}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, i) => {
                    const isActing = actionLoading === user._id;
                    const isNoteOpen = noteTarget === user._id;
                    const isExpanded = expandedUser === user._id;
                    const isPending = user.verificationStatus === 'pending';
                    const initials = user.name
                      .split(' ')
                      .map((w) => w[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    const avatarColors = [
                      '#2563EB',
                      '#7C3AED',
                      '#059669',
                      '#DC2626',
                      '#D97706',
                      '#0284C7',
                    ];
                    const avatarBg = avatarColors[i % avatarColors.length];

                    return (
                      <>
                        <tr
                          key={user._id}
                          style={{
                            borderTop: i === 0 ? 'none' : '1px solid #F8FAFC',
                            background: isExpanded ? '#FAFEFF' : '#fff',
                            transition: 'background 0.15s',
                            cursor: 'default',
                          }}
                          onMouseOver={(e) => {
                            if (!isExpanded)
                              (e.currentTarget as HTMLElement).style.background = '#FAFBFC';
                          }}
                          onMouseOut={(e) => {
                            if (!isExpanded)
                              (e.currentTarget as HTMLElement).style.background = '#fff';
                          }}
                        >
                          {/* User */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 11 }}>
                              <div
                                style={{
                                  width: 38,
                                  height: 38,
                                  borderRadius: '50%',
                                  background: avatarBg,
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#fff',
                                  fontSize: 13,
                                  fontWeight: 800,
                                  flexShrink: 0,
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ fontWeight: 700, color: '#0F172A', fontSize: 14 }}>
                                  {user.name}
                                </div>
                                <div style={{ color: '#64748B', fontSize: 12, marginTop: 1 }}>
                                  {user.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          {/* Details */}
                          <td style={{ padding: '14px 18px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                              {user.companyName && <Tag label="Company" value={user.companyName} />}
                              {user.industry && <Tag label="Industry" value={user.industry} />}
                              {user.tradeLicenseNo && (
                                <Tag label="License" value={user.tradeLicenseNo} />
                              )}
                              {user.institutionName && (
                                <Tag label="Institution" value={user.institutionName} />
                              )}
                              {!user.companyName && !user.institutionName && (
                                <span style={{ color: '#94A3B8', fontSize: 13 }}>—</span>
                              )}
                            </div>
                          </td>

                          {/* Registered */}
                          <td
                            style={{
                              padding: '14px 18px',
                              fontSize: 13,
                              color: '#64748B',
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {new Date(user.createdAt).toLocaleDateString('en-BD', {
                              day: 'numeric',
                              month: 'short',
                              year: 'numeric',
                            })}
                          </td>

                          {/* Email verified */}
                          <td style={{ padding: '14px 18px' }}>
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                background: user.isVerified ? '#F0FDF4' : '#FEF2F2',
                                color: user.isVerified ? '#166534' : '#991B1B',
                                border: `1px solid ${user.isVerified ? '#BBF7D0' : '#FECACA'}`,
                                padding: '3px 10px',
                                borderRadius: 999,
                                fontSize: 12,
                                fontWeight: 700,
                              }}
                            >
                              {user.isVerified ? <CheckIcon /> : <XIcon />}
                              {user.isVerified ? 'Verified' : 'Pending'}
                            </span>
                          </td>

                          {/* Status */}
                          <td style={{ padding: '14px 18px' }}>
                            <StatusBadge status={user.verificationStatus} />
                          </td>

                          {/* Actions */}
                          <td style={{ padding: '14px 18px' }}>
                            {isPending ? (
                              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                <button
                                  onClick={() => handleAction(user._id, 'approve')}
                                  disabled={isActing}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '7px 14px',
                                    background: isActing ? '#D1FAE5' : '#059669',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 8,
                                    cursor: isActing ? 'not-allowed' : 'pointer',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    transition: 'all 0.15s',
                                    boxShadow: '0 1px 4px rgba(5,150,105,0.3)',
                                    whiteSpace: 'nowrap',
                                  }}
                                  onMouseOver={(e) => {
                                    if (!isActing) {
                                      e.currentTarget.style.background = '#047857';
                                      e.currentTarget.style.boxShadow =
                                        '0 3px 10px rgba(5,150,105,0.4)';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#059669';
                                    e.currentTarget.style.boxShadow =
                                      '0 1px 4px rgba(5,150,105,0.3)';
                                  }}
                                >
                                  {isActing ? (
                                    <span
                                      style={{
                                        width: 12,
                                        height: 12,
                                        border: '2px solid rgba(255,255,255,0.3)',
                                        borderTopColor: '#fff',
                                        borderRadius: '50%',
                                        display: 'inline-block',
                                        animation: 'spin 0.7s linear infinite',
                                      }}
                                    />
                                  ) : (
                                    <CheckIcon />
                                  )}
                                  Approve
                                </button>
                                <button
                                  onClick={() => {
                                    setNoteTarget(isNoteOpen ? null : user._id);
                                    setNote('');
                                  }}
                                  disabled={isActing}
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: 5,
                                    padding: '7px 14px',
                                    background: isNoteOpen ? '#FEF2F2' : '#fff',
                                    color: '#DC2626',
                                    border: `1.5px solid ${isNoteOpen ? '#FECACA' : '#FCA5A5'}`,
                                    borderRadius: 8,
                                    cursor: isActing ? 'not-allowed' : 'pointer',
                                    fontSize: 13,
                                    fontWeight: 700,
                                    transition: 'all 0.15s',
                                    whiteSpace: 'nowrap',
                                  }}
                                  onMouseOver={(e) => {
                                    if (!isActing) {
                                      e.currentTarget.style.background = '#FEF2F2';
                                      e.currentTarget.style.borderColor = '#FECACA';
                                    }
                                  }}
                                  onMouseOut={(e) => {
                                    if (!isNoteOpen) {
                                      e.currentTarget.style.background = '#fff';
                                      e.currentTarget.style.borderColor = '#FCA5A5';
                                    }
                                  }}
                                >
                                  <NoteIcon />
                                  Reject
                                </button>
                              </div>
                            ) : (
                              <span style={{ color: '#CBD5E1', fontSize: 13 }}>—</span>
                            )}
                          </td>
                        </tr>

                        {/* Rejection note row */}
                        {isNoteOpen && (
                          <tr key={`note-${user._id}`}>
                            <td
                              colSpan={6}
                              style={{
                                padding: '0 18px 14px',
                                background: '#FFF5F5',
                                borderTop: '1px solid #FECACA',
                              }}
                            >
                              <div
                                style={{
                                  display: 'flex',
                                  gap: 10,
                                  alignItems: 'flex-end',
                                  paddingTop: 14,
                                }}
                              >
                                <div style={{ flex: 1 }}>
                                  <label
                                    style={{
                                      fontSize: 12,
                                      fontWeight: 700,
                                      color: '#DC2626',
                                      marginBottom: 6,
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: 5,
                                    }}
                                  >
                                    <NoteIcon /> Rejection reason — optional, sent to user
                                  </label>
                                  <input
                                    value={note}
                                    onChange={(e) => setNote(e.target.value)}
                                    placeholder="e.g. Trade license number could not be verified"
                                    style={{
                                      width: '100%',
                                      padding: '10px 14px',
                                      border: '1.5px solid #FECACA',
                                      borderRadius: 10,
                                      fontSize: 14,
                                      fontFamily: 'var(--font-body)',
                                      background: '#fff',
                                      color: '#0F172A',
                                      outline: 'none',
                                      boxSizing: 'border-box',
                                      transition: 'border-color 0.15s, box-shadow 0.15s',
                                    }}
                                    onFocus={(e) => {
                                      e.target.style.borderColor = '#EF4444';
                                      e.target.style.boxShadow = '0 0 0 3px rgba(239,68,68,0.1)';
                                    }}
                                    onBlur={(e) => {
                                      e.target.style.borderColor = '#FECACA';
                                      e.target.style.boxShadow = 'none';
                                    }}
                                  />
                                </div>
                                <button
                                  onClick={() => handleAction(user._id, 'reject')}
                                  style={{
                                    padding: '10px 20px',
                                    background: '#EF4444',
                                    color: '#fff',
                                    border: 'none',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontWeight: 700,
                                    fontSize: 14,
                                    whiteSpace: 'nowrap',
                                    boxShadow: '0 2px 8px rgba(239,68,68,0.3)',
                                    transition: 'all 0.15s',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 6,
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.background = '#DC2626';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.background = '#EF4444';
                                  }}
                                >
                                  <XIcon /> Confirm Reject
                                </button>
                                <button
                                  onClick={() => setNoteTarget(null)}
                                  style={{
                                    padding: '10px 16px',
                                    background: '#fff',
                                    color: '#64748B',
                                    border: '1.5px solid #E2E8F0',
                                    borderRadius: 10,
                                    cursor: 'pointer',
                                    fontSize: 14,
                                    fontWeight: 600,
                                    transition: 'all 0.15s',
                                  }}
                                  onMouseOver={(e) => {
                                    e.currentTarget.style.borderColor = '#94A3B8';
                                  }}
                                  onMouseOut={(e) => {
                                    e.currentTarget.style.borderColor = '#E2E8F0';
                                  }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </td>
                          </tr>
                        )}
                      </>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          {/* Footer */}
          {!loading && users.length > 0 && (
            <div
              style={{
                padding: '14px 20px',
                borderTop: '1px solid #F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                background: '#FAFBFC',
              }}
            >
              <span style={{ color: '#94A3B8', fontSize: 13 }}>
                Showing {users.length} of {total} {activeTab.label.toLowerCase()}
              </span>
              <div style={{ display: 'flex', gap: 6 }}>
                {status === 'pending' && (
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 5,
                      background: '#FEFCE8',
                      color: '#92400E',
                      border: '1px solid #FDE68A',
                      padding: '3px 10px',
                      borderRadius: 999,
                      fontSize: 12,
                      fontWeight: 600,
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: '50%',
                        background: '#F59E0B',
                        display: 'inline-block',
                        boxShadow: '0 0 5px #F59E0B',
                      }}
                    />
                    {total} pending review
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @media (max-width: 900px) {
          .admin-stats { grid-template-columns: 1fr 1fr !important; }
        }
      `}</style>
    </div>
  );
}
