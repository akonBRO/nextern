import type { ReactNode } from 'react';
import mongoose from 'mongoose';
import { requireRole } from '@/lib/require-role';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import EmployerPageShell from '@/components/employer/EmployerPageShell';

export default async function EmployerLayout({ children }: { children: ReactNode }) {
  const session = await requireRole('employer');
  await connectDB();

  const userId = session.user.id;
  const oid = new mongoose.Types.ObjectId(userId);

  const [employer, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(oid).select('name email image companyName').lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  return (
    <EmployerPageShell
      user={{
        name: employer?.name ?? 'Employer',
        email: employer?.email ?? '',
        image: employer?.image ?? undefined,
        subtitle: employer?.companyName ?? 'Employer workspace',
        unreadNotifications: unreadNotifications ?? 0,
        unreadMessages: unreadMessages ?? 0,
        userId,
      }}
    >
      {children}
    </EmployerPageShell>
  );
}
