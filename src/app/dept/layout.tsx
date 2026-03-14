import type { ReactNode } from 'react';
import { requireRole } from '@/lib/require-role';

export default async function DeptLayout({ children }: { children: ReactNode }) {
  await requireRole('dept_head');
  return children;
}
