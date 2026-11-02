import type { ReactNode } from 'react';
import { AppShell } from '@/features/app-layout/components/app-shell/AppShell';

export default function MainLayout({ children }: { children: ReactNode }) {
  return <AppShell>{children}</AppShell>;
}
