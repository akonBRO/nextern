import { auth } from '@/lib/auth';
import DeptHeadProvisionPageClient from '@/components/academic/DeptHeadProvisionPageClient';

export default async function AdminDeptHeadsPage() {
  const session = await auth();

  return (
    <DeptHeadProvisionPageClient
      currentUser={{
        name: session?.user?.name ?? 'Superadmin',
        email: session?.user?.email ?? 'admin@nextern.app',
      }}
    />
  );
}
