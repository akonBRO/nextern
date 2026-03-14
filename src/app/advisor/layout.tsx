import type { ReactNode } from 'react';
import { requireRole } from '@/lib/require-role';

export default async function AdvisorLayout({ children }: { children: ReactNode }) {
  await requireRole('advisor');
  return children;
}
