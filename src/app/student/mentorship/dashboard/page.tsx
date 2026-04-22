'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  CalendarDays,
  Inbox,
  Star,
  Award,
  Shield,
  Users,
  Clock,
  CheckCircle2,
  TrendingUp,
} from 'lucide-react';
import MentorProfileForm from '@/components/mentorship/MentorProfileForm';
import SessionCard from '@/components/mentorship/SessionCard';
import VideoSessionLauncher from '@/components/mentorship/VideoSessionLauncher';

/* ─── Design tokens (match navbar) ── */
const C = {
  heroBg: '#1E293B',
  pageBg: '#F8FAFC',
  accent: '#2563EB',
  accent2: '#1D4ED8',
  border: '#E2E8F0',
  cardBg: '#FFFFFF',
  muted: '#94A3B8',
  text: '#1E293B',
  textSub: '#64748B',
};

type Tab = 'sessions' | 'achievements' | 'profile';

/* Inner component uses useSearchParams — must be inside Suspense */
function MentorDashboard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTab = (searchParams.get('tab') as Tab) ?? 'sessions';

  const [mentor, setMentor] = useState<Record<string, unknown> | null>(null);
  const [sessions, setSessions] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      setLoading(true);
      const [mRes, sRes] = await Promise.all([
        fetch('/api/mentors/me'),
        fetch('/api/mentor-sessions?role=mentor'),
      ]);
      if (mRes.ok) setMentor(await mRes.json());
      if (sRes.ok) setSessions(await sRes.json());
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  async function handleAction(sessionId: string, action: string) {
    let status: string | undefined;
    let extra: Record<string, unknown> = {};
    if (action === 'accept') {
      const d = new Date();
      d.setDate(d.getDate() + 1);
      status = 'accepted';
      extra = { scheduledAt: d.toISOString(), durationMinutes: 30 };
    } else if (action === 'reject') status = 'rejected';
    else if (action === 'complete') status = 'completed';
    else if (action === 'cancel') status = 'cancelled';
    if (!status) return;
    const res = await fetch(`/api/mentor-sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, ...extra }),
    });
    if (res.ok) fetchData();
  }

  /* ── Loading ── */
  if (loading)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.pageBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              border: `3px solid ${C.border}`,
              borderTopColor: C.accent,
              animation: 'spin 0.7s linear infinite',
              margin: '0 auto 14px',
            }}
          />
          <p style={{ color: C.muted, fontWeight: 600, fontSize: 14, margin: 0 }}>
            Loading dashboard…
          </p>
        </div>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    );

  /* ── No profile ── */
  if (!mentor)
    return (
      <div
        style={{
          minHeight: '100vh',
          background: C.pageBg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 440, textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 20,
              background: `linear-gradient(135deg,${C.accent},${C.accent2})`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              boxShadow: `0 8px 24px ${C.accent}40`,
            }}
          >
            <Users size={34} color="#FFF" />
          </div>
          <h2 style={{ fontSize: 26, fontWeight: 900, color: C.text, marginBottom: 10 }}>
            No Mentor Profile Yet
          </h2>
          <p style={{ color: C.textSub, fontSize: 14, lineHeight: 1.6, marginBottom: 24 }}>
            Complete your mentor profile to start guiding students on their career journey.
          </p>
          <button
            onClick={() => router.push('/student/mentorship/register')}
            style={{
              padding: '13px 28px',
              borderRadius: 12,
              border: 'none',
              cursor: 'pointer',
              background: `linear-gradient(135deg,${C.accent},${C.accent2})`,
              color: '#FFF',
              fontWeight: 700,
              fontSize: 14,
              boxShadow: `0 6px 20px ${C.accent}40`,
            }}
          >
            Create Mentor Profile
          </button>
        </div>
      </div>
    );

  const pending = sessions.filter((s: Record<string, unknown>) => s.status === 'pending');
  const upcoming = sessions.filter((s: Record<string, unknown>) => s.status === 'accepted');
  const past = sessions.filter((s: Record<string, unknown>) =>
    ['completed', 'rejected', 'cancelled'].includes(s.status as string)
  );
  const badges = ((mentor as Record<string, unknown>).badges as Record<string, unknown>[]) ?? [];
  const endorsements =
    ((mentor as Record<string, unknown>).endorsements as Record<string, unknown>[]) ?? [];
  const completedCount = sessions.filter(
    (s: Record<string, unknown>) => s.status === 'completed'
  ).length;

  const STATS = [
    {
      label: 'Total Sessions',
      value: mentor.totalSessions ?? 0,
      icon: <CalendarDays size={18} />,
      accent: C.accent,
    },
    {
      label: 'Completed',
      value: completedCount,
      icon: <CheckCircle2 size={18} />,
      accent: '#16A34A',
    },
    { label: 'Pending', value: pending.length, icon: <Clock size={18} />, accent: '#D97706' },
    {
      label: 'Avg Rating',
      value: mentor.averageRating ? mentor.averageRating.toFixed(1) : '—',
      icon: <Star size={18} />,
      accent: '#DB2777',
    },
  ];

  return (
    <>
      <style>{`
        @keyframes spin    { to { transform: rotate(360deg); } }
        @keyframes fadeUp  { from { opacity:0;transform:translateY(10px);} to {opacity:1;transform:translateY(0);} }
        .mdb-stat:hover    { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(30,41,59,.15) !important; }
        .mdb-badge:hover   { transform: scale(1.04); }
        .mdb-endorse:hover { border-color: ${C.accent} !important; }
      `}</style>

      <div style={{ background: C.pageBg, minHeight: '100vh' }}>
        {/* ── Hero — matches navbar colour exactly ── */}
        <div
          style={{
            background: C.heroBg,
            borderBottom: '1px solid rgba(255,255,255,0.08)',
            padding: '44px 24px 36px',
          }}
        >
          <div style={{ maxWidth: 1240, margin: '0 auto' }}>
            {/* Identity row */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 28,
                animation: 'fadeUp .3s ease',
              }}
            >
              <div
                style={{
                  width: 46,
                  height: 46,
                  borderRadius: 14,
                  background: `${C.accent}22`,
                  border: `1px solid ${C.accent}40`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <LayoutDashboard size={22} color={C.accent} />
              </div>
              <div>
                <p
                  style={{
                    margin: 0,
                    fontSize: 11,
                    fontWeight: 700,
                    color: C.accent,
                    letterSpacing: '0.08em',
                    textTransform: 'uppercase',
                  }}
                >
                  Alumni Mentor
                </p>
                <h1
                  style={{
                    margin: 0,
                    fontSize: 24,
                    fontWeight: 900,
                    color: '#F1F5F9',
                    letterSpacing: '-0.02em',
                  }}
                >
                  {mentor.currentRole}
                  <span style={{ color: C.muted, fontWeight: 500, fontSize: 16, marginLeft: 10 }}>
                    @ {mentor.currentCompany} · {mentor.industry}
                  </span>
                </h1>
              </div>
            </div>

            {/* Stats */}
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit,minmax(170px,1fr))',
                gap: 12,
                animation: 'fadeUp .3s ease .06s both',
              }}
            >
              {STATS.map((s) => (
                <div
                  key={s.label}
                  className="mdb-stat"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    borderRadius: 14,
                    padding: '14px 18px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    transition: 'transform 0.18s, box-shadow 0.18s',
                    cursor: 'default',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  }}
                >
                  <div
                    style={{
                      width: 36,
                      height: 36,
                      borderRadius: 10,
                      background: `${s.accent}22`,
                      color: s.accent,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}
                  >
                    {s.icon}
                  </div>
                  <div>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#F1F5F9', lineHeight: 1 }}>
                      {s.value}
                    </div>
                    <div style={{ fontSize: 12, color: C.muted, marginTop: 3, fontWeight: 600 }}>
                      {s.label}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ── Content — tabs controlled by navbar links via ?tab= ── */}
        <div style={{ maxWidth: 1240, margin: '0 auto', padding: '32px 24px 80px' }}>
          {/* Sessions (default) */}
          {activeTab === 'sessions' && (
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 28,
                alignItems: 'start',
                animation: 'fadeUp .25s ease',
              }}
            >
              <div>
                <SectionHeader
                  icon={<Clock size={15} />}
                  label="Pending Requests"
                  count={pending.length}
                  accent={C.accent}
                />
                {pending.length > 0 ? (
                  <div style={{ display: 'grid', gap: 14, marginBottom: 32 }}>
                    {pending.map((s) => (
                      <SessionCard key={s._id} session={s} role="mentor" onAction={handleAction} />
                    ))}
                  </div>
                ) : (
                  <EmptyBox
                    icon={<Inbox size={32} />}
                    title="No pending requests"
                    sub="New requests will appear here."
                  />
                )}

                <SectionHeader
                  icon={<CalendarDays size={15} />}
                  label="Upcoming Sessions"
                  accent={C.accent}
                />
                {upcoming.length > 0 ? (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {upcoming.map((s) => (
                      <div key={s._id} style={{ display: 'grid', gap: 10 }}>
                        <SessionCard session={s} role="mentor" onAction={handleAction} />
                        {s.agoraChannelId && <VideoSessionLauncher sessionId={s._id} />}
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBox
                    icon={<CalendarDays size={32} />}
                    title="No upcoming sessions"
                    sub="Accept a request to schedule."
                  />
                )}
              </div>

              <div>
                <SectionHeader
                  icon={<CheckCircle2 size={15} />}
                  label="Past Sessions"
                  accent="#16A34A"
                />
                {past.length > 0 ? (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {past.map((s) => (
                      <SessionCard key={s._id} session={s} role="mentor" onAction={handleAction} />
                    ))}
                  </div>
                ) : (
                  <EmptyBox
                    icon={<TrendingUp size={32} />}
                    title="No past sessions"
                    sub="Completed sessions will appear here."
                  />
                )}
              </div>
            </div>
          )}

          {/* Achievements */}
          {activeTab === 'achievements' && (
            <div style={{ display: 'grid', gap: 24, animation: 'fadeUp .25s ease' }}>
              {/* Badges */}
              <Card
                title="Badges Earned"
                sub="Achievements from your student journey"
                icon={<Shield size={18} />}
              >
                {badges.length > 0 ? (
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                    {badges.map((b: Record<string, unknown>) => (
                      <div
                        key={b._id}
                        className="mdb-badge"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 9,
                          padding: '9px 14px',
                          borderRadius: 999,
                          background: `${C.accent}0D`,
                          border: `1px solid ${C.accent}30`,
                          transition: 'transform 0.18s',
                          cursor: 'default',
                        }}
                      >
                        <span style={{ fontSize: 18 }}>{b.badgeIcon}</span>
                        <div>
                          <div style={{ fontSize: 13, fontWeight: 700, color: C.accent }}>
                            {b.badgeName}
                          </div>
                          <div style={{ fontSize: 11, color: C.muted }}>
                            {new Date(b.awardedAt).toLocaleDateString('en-US', {
                              month: 'short',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBox
                    icon={<Shield size={32} />}
                    title="No badges yet"
                    sub="Badges earned during your student life will appear here."
                  />
                )}
              </Card>

              {/* Formal Endorsements */}
              <Card
                title="Formal Endorsements"
                sub="Employer recommendations from your career history"
                icon={<Award size={18} />}
              >
                {endorsements.length > 0 ? (
                  <div style={{ display: 'grid', gap: 14 }}>
                    {endorsements.map((e: Record<string, unknown>) => (
                      <div
                        key={e._id}
                        className="mdb-endorse"
                        style={{
                          background: '#F8FAFC',
                          border: `1px solid ${C.border}`,
                          borderRadius: 14,
                          padding: '18px 20px',
                          transition: 'border-color 0.18s',
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 10,
                            marginBottom: 10,
                          }}
                        >
                          <div
                            style={{
                              width: 34,
                              height: 34,
                              borderRadius: '50%',
                              background: `linear-gradient(135deg,${C.accent},${C.accent2})`,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              color: '#FFF',
                              flexShrink: 0,
                            }}
                          >
                            {(e.reviewerId?.name ?? 'E')[0].toUpperCase()}
                          </div>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: C.text }}>
                              {e.reviewerId?.name ?? 'Employer'}
                            </div>
                            <span
                              style={{
                                fontSize: 11,
                                background: '#DCFCE7',
                                color: '#16A34A',
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 4,
                              }}
                            >
                              <Award size={9} /> FORMAL ENDORSEMENT
                            </span>
                          </div>
                        </div>
                        {e.recommendationText && (
                          <p
                            style={{
                              margin: '0 0 10px',
                              fontSize: 14,
                              color: C.textSub,
                              lineHeight: 1.65,
                              fontStyle: 'italic',
                            }}
                          >
                            &ldquo;{e.recommendationText}&rdquo;
                          </p>
                        )}
                        <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                          {[
                            { label: 'Professionalism', val: e.professionalismRating },
                            { label: 'Work Quality', val: e.workQualityRating },
                            { label: 'Punctuality', val: e.punctualityRating },
                          ]
                            .filter((r) => r.val)
                            .map((r) => (
                              <div
                                key={r.label}
                                style={{
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4,
                                  fontSize: 12,
                                  color: C.muted,
                                }}
                              >
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    size={10}
                                    fill={i < r.val ? '#FBBF24' : 'none'}
                                    color={i < r.val ? '#FBBF24' : C.border}
                                  />
                                ))}
                                <span style={{ marginLeft: 3 }}>{r.label}</span>
                              </div>
                            ))}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyBox
                    icon={<Award size={32} />}
                    title="No formal endorsements yet"
                    sub="Employer endorsements from hired positions will appear here."
                  />
                )}
              </Card>
            </div>
          )}

          {/* Edit Profile */}
          {activeTab === 'profile' && (
            <div style={{ maxWidth: 800, margin: '0 auto', animation: 'fadeUp .25s ease' }}>
              <div
                style={{
                  background: C.cardBg,
                  border: `1px solid ${C.border}`,
                  borderRadius: 20,
                  padding: 32,
                  boxShadow: '0 2px 12px rgba(30,41,59,.06)',
                }}
              >
                <MentorProfileForm initialData={mentor} isEdit={true} />
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ── Sub-components ── */
function Card({
  title,
  sub,
  icon,
  children,
}: {
  title: string;
  sub: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: 20,
        padding: 28,
        boxShadow: '0 2px 12px rgba(30,41,59,.06)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          marginBottom: 20,
          paddingBottom: 16,
          borderBottom: '1px solid #E2E8F0',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            background: '#EFF6FF',
            color: '#2563EB',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </div>
        <div>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: '#1E293B' }}>{title}</h2>
          <p style={{ margin: 0, fontSize: 12, color: '#64748B' }}>{sub}</p>
        </div>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({
  icon,
  label,
  count,
  accent,
}: {
  icon: React.ReactNode;
  label: string;
  count?: number;
  accent: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 14,
        paddingBottom: 10,
        borderBottom: '2px solid #E2E8F0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 7 }}>
        <span style={{ color: accent }}>{icon}</span>
        <span style={{ fontSize: 15, fontWeight: 800, color: '#1E293B' }}>{label}</span>
      </div>
      {count != null && count > 0 && (
        <span
          style={{
            background: accent,
            color: '#FFF',
            fontSize: 11,
            fontWeight: 800,
            padding: '2px 10px',
            borderRadius: 999,
          }}
        >
          {count}
        </span>
      )}
    </div>
  );
}

function EmptyBox({ icon, title, sub }: { icon: React.ReactNode; title: string; sub: string }) {
  return (
    <div
      style={{
        background: '#F8FAFC',
        border: '1.5px dashed #E2E8F0',
        borderRadius: 14,
        padding: '28px 20px',
        textAlign: 'center',
        marginBottom: 28,
      }}
    >
      <div style={{ color: '#CBD5E1', marginBottom: 10 }}>{icon}</div>
      <p style={{ margin: '0 0 4px', fontSize: 13, fontWeight: 700, color: '#64748B' }}>{title}</p>
      <p style={{ margin: 0, fontSize: 12, color: '#94A3B8' }}>{sub}</p>
    </div>
  );
}

/* Wrap in Suspense because useSearchParams requires it in Next.js App Router */
export default function MentorDashboardPage() {
  return (
    <Suspense
      fallback={
        <div
          style={{
            minHeight: '100vh',
            background: '#F8FAFC',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <p style={{ color: '#94A3B8', fontWeight: 600 }}>Loading…</p>
        </div>
      }
    >
      <MentorDashboard />
    </Suspense>
  );
}
