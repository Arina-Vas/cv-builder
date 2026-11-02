import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Tabs } from '@/shared/components/tabs';

interface UserDetailsLayoutProps {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function UserDetailsLayout({ children, params }: UserDetailsLayoutProps) {
  const { userId } = await params;
  const t = await getTranslations('users.tabs');
  const base = `/users/${userId}`;

  const items = [
    { href: `${base}/profile`, label: t('profile') },
    { href: `${base}/skills`, label: t('skills') },
    { href: `${base}/languages`, label: t('languages') },
    { href: `${base}/cvs`, label: t('cvs') },
  ];

  return (
    <Tabs items={items} label={t('label')}>
      {children}
    </Tabs>
  );
}
