import DepartmentHeadShell from '@/components/dept/DepartmentHeadShell';
import DeptProfilePageClient from '@/components/dept/DeptProfilePageClient';

export default async function DeptProfilePage() {
  return (
    <DepartmentHeadShell>
      <DeptProfilePageClient />
    </DepartmentHeadShell>
  );
}
