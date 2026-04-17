import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  HeroCard,
  Tag,
} from '@/components/dashboard/DashboardContent';
import EmployerRecommendationRequestsClient from '@/components/employer/EmployerRecommendationRequestsClient';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { getEmployerDashboardData } from '@/lib/role-dashboard';
import { getEmployerRecommendationRequests } from '@/lib/employer-recommendation-requests';

export default async function EmployerRecommendationsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const [data, recommendationData] = await Promise.all([
    getEmployerDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
    getEmployerRecommendationRequests(session.user.id),
  ]);

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Academic endorsements"
          title="Recommendation requests"
          subtitle={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag label={`${recommendationData.summary.pending} pending`} tone="info" />
              <Tag label={`${recommendationData.summary.accepted} accepted`} tone="success" />
              <Tag label={`${recommendationData.summary.hold} on hold`} tone="warning" />
            </div>
          }
          description="Review student endorsements submitted by advisors and department heads for your active jobs. Respond with a clear hiring signal so the academic side knows how you want to proceed."
        />

        <DashboardSection
          title="Employer decision workspace"
          description="Each request is tied to a real platform job under your company. Update the status to accept, reject, or place the request on hold."
        >
          <EmployerRecommendationRequestsClient requests={recommendationData.requests} />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
