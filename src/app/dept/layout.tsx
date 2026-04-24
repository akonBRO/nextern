import type { ReactNode } from 'react';
import mongoose from 'mongoose';
import { requireRole } from '@/lib/require-role';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import DeptPageShell from '@/components/dept/DeptPageShell';

export default async function DeptLayout({ children }: { children: ReactNode }) {
  const session = await requireRole('dept_head');
  await connectDB();

  const userId = session.user.id;
  const oid = new mongoose.Types.ObjectId(userId);

  const [deptHead, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(oid).select('name email image institutionName advisoryDepartment').lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  const subtitleParts = [deptHead?.advisoryDepartment, deptHead?.institutionName].filter(
    (value): value is string => Boolean(value)
  );

  return (
    <DeptPageShell
      user={{
        name: deptHead?.name ?? 'Department Head',
        email: deptHead?.email ?? '',
        image: deptHead?.image ?? undefined,
        subtitle: subtitleParts.join(' | ') || 'Department workspace',
        unreadNotifications: unreadNotifications ?? 0,
        unreadMessages: unreadMessages ?? 0,
        userId,
      }}
    >
      {children}
    </DeptPageShell>
  );
}
