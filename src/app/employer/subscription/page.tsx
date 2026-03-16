import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { connectDB } from '@/lib/db';
import { Subscription } from '@/models/Subscription';
import { Payment } from '@/models/Payment';
import { syncPremiumStatus } from '@/lib/premium';
import DashboardShell from '@/components/dashboard/DashboardShell';
import { DashboardPage, DashboardSection } from '@/components/dashboard/DashboardContent';
import SubscriptionClient from '@/app/student/subscription/SubscriptionClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Employer Subscription' };

const navItems = [
  { label: 'Overview', href: '/employer/dashboard', icon: 'dashboard' as const },
  { label: 'Job Listings', href: '/employer/jobs', icon: 'briefcase' as const },
  { label: 'Premium', href: '/employer/premium', icon: 'shield' as const },
];

export default async function EmployerSubscriptionPage() {
  const session = await auth();
  if (!session?.user) redirect('/login');
  if (session.user.role !== 'employer') redirect('/login');

  await connectDB();
  await syncPremiumStatus(session.user.id);

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
    .select('-bkashPaymentId -stripePaymentIntentId')
    .lean();

  const now = new Date();
  const daysLeft = subscription
    ? Math.ceil((new Date(subscription.endDate).getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
    : 0;

  return (
    <DashboardShell
      role="employer"
      roleLabel="Employer"
      homeHref="/employer/dashboard"
      navItems={navItems}
      user={{
        name: session.user.name ?? 'Employer',
        email: session.user.email ?? '',
        image: session.user.image ?? undefined,
        subtitle: session.user.email ?? '',
        unreadNotifications: 0,
        unreadMessages: 0,
      }}
    >
      <DashboardPage>
        <DashboardSection
          title="Subscription & Billing"
          description="Manage your employer premium billing and payment history."
        >
          <SubscriptionClient
            role="employer"
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
