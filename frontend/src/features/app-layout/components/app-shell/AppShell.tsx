import type { ReactNode } from 'react';
import { Sidebar } from '../sidebar/Sidebar';
import s from './AppShell.module.css';

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <div className={s.root}>
      <Sidebar />
      <main className={s.main}>{children}</main>
    </div>
  );
}
