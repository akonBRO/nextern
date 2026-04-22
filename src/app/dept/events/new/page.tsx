import DepartmentHeadShell from '@/components/dept/DepartmentHeadShell';
import DeptEventCreatePageClient from '@/components/dept/DeptEventCreatePageClient';

export default async function NewDeptEventPage() {
  return (
    <DepartmentHeadShell>
      <DeptEventCreatePageClient />
    </DepartmentHeadShell>
  );
}
