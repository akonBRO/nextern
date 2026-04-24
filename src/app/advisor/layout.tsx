import type { ReactNode } from 'react';
import mongoose from 'mongoose';
import { requireRole } from '@/lib/require-role';
import { connectDB } from '@/lib/db';
import { Message } from '@/models/Message';
import { Notification } from '@/models/Notification';
import { User } from '@/models/User';
import AdvisorPageShell from '@/components/advisor/AdvisorPageShell';

export default async function AdvisorLayout({ children }: { children: ReactNode }) {
  const session = await requireRole('advisor');
  await connectDB();

  const userId = session.user.id;
  const oid = new mongoose.Types.ObjectId(userId);

  const [advisor, unreadNotifications, unreadMessages] = await Promise.all([
    User.findById(oid).select('name email image institutionName advisoryDepartment').lean(),
    Notification.countDocuments({ userId: oid, isRead: false }),
    Message.countDocuments({ receiverId: oid, isRead: false }),
  ]);

  const isDeptHead = session.user.role === 'dept_head';
  const subtitleParts = [advisor?.advisoryDepartment, advisor?.institutionName].filter(
    (value): value is string => Boolean(value)
  );

  return (
    <AdvisorPageShell
      role={isDeptHead ? 'departmentHead' : 'advisor'}
      roleLabel={isDeptHead ? 'Department dashboard' : 'Advisor dashboard'}
      homeHref={isDeptHead ? '/dept/dashboard' : '/advisor/dashboard'}
      user={{
        name: advisor?.name ?? (isDeptHead ? 'Department Head' : 'Advisor'),
        email: advisor?.email ?? '',
        image: advisor?.image ?? undefined,
        subtitle:
          subtitleParts.join(' | ') || (isDeptHead ? 'Department workspace' : 'Advisor workspace'),
        unreadNotifications: unreadNotifications ?? 0,
        unreadMessages: unreadMessages ?? 0,
        userId,
      }}
    >
      {children}
    </AdvisorPageShell>
  );
}
