import { cookies } from 'next/headers';
import type { ReactNode } from 'react';
import { AppShell } from '@/features/app-layout/components/app-shell/AppShell';
import { SIDEBAR_COOKIE } from '@/features/app-layout/sidebar.constants';

export default async function MainLayout({ children }: { children: ReactNode }) {
  const sidebarCollapsed = (await cookies()).get(SIDEBAR_COOKIE)?.value === 'true';

  return <AppShell defaultCollapsed={sidebarCollapsed}>{children}</AppShell>;
}
