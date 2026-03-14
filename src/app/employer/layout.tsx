import type { ReactNode } from 'react';
import { requireRole } from '@/lib/require-role';

export default async function EmployerLayout({ children }: { children: ReactNode }) {
  await requireRole('employer');
  return children;
}
