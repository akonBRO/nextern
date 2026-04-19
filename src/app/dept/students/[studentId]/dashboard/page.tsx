import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStudentAcademicFeedback } from '@/lib/academic-feedback';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getStudentDashboardData } from '@/lib/student-dashboard';
import { getUpcomingCalendarEvents } from '@/lib/calendar-events';
import { getDeptDashboardData } from '@/lib/role-dashboard';
import { canTeacherAccessStudent, resolveTeacherScope } from '@/lib/opportunity-recommendations';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';
import DashboardClient from '@/app/student/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Student Dashboard Preview',
  description: 'Department-head view of a scoped student dashboard',
};

type Params = Promise<{ studentId: string }>;

export default async function DepartmentStudentDashboardPreviewPage({
  params,
}: {
  params: Params;
}) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'dept_head') {
    redirect('/login');
  }

  const { studentId } = await params;
  const scope = await resolveTeacherScope(session.user.id, 'dept_head');
  const hasAccess = await canTeacherAccessStudent(scope, studentId);
  if (!hasAccess) {
    redirect('/dept/recommendations');
  }

  const [data, chromeData] = await Promise.all([
    getStudentDashboardData(studentId),
    getDeptDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
  ]);

  let calendarEvents: Awaited<ReturnType<typeof getUpcomingCalendarEvents>> = [];
  let isCalendarConnected = false;
  let academicReviews: Awaited<ReturnType<typeof getStudentAcademicFeedback>>['reviews'] = [];

  try {
    await connectDB();
    const [events, calUser, feedback] = await Promise.all([
      getUpcomingCalendarEvents(studentId, 24),
      User.findById(studentId).select('googleCalendarConnected').lean(),
      getStudentAcademicFeedback(studentId),
    ]);
    calendarEvents = events;
    isCalendarConnected = calUser?.googleCalendarConnected ?? false;
    academicReviews = feedback.reviews;
  } catch (error) {
    console.error('[DEPT STUDENT DASHBOARD PREVIEW CALENDAR ERROR]', error);
  }

  return (
    <DashboardClient
      data={data}
      userId={studentId}
      calendarEvents={calendarEvents}
      isCalendarConnected={isCalendarConnected}
      initialAcademicReviews={academicReviews}
      previewShell={{
        role: 'departmentHead',
        roleLabel: 'Department dashboard',
        homeHref: '/dept/dashboard',
        navItems: DEPT_NAV_ITEMS,
        user: chromeData.chromeUser,
        browseHref: `/dept/recommendations?studentId=${studentId}`,
        applicationsHref: `/dept/recommendations?studentId=${studentId}`,
      }}
    />
  );
}
