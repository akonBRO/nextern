import type { ReactNode } from 'react';
import { requireRole } from '@/lib/require-role';

export default async function StudentLayout({ children }: { children: ReactNode }) {
  await requireRole('student');
  return children;
}
