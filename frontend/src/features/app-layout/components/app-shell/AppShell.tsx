import type { ReactNode } from 'react';
import { AppBreadcrumbs } from '@/features/breadcrumbs/components/app-breadcrumbs/AppBreadcrumbs';
import { Sidebar } from '../sidebar/Sidebar';
import s from './AppShell.module.css';

interface AppShellProps {
  defaultCollapsed: boolean;
  children: ReactNode;
}

export function AppShell({ defaultCollapsed, children }: AppShellProps) {
  return (
    <div className={s.root}>
      <Sidebar defaultCollapsed={defaultCollapsed} />
      <main className={s.main}>
        <header className={s.header}>
          <AppBreadcrumbs />
        </header>
        {children}
      </main>
    </div>
  );
}
