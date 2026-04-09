// src/app/student/resume/page.tsx
// Resume Builder — server component shell that fetches session + chrome counts,
// then renders the client UI inside DashboardShell.

import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Notification } from '@/models/Notification';
import { Message } from '@/models/Message';
import { User } from '@/models/User';
import mongoose from 'mongoose';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import ResumeBuilderClient from './ResumeBuilderClient';

export default async function StudentResumePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  if (session.user.role !== 'student') redirect('/student/dashboard');

  const oid = new mongoose.Types.ObjectId(session.user.id);
  await connectDB();

  const [student, unreadNotifs, unreadMsgs] = await Promise.all([
    User.findById(oid).select('name email image university department').lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  return (
    <DashboardShell
      role="student"
      roleLabel="Student dashboard"
      homeHref="/student/dashboard"
      navItems={STUDENT_NAV_ITEMS}
      user={{
        name: student?.name ?? 'Student',
        email: student?.email ?? '',
        image: student?.image,
        subtitle:
          [student?.university, student?.department].filter(Boolean).join(' | ') ||
          'Student workspace',
        unreadNotifications: unreadNotifs,
        unreadMessages: unreadMsgs,
      }}
    >
      <ResumeBuilderClient />
    </DashboardShell>
  );
}
