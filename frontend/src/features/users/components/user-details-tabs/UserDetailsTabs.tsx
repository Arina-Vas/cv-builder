'use client';

import { useTranslations } from 'next-intl';
import type { ReactNode } from 'react';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Tabs } from '@/shared/components/tabs';

interface UserDetailsTabsProps {
  userId: string;
  children: ReactNode;
}

export function UserDetailsTabs({ userId, children }: UserDetailsTabsProps) {
  const t = useTranslations('users.tabs');
  const { user } = useCurrentUser();
  const base = `/users/${userId}`;

  const items = [
    { href: `${base}/profile`, label: t('profile') },
    { href: `${base}/skills`, label: t('skills') },
    { href: `${base}/languages`, label: t('languages') },
    ...(user?.role === 'ADMIN' ? [{ href: `${base}/cvs`, label: t('cvs') }] : []),
  ];

  return (
    <Tabs items={items} label={t('label')}>
      {children}
    </Tabs>
  );
}
