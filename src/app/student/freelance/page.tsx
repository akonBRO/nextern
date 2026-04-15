import mongoose from 'mongoose';
import { redirect } from 'next/navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage } from '@/components/dashboard/DashboardContent';
import FreelanceWorkspace from '@/components/freelance/FreelanceWorkspace';
import { auth } from '@/lib/auth';
import { connectDB } from '@/lib/db';
import { getUsageSummary } from '@/lib/premium';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';

async function getStudentFreelancePageData(userId: string) {
  await connectDB();
  const oid = new mongoose.Types.ObjectId(userId);

  const [student, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(oid).select('name email image university department isPremium').lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  return {
    student,
    chrome: { unreadNotifications, unreadMessages },
  };
}

export default async function StudentFreelancePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const [data, usage] = await Promise.all([
    getStudentFreelancePageData(session.user.id),
    getUsageSummary(session.user.id),
  ]);

  if (!data.student) redirect('/login');

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: data.student.name,
        email: data.student.email,
        image: data.student.image,
        userId: session.user.id,
        subtitle:
          [data.student.university, data.student.department].filter(Boolean).join(' | ') ||
          'Student freelance workspace',
        isPremium: Boolean(usage.isPremium),
        unreadNotifications: data.chrome.unreadNotifications,
        unreadMessages: data.chrome.unreadMessages,
      }}
    >
      <DashboardPage>
        <FreelanceWorkspace role="student" />
      </DashboardPage>
    </DashboardShell>
  );
}
