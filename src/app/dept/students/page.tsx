import { redirect } from 'next/navigation';
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
import { getDeptDashboardData } from '@/lib/role-dashboard';
import { DEPT_NAV_ITEMS } from '@/lib/dept-navigation';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function readParam(value: string | string[] | undefined) {
  return typeof value === 'string' ? value.trim() : '';
}

export default async function DeptStudentsPage({ searchParams }: { searchParams: SearchParams }) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== 'dept_head') {
    redirect('/login');
  }

  await connectDB();
  const params = await searchParams;
  const q = readParam(params.q);
  const studentId = readParam(params.studentId);
  const semester = readParam(params.semester);
  const department = readParam(params.department);
  const sort = readParam(params.sort) || 'score_desc';

  const deptHead = await User.findById(session.user.id).select('institutionName').lean();

  if (!deptHead?.institutionName) {
    redirect('/dept/profile');
  }

  const scopeQuery: Record<string, unknown> = {
    role: 'student',
    university: deptHead.institutionName,
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
    getDeptDashboardData({
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

  return (
    <DashboardShell
      role="departmentHead"
      roleLabel="Department dashboard"
      homeHref="/dept/dashboard"
      navItems={DEPT_NAV_ITEMS}
      user={{ ...data.chromeUser, userId: session.user.id }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="University student access"
          title="Review every student in your university scope"
          subtitle={
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Tag label={deptHead.institutionName} tone="info" />
              {data.department.advisoryDepartment ? (
                <Tag label={data.department.advisoryDepartment} tone="neutral" />
              ) : null}
            </div>
          }
          description="Department heads can search, filter, and monitor students with dedicated controls instead of relying on the dashboard alone."
          actions={<div />}
          aside={
            <Panel
              title="Scope reminder"
              description="This page covers your university-wide student access."
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 10 }}>
                <div style={{ color: '#E2E8F0', fontSize: 14, lineHeight: 1.7 }}>
                  Filter by semester name, student ID, department, or search terms.
                </div>
                <div style={{ color: '#9FB4D0', fontSize: 13, lineHeight: 1.7 }}>
                  Advisor-created features can be reviewed here without exposing department-only
                  tools to advisor accounts.
                </div>
              </div>
            </Panel>
          }
        />

        <DashboardSection
          title="Student directory"
          description="Dedicated page for university-scoped student filtering and review."
        >
          <StudentDirectory
            actionPath="/dept/students"
            title="Department head student directory"
            description="Search all students in your university using dedicated filters."
            scopeLabel={`${deptHead.institutionName} students`}
            students={normalizedStudents}
            departments={(departments as string[]).filter(Boolean).sort()}
            semesters={(semesters as string[]).filter(Boolean).sort()}
            filters={{ q, studentId, semester, department, sort }}
            emptyDescription="No students matched the current filters in your university scope."
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
