import type { ReactNode } from 'react';
import mongoose from 'mongoose';
import { requireRole } from '@/lib/require-role';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import StudentPageShell from '@/components/student/StudentPageShell';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  const session = await requireRole('student');
  await connectDB();

  const userId = session.user.id;
  const oid = new mongoose.Types.ObjectId(userId);

  const [student, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(oid).select('name email image opportunityScore profileCompleteness').lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  const user = {
    name: student?.name ?? 'Student',
    email: student?.email ?? '',
    image: student?.image ?? undefined,
    userId: session.user.id,
    role: session.user.role,
    opportunityScore: student?.opportunityScore ?? 0,
    profileCompleteness: student?.profileCompleteness ?? 0,
    unreadNotifications: unreadNotifications ?? 0,
    unreadMessages: unreadMessages ?? 0,
  };

  return <StudentPageShell user={user}>{children}</StudentPageShell>;
}
