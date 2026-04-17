import { auth } from '@/lib/auth';
import SuperAdminConsole from '@/components/admin/SuperAdminConsole';

export default async function AdminDashboardPage() {
  const session = await auth();

  return (
    <SuperAdminConsole
      currentUser={{
        name: session?.user?.name ?? 'Superadmin',
        email: session?.user?.email ?? 'admin@nextern.app',
      }}
    />
  );
}
