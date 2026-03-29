import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage, DashboardSection, HeroCard } from '@/components/dashboard/DashboardContent';
import { BadgeDefinition, type IBadgeDefinition } from '@/models/BadgeDefinition';
import { BadgeAward } from '@/models/BadgeAward';
import { getEventCount } from '@/lib/badge-engine';
import { CheckCircle2, Trophy } from 'lucide-react';

const employerNavItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
  {
    label: 'Hiring',
    icon: 'briefcase' as const,
    items: [
      { label: 'Open roles', href: '/employer/dashboard#jobs', icon: 'briefcase' as const },
      { label: 'Pipeline', href: '/employer/dashboard#pipeline', icon: 'insights' as const },
      { label: 'Applications', href: '/employer/dashboard#applications', icon: 'file' as const },
    ],
  },
  {
    label: 'Talent',
    icon: 'users' as const,
    items: [
      { label: 'Top candidates', href: '/employer/dashboard#candidates', icon: 'sparkles' as const },
    ],
  },
  { label: 'Badges', href: '/employer/badges', icon: 'shield' as const },
];

export default async function EmployerBadgesPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  // Need to just make sure they are employer
  if (session.user.role !== 'company' && session.user.role !== 'employer') redirect('/login');

  await connectDB();
  const userId = session.user.id;

  const definitions = await BadgeDefinition.find({ category: 'employer' }).lean();
  const earnedBadges = await BadgeAward.find({ userId }).select('badgeSlug awardedAt').lean();
  const earnedSlugs = new Set(earnedBadges.map((b: any) => b.badgeSlug));

  const progressList = await Promise.all(
    definitions.map(async (def: any) => {
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
        awardedAt: earnedBadges.find((b: any) => b.badgeSlug === def.badgeSlug)?.awardedAt,
      };
    })
  );

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer workspace"
      homeHref="/employer/dashboard"
      navItems={employerNavItems}
      user={{
        name: session.user.name ?? 'Employer',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        subtitle: session.user.email ?? '',
        unreadNotifications: 0,
        unreadMessages: 0,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Company Profile"
          title="Employer Trust Badges"
          description="Earning these badges signals a responsive, active, and trusted hiring pipeline to students, significantly increasing your job listing visibility."
          actions={<div />}
          aside={
            <div style={{ background: 'rgba(255,255,255,0.08)', borderRadius: 20, padding: 24, border: '1px solid rgba(255,255,255,0.14)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Trophy size={32} color="#60A5FA" style={{ marginBottom: 12 }} />
                <div style={{ fontSize: 32, fontWeight: 900, color: '#FFFFFF', fontFamily: 'var(--font-display)', lineHeight: 1 }}>{earnedSlugs.size}</div>
                <div style={{ fontSize: 13, color: '#94A3B8', fontWeight: 600, marginTop: 4 }}>Badges Unlocked</div>
            </div>
          }
        />

        <DashboardSection
          title="Company Milestones"
          description="Build trust with top talent by actively engaging on the platform."
        >
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16 }}>
            {progressList.map(({ definition: def, currentCount, threshold, isEarned, progressPercentage }) => {
              const bg = isEarned ? '#F0FDF4' : '#FFFFFF';
              const border = isEarned ? '#4ADE80' : '#E2E8F0';
              const titleColor = isEarned ? '#14532D' : '#1E293B';
              
              return (
                <div key={def.badgeSlug} style={{ background: bg, border: `2px solid ${border}`, borderRadius: 18, padding: 20, position: 'relative', overflow: 'hidden' }}>
                  {isEarned && (
                    <div style={{ position: 'absolute', top: 0, right: 0, padding: '6px 14px', background: '#22C55E', color: '#FFF', fontSize: 11, fontWeight: 800, borderBottomLeftRadius: 14 }}>
                      EARNED
                    </div>
                  )}

                  <div style={{ display: 'flex', gap: 16 }}>
                    <div style={{ width: 64, height: 64, borderRadius: 16, background: isEarned ? '#DCFCE7' : '#F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, opacity: isEarned ? 1 : 0.4, flexShrink: 0 }}>
                      {def.icon}
                    </div>

                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 16, fontWeight: 800, color: titleColor }}>{def.name}</div>
                      <div style={{ fontSize: 13, color: '#64748B', marginTop: 4, lineHeight: 1.4 }}>{def.description}</div>
                    </div>
                  </div>

                  <div style={{ marginTop: 24 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8, fontSize: 12, fontWeight: 700, color: isEarned ? '#16A34A' : '#94A3B8' }}>
                       <span>{def.criteria}</span>
                       <span>{Math.min(currentCount, threshold)} / {threshold}</span>
                    </div>
                    <div style={{ height: 8, background: isEarned ? '#BBF7D0' : '#F1F5F9', borderRadius: 999, overflow: 'hidden' }}>
                        <div style={{ height: '100%', width: `${progressPercentage}%`, background: isEarned ? '#16A34A' : '#CBD5E1', borderRadius: 999, transition: 'width 0.6s ease' }} />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
