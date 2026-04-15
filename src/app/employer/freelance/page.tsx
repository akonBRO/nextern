import mongoose from 'mongoose';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage } from '@/components/dashboard/DashboardContent';
import FreelanceWorkspace from '@/components/freelance/FreelanceWorkspace';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getUsageSummary } from '@/lib/premium';
import { EMPLOYER_NAV_ITEMS } from '@/lib/employer-navigation';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';

async function getEmployerFreelancePageData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [employer, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(oid).select('name email image companyName industry isPremium').lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  return {
    employer,
    chrome: { unreadNotifications, unreadMessages },
  };
}

export default async function EmployerFreelancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'employer') redirect('/employer/dashboard');
  if (session.user.verificationStatus !== 'approved') redirect('/pending-approval');

  const [data, usage] = await Promise.all([
    getEmployerFreelancePageData(session.user.id),
    getUsageSummary(session.user.id),
  ]);

  if (!data.employer) redirect('/login');

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer dashboard"
      homeHref="/employer/dashboard"
      navItems={EMPLOYER_NAV_ITEMS}
      user={{
        name: data.employer.name,
        email: data.employer.email,
        image: data.employer.image,
        userId: session.user.id,
        subtitle: data.employer.companyName || 'Employer freelance workspace',
        isPremium: Boolean(usage.isPremium),
        unreadNotifications: data.chrome.unreadNotifications,
        unreadMessages: data.chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <FreelanceWorkspace role="employer" />
      </DashboardPage>
    </DashboardShell>
  );
}
