import { redirect } from 'next/navigation';
import mongoose from 'mongoose';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { User } from '@/models/User';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
  Tag,
} from '@/components/dashboard/DashboardContent';
import StudentDirectory from '@/components/academic/StudentDirectory';
import { getAdvisorDashboardData } from '@/lib/role-dashboard';
import { getAdvisorNavItems } from '@/lib/academic-navigation';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function AdvisorStudentsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (
    !session?.user?.id ||
    (session.user.role !== 'advisor' && session.user.role !== 'dept_head')
  ) {
    redirect('/login');
  }

  await connectDB();
  const params = await searchParams;
  const q = readParam(params.q);
  const studentId = readParam(params.studentId);
  const semester = readParam(params.semester);
  const department = readParam(params.department);
  const sort = readParam(params.sort) || 'score_desc';

  const scopeUser = await User.findById(session.user.id).select('institutionName').lean();

  if (session.user.role === 'dept_head' && !scopeUser?.institutionName) {
    redirect('/dept/profile');
  }

  const scopeQuery: Record<string, unknown> =
    session.user.role === 'dept_head'
      ? { role: 'student', university: scopeUser?.institutionName }
      : {
          role: 'student',
          assignedAdvisorId: new mongoose.Types.ObjectId(session.user.id),
        };

  const query: Record<string, unknown> = { ...scopeQuery };
  if (q) {
    const regex = { $regex: q, $options: 'i' };
    query.$or = [{ name: regex }, { email: regex }, { department: regex }];
  }
  if (studentId) query.studentId = { $regex: studentId, $options: 'i' };
  if (semester) query.currentSemester = semester;
  if (department) query.department = department;

  const sortMap: Record<string, Record<string, 1 | -1>> = {
    score_desc: { opportunityScore: -1, name: 1 },
    profile_desc: { profileCompleteness: -1, name: 1 },
    cgpa_desc: { cgpa: -1, name: 1 },
    name_asc: { name: 1 },
    semester_asc: { currentSemester: 1, name: 1 },
  };

  const [data, students, departments, semesters] = await Promise.all([
    getAdvisorDashboardData({
      userId: session.user.id,
      email: session.user.email ?? undefined,
    }),
    User.find(query)
      .select(
        'name email university department studentId currentSemester yearOfStudy opportunityScore profileCompleteness cgpa'
      )
      .sort(sortMap[sort] ?? sortMap.score_desc)
      .lean(),
    User.distinct('department', scopeQuery),
    User.distinct('currentSemester', scopeQuery),
  ]);

  const normalizedStudents = students.map((student) => ({
    id: student._id.toString(),
    name: student.name,
    email: student.email,
    university: student.university,
    department: student.department,
    studentId: student.studentId,
    currentSemester: student.currentSemester,
    yearOfStudy: student.yearOfStudy,
    opportunityScore: student.opportunityScore ?? 0,
    profileCompleteness: student.profileCompleteness ?? 0,
    cgpa: student.cgpa,
  }));

  const scopeLabel =
    session.user.role === 'dept_head'
      ? `${scopeUser?.institutionName ?? 'University'} students`
      : 'Assigned advisees only';

  return (
    <DashboardShell
      role="advisor"
      roleLabel="Advisor dashboard"
      homeHref="/advisor/dashboard"
      navItems={getAdvisorNavItems()}
      user={data.chromeUser}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Student directory"
          title="Filter and review students"
          subtitle={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag label={scopeLabel} tone="info" />
              {data.advisor.institutionName ? (
                <Tag label={data.advisor.institutionName} tone="neutral" />
              ) : null}
            </div>
          }
          description="Search by name, student ID, semester, or department to quickly focus the students who need attention."
          actions={<div />}
          aside={
            <Panel
              title="Directory scope"
              description="Department heads inherit advisor visibility here while keeping their broader department workspace."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ color: '#E2E8F0', fontSize: 14, lineHeight: 1.7 }}>
                  {session.user.role === 'dept_head'
                    ? 'Viewing students across your university scope.'
                    : 'Viewing only students assigned to you as advisor.'}
                </div>
                <div style={{ color: '#9FB4D0', fontSize: 13, lineHeight: 1.7 }}>
                  Use dedicated filters instead of dashboard anchors for daily student work.
                </div>
              </div>
            </Panel>
          }
        />

        <DashboardSection
          title="Student filters"
          description="Dedicated filtering page for advisor-facing student access."
        >
          <StudentDirectory
            actionPath="/advisor/students"
            title="Advisor student directory"
            description="Filter your scoped students by semester, student ID, and academic details."
            scopeLabel={scopeLabel}
            students={normalizedStudents}
            departments={(departments as string[]).filter(Boolean).sort()}
            semesters={(semesters as string[]).filter(Boolean).sort()}
            filters={{ q, studentId, semester, department, sort }}
            emptyDescription="No students matched the current filters."
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
