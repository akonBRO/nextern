import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Subscription } from '@/models/Subscription';
import { Payment } from '@/models/Payment';
import { syncPremiumStatus } from '@/lib/premium';
import { STUDENT_NAV_ITEMS } from '@/lib/student-navigation';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage, DashboardSection } from '@/components/dashboard/DashboardContent';
import SubscriptionClient from './SubscriptionClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Subscription' };

export default async function StudentSubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'student') redirect('/login');

  await connectDB();
  const premiumStatus = await syncPremiumStatus(session.user.id);

  const subscription = await Subscription.findOne({
    userId: session.user.id,
    status: { $in: ['active', 'cancelled'] },
    endDate: { $gt: new Date() },
  })
    .sort({ endDate: -1 })
    .lean();

  const payments = await Payment.find({
    userId: session.user.id,
    type: 'subscription',
  })
    .sort({ createdAt: -1 })
    .limit(10)
    .select('-bkashPaymentId')
    .lean();

  const now = new Date();
  const daysLeft = subscription
    ? Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

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
        subtitle: session.user.email ?? '',
        isPremium: premiumStatus.isPremium,
        unreadNotifications: 0,
        unreadMessages: 0,
      }}
    >
      <DashboardPage>
        <DashboardSection
          title="Subscription & Billing"
          description="Manage your Nextern Premium subscription and view payment history."
        >
          <SubscriptionClient
            role="student"
            subscription={
              subscription ? JSON.parse(JSON.stringify({ ...subscription, daysLeft })) : null
            }
            payments={JSON.parse(JSON.stringify(payments))}
          />
        </DashboardSection>
      </DashboardPage>
    </DashboardShell>
  );
}
