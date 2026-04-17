import { redirect } from 'next/navigation';
import TeacherRecommendationPage from '@/components/academic/TeacherRecommendationPage';
import { auth } from '@/lib/auth';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';
import { getTeacherRecommendationWorkspaceData } from '@/lib/opportunity-recommendations';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function AdvisorRecommendationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'advisor') {
    redirect('/login');
  }

  const params = await searchParams;
  const studentId = readParam(params.studentId);
  const data = await getTeacherRecommendationWorkspaceData({
    viewerId: session.user.id,
    role: 'advisor',
    studentId: studentId || undefined,
  });

  return (
    <TeacherRecommendationPage
      role="advisor"
      shellRole="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      pagePath="/advisor/recommendations"
      directoryHref="/advisor/students"
      insightsHref="/advisor/dashboard"
      dashboardBasePath="/advisor/students"
      navItems={ADVISOR_NAV_ITEMS}
      data={data}
    />
  );
}
