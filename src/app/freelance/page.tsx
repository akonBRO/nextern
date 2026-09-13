import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { getDefaultAuthenticatedRoute } from '@/lib/role-routing';
import { getFreelanceWorkspaceHref } from '@/lib/freelance-shared';

/** A single entry point lets the existing login flow resolve the buyer/seller role. */
export default async function FreelanceEntry({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const params = new URLSearchParams();
  for (const key of [
    'view',
    'search',
    'category',
    'skill',
    'minBudget',
    'maxBudget',
    'priceType',
    'maxDeliveryDays',
    'sort',
  ]) {
    if (typeof query[key] === 'string') params.set(key, query[key]);
  }
  const session = await auth();
  if (!session?.user) {
    const callback = `/freelance${params.size ? `?${params}` : ''}`;
    redirect(`/login?callbackUrl=${encodeURIComponent(callback)}`);
  }
  const defaultRoute = getDefaultAuthenticatedRoute(session.user);
  if (defaultRoute === '/pending-approval' || defaultRoute === '/setup-password')
    redirect(defaultRoute);
  if (session.user.role !== 'student' && session.user.role !== 'employer') redirect(defaultRoute);
  const allowed =
    session.user.role === 'student'
      ? ['board', 'services', 'clientOrders', 'freelancerOrders', 'finance']
      : ['board', 'clientOrders', 'finance'];
  if (!allowed.includes(params.get('view') ?? '')) params.set('view', 'board');
  redirect(`${getFreelanceWorkspaceHref(session.user.role)}?${params}`);
}
