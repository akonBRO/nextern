import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage, DashboardSection, HeroCard } from '@/components/dashboard/DashboardContent';
import { BadgeDefinition, type IBadgeDefinition } from '@/models/BadgeDefinition';
import { BadgeAward } from '@/models/BadgeAward';
import { getEventCount } from '@/lib/badge-engine';
import { Trophy } from 'lucide-react';

const advisorNavItems = [
  {
    label: 'Overview',
    href: '/advisor/dashboard',
    icon: 'dashboard' as const,
  },
  {
    label: 'My Students',
    icon: 'users' as const,
    items: [
      {
        label: 'Attention queue',
        href: '/advisor/dashboard#students',
        description: 'Students that need immediate coaching or intervention.',
        icon: 'users' as const,
      },
      {
        label: 'Upcoming interviews',
        href: '/advisor/dashboard#interviews',
        description: 'Students with approaching interviews that may need support.',
        icon: 'calendar' as const,
      },
      {
        label: 'Skill gaps',
        href: '/advisor/dashboard#skills',
        description: 'Repeated hard-skill gaps across your advisee cohort.',
        icon: 'target' as const,
      },
    ],
  },
  {
    label: 'Events',
    icon: 'calendar' as const,
    items: [
      {
        label: 'Post Event',
        href: '/advisor/events/new',
        description: 'Publish a webinar or workshop for students.',
        icon: 'calendar' as const,
      },
      {
        label: 'My Events',
        href: '/advisor/events',
        description: 'View and manage all your posted events.',
        icon: 'file' as const,
      },
    ],
  },
  { label: 'Badges', href: '/advisor/badges', icon: 'shield' as const },
];

export default async function AdvisorBadgesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'advisor') redirect('/login');

  await connectDB();
  const userId = session.user.id;

  const definitions = await BadgeDefinition.find({
    category: 'advisor',
  }).lean();
  const earnedBadges = await BadgeAward.find({ userId }).select('badgeSlug awardedAt').lean();
  const earnedSlugs = new Set(
    earnedBadges.map((b: { badgeSlug: string; awardedAt?: Date }) => b.badgeSlug)
  );

  const progressList = await Promise.all(
    definitions.map(async (def: IBadgeDefinition & Record<string, unknown>) => {
      const isEarned = earnedSlugs.has(def.badgeSlug);
      let count = 0;

      if (isEarned) {
        count = def.thresholdValue;
      } else {
        try {
          count = await getEventCount(userId, def.triggerEvent, def as unknown as IBadgeDefinition);
          if (count >= def.thresholdValue) count = def.thresholdValue;
        } catch {}
      }

      return {
        definition: def,
        currentCount: count,
        threshold: def.thresholdValue,
        isEarned,
        progressPercentage: Math.min(100, Math.round((count / def.thresholdValue) * 100)),
        awardedAt: earnedBadges.find(
          (b: { badgeSlug: string; awardedAt?: Date }) => b.badgeSlug === def.badgeSlug
        )?.awardedAt,
      };
    })
  );

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor workspace"
      homeHref="/advisor/dashboard"
      navItems={advisorNavItems}
      user={{
        name: session.user.name ?? 'Advisor',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        subtitle: session.user.email ?? '',
        unreadNotifications: 0,
        unreadMessages: 0,
        userId: session.user.id,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Achievements"
          title="Advisor Badges"
          description="Earn recognition for your mentorship impact. These badges highlight your dedication to student success and career readiness guidance."
          actions={<div />}
          aside={
            <div
              style={{
                background: 'rgba(255,255,255,0.08)',
                borderRadius: 20,
                padding: 24,
                border: '1px solid rgba(255,255,255,0.14)',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Trophy size={32} color="#22D3EE" style={{ marginBottom: 12 }} />
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 900,
                  color: '#FFFFFF',
                  fontFamily: 'var(--font-display)',
                  lineHeight: 1,
                }}
              >
                {earnedSlugs.size}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: '#94A3B8',
                  fontWeight: 600,
                  marginTop: 4,
                }}
              >
                Badges Unlocked
              </div>
            </div>
          }
        />

        <DashboardSection
          title="Mentorship Milestones"
          description="Grow your impact by actively mentoring students and building your advisor reputation."
        >
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
              gap: 16,
            }}
          >
            {progressList.map(
              ({ definition: def, currentCount, threshold, isEarned, progressPercentage }) => {
                const bg = isEarned ? '#ECFDF5' : '#FFFFFF';
                const border = isEarned ? '#34D399' : '#E2E8F0';
                const titleColor = isEarned ? '#065F46' : '#1E293B';

                return (
                  <div
                    key={def.badgeSlug}
                    style={{
                      background: bg,
                      border: `2px solid ${border}`,
                      borderRadius: 18,
                      padding: 20,
                      position: 'relative',
                      overflow: 'hidden',
                    }}
                  >
                    {isEarned && (
                      <div
                        style={{
                          position: 'absolute',
                          top: 0,
                          right: 0,
                          padding: '6px 14px',
                          background: '#10B981',
                          color: '#FFF',
                          fontSize: 11,
                          fontWeight: 800,
                          borderBottomLeftRadius: 14,
                        }}
                      >
                        EARNED
                      </div>
                    )}

                    <div style={{ display: 'flex', gap: 16 }}>
                      <div
                        style={{
                          width: 64,
                          height: 64,
                          borderRadius: 16,
                          background: isEarned ? '#D1FAE5' : '#F1F5F9',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 32,
                          opacity: isEarned ? 1 : 0.4,
                          flexShrink: 0,
                        }}
                      >
                        {def.icon}
                      </div>

                      <div style={{ flex: 1 }}>
                        <div
                          style={{
                            fontSize: 16,
                            fontWeight: 800,
                            color: titleColor,
                          }}
                        >
                          {def.name}
                        </div>
                        <div
                          style={{
                            fontSize: 13,
                            color: '#64748B',
                            marginTop: 4,
                            lineHeight: 1.4,
                          }}
                        >
                          {def.description}
                        </div>
                      </div>
                    </div>

                    <div style={{ marginTop: 24 }}>
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: 8,
                          fontSize: 12,
                          fontWeight: 700,
                          color: isEarned ? '#059669' : '#94A3B8',
                        }}
                      >
                        <span>{def.criteria}</span>
                        <span>
                          {Math.min(currentCount, threshold)} / {threshold}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: isEarned ? '#A7F3D0' : '#F1F5F9',
                          borderRadius: 999,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${progressPercentage}%`,
                            background: isEarned ? '#059669' : '#CBD5E1',
                            borderRadius: 999,
                            transition: 'width 0.6s ease',
                          }}
                        />
                      </div>
                    </div>
                  </div>
                );
              }
            )}
          </div>
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
