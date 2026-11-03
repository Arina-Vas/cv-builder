'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';

import { Tabs } from '@/shared/components/tabs';

import { AuthRoute } from '../../auth.constants';

const TABS = [
  { href: AuthRoute.signIn, label: 'signIn' },
  { href: AuthRoute.signUp, label: 'signUp' },
] as const;

export function AuthTabs({ children }: { children: ReactNode }) {
  const t = useTranslations('auth.tabs');
  const items = TABS.map(({ href, label }) => ({ href, label: t(label) }));

  return (
    <Tabs items={items} label={t('label')} align="center">
      {children}
    </Tabs>
  );
}
