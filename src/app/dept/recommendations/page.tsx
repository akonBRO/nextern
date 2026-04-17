import { redirect } from 'next/navigation';
import TeacherRecommendationPage from '@/components/academic/TeacherRecommendationPage';
import { auth } from '@/lib/auth';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';
import { getTeacherRecommendationWorkspaceData } from '@/lib/opportunity-recommendations';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function DepartmentRecommendationsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'dept_head') {
    redirect('/login');
  }

  const params = await searchParams;
  const studentId = readParam(params.studentId);
  const data = await getTeacherRecommendationWorkspaceData({
    viewerId: session.user.id,
    role: 'dept_head',
    studentId: studentId || undefined,
  });

  return (
    <TeacherRecommendationPage
      role="dept_head"
      shellRole="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      pagePath="/dept/recommendations"
      directoryHref="/dept/students"
      insightsHref="/dept/report"
      dashboardBasePath="/dept/students"
      navItems={DEPT_NAV_ITEMS}
      data={data}
    />
  );
}
