import DepartmentHeadShell from '@/components/dept/DepartmentHeadShell';
import DeptEventEditPageClient from '@/components/dept/DeptEventEditPageClient';

export default async function EditDeptEventPage() {
  return (
    <DepartmentHeadShell>
      <DeptEventEditPageClient />
    </DepartmentHeadShell>
  );
}
