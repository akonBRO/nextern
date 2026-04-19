import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getStudentAcademicFeedback } from '@/lib/academic-feedback';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import { getStudentDashboardData } from '@/lib/student-dashboard';
import { getUpcomingCalendarEvents } from '@/lib/calendar-events';
import { getAdvisorDashboardData } from '@/lib/role-dashboard';
import { canTeacherAccessStudent, resolveTeacherScope } from '@/lib/opportunity-recommendations';
import { ADVISOR_NAV_ITEMS } from '@/lib/advisor-navigation';
import DashboardClient from '@/app/student/dashboard/DashboardClient';

export const metadata: Metadata = {
  title: 'Student Dashboard Preview',
  description: 'Advisor view of a scoped student dashboard',
};

type Params = Promise<{ studentId: string }>;

export default async function AdvisorStudentDashboardPreviewPage({ params }: { params: Params }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'advisor') {
    redirect('/login');
  }

  const { studentId } = await params;
  const scope = await resolveTeacherScope(session.user.id, 'advisor');
  const hasAccess = await canTeacherAccessStudent(scope, studentId);
  if (!hasAccess) {
    redirect('/advisor/recommendations');
  }

  const [data, chromeData] = await Promise.all([
    getStudentDashboardData(studentId),
    getAdvisorDashboardData({
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
    console.error('[ADVISOR STUDENT DASHBOARD PREVIEW CALENDAR ERROR]', error);
  }

  return (
    <DashboardClient
      data={data}
      userId={studentId}
      calendarEvents={calendarEvents}
      isCalendarConnected={isCalendarConnected}
      initialAcademicReviews={academicReviews}
      previewShell={{
        role: 'advisor',
        roleLabel: 'Advisor dashboard',
        homeHref: '/advisor/dashboard',
        navItems: ADVISOR_NAV_ITEMS,
        user: chromeData.chromeUser,
        browseHref: `/advisor/recommendations?studentId=${studentId}`,
        applicationsHref: `/advisor/recommendations?studentId=${studentId}`,
      }}
    />
  );
}
