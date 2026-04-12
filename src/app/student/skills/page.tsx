import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Application } from '@/models/Application';
import { Job } from '@/models/Job';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { buildUnknownAIMeta } from '@/lib/ai-meta';
import { getUsageSummary } from '@/lib/premium';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage, DashboardSection } from '@/components/dashboard/DashboardContent';
import SkillsHubClient from './SkillsHubClient';

export default async function StudentSkillsPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'student') redirect('/login');

  await connectDB();

  const [usage, applications, unreadNotifications, unreadMessages] = await Promise.all([
    getUsageSummary(session.user.id),
    Application.find({
      studentId: session.user.id,
      fitScoreComputedAt: { $exists: true },
    })
      .sort({ fitScoreComputedAt: -1 })
      .limit(8)
      .lean(),
    Notification.countDocuments({ userId: session.user.id, isRead: false }),
    Message.countDocuments({ receiverId: session.user.id, isRead: false }),
  ]);

  const jobs = applications.length
    ? await Job.find({ _id: { $in: applications.map((item) => item.jobId) } })
        .select('title companyName')
        .lean()
    : [];

  const jobsMap = new Map(jobs.map((job) => [job._id.toString(), job]));

  const analyses = applications.map((application) => ({
    applicationId: application._id.toString(),
    jobId: application.jobId.toString(),
    jobTitle: jobsMap.get(application.jobId.toString())?.title ?? 'Unknown role',
    companyName: jobsMap.get(application.jobId.toString())?.companyName ?? 'Unknown company',
    fitScore: application.fitScore ?? 0,
    hardGaps: application.hardGaps ?? [],
    softGaps: application.softGaps ?? [],
    metRequirements: application.metRequirements ?? [],
    suggestedPath: application.suggestedPath ?? [],
    summary: application.fitSummary ?? '',
    analyzedAt:
      application.fitScoreComputedAt?.toISOString() ?? application.updatedAt?.toISOString(),
    meta: application.fitAnalysisMeta ?? buildUnknownAIMeta('gemini'),
  }));

  return (
    <DashboardShell
      role="student"
      roleLabel="Student"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: session.user.name ?? 'Student',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        userId: session.user.id,
        subtitle: session.user.email ?? '',
        isPremium: usage.isPremium,
        unreadNotifications,
        unreadMessages,
      }}
    >
      <DashboardPage>
        <DashboardSection
          title="AI Skill Lab"
          description="Review your fit analyses, generate Premium training paths, and ask for targeted career advice."
        >
          <SkillsHubClient analyses={analyses} usage={JSON.parse(JSON.stringify(usage))} />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
