import type { ReactNode } from 'react';
import { AdminGuard } from '@/features/app-layout/components/admin-guard/AdminGuard';

export default function UserCvsLayout({ children }: { children: ReactNode }) {
  return <AdminGuard>{children}</AdminGuard>;
}
