import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { InterviewSession } from '@/models/InterviewSession';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { syncPremiumStatus } from '@/lib/premium';
import DashboardShell from '@/components/dashboard/DashboardShell';
import {
  ActionLink,
  DashboardPage,
  DashboardSection,
  HeroCard,
  Panel,
} from '@/components/dashboard/DashboardContent';
import InterviewRoomClient from '@/components/hiring-suite/InterviewRoomClient';

async function getEmployerInterviewWorkspace(userId: string, interviewId: string) {
  await connectDB();

  const [employer, interview, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(userId).select('name email image companyName').lean(),
    InterviewSession.findOne({ _id: interviewId, employerId: userId })
      .populate('jobId', 'title companyName')
      .populate('studentId', 'name email university department')
      .lean(),
    Notification.countDocuments({ userId, isRead: false }),
    Message.countDocuments({ receiverId: userId, isRead: false }),
  ]);

  return {
    employer,
    interview,
    chrome: { unreadNotifications, unreadMessages },
  };
}

function formatDateTime(value?: Date | string | null) {
  if (!value) return 'Not scheduled';
  return new Intl.DateTimeFormat('en-BD', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(value));
}

export default async function EmployerInterviewDetailPage({
  params,
}: {
  params: Promise<{ interviewId: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');

  const { interviewId } = await params;
  const [data, premiumStatus] = await Promise.all([
    getEmployerInterviewWorkspace(session.user.id, interviewId),
    syncPremiumStatus(session.user.id),
  ]);

  if (!data.interview) redirect('/employer/interviews');

  const interview = data.interview;
  const job = interview.jobId as { title: string; companyName: string } | null;
  const student = interview.studentId as {
    name: string;
    email: string;
    university?: string;
    department?: string;
  } | null;

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={{
        name: data.employer?.name ?? 'Employer',
        email: data.employer?.email ?? '',
        image: data.employer?.image,
        subtitle: data.employer?.companyName ?? 'Employer workspace',
        userId: session.user.id,
        isPremium: premiumStatus.isPremium,
        unreadNotifications: data.chrome.unreadNotifications,
        unreadMessages: data.chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <HeroCard
          eyebrow="Interview Session"
          title={interview.title}
          description="Join the live room, share your screen when needed, capture notes, and complete the structured scorecard before finalizing the session."
          actions={
            <>
              <ActionLink href="/employer/interviews" label="Back to interviews" />
              <ActionLink href="/employer/assessments" label="Open assessments" tone="ghost" />
            </>
          }
          aside={
            <Panel
              title="Session overview"
              style={{
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.16)',
              }}
            >
              <div style={{ display: 'grid', gap: 12 }}>
                {[
                  { label: 'Candidate', value: student?.name ?? 'Candidate' },
                  { label: 'Role', value: job?.title ?? 'Role' },
                  { label: 'Scheduled', value: formatDateTime(interview.scheduledAt) },
                  { label: 'Recording consent', value: interview.consentStatus },
                ].map((item) => (
                  <div key={item.label}>
                    <div style={{ fontSize: 11, color: '#9FB4D0', fontWeight: 700 }}>
                      {item.label}
                    </div>
                    <div style={{ marginTop: 2, fontSize: 13, color: '#FFFFFF', fontWeight: 800 }}>
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>
            </Panel>
          }
        />

        <DashboardSection
          title="Interview Workspace"
          description="Use the room below for the live call, notes, scorecard, recording upload, and completion controls."
        >
          <InterviewRoomClient role="employer" interview={JSON.parse(JSON.stringify(interview))} />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
