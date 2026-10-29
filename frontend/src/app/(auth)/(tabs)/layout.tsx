import type { ReactNode } from 'react';

import { AuthTabs } from '@/features/auth/components/auth-tabs/AuthTabs';

export default function AuthTabsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <AuthTabs />
      {children}
    </>
  );
}
