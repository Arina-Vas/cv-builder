import { getTranslations } from 'next-intl/server';
import type { ReactNode } from 'react';

import { Tabs } from '@/shared/components/tabs';

interface CvDetailsLayoutProps {
  children: ReactNode;
  params: Promise<{ cvId: string }>;
}

export default async function CvDetailsLayout({ children, params }: CvDetailsLayoutProps) {
  const { cvId } = await params;
  const t = await getTranslations('cvs.tabs');
  const base = `/cvs/${cvId}`;

  const items = [
    { href: `${base}/details`, label: t('details') },
    { href: `${base}/skills`, label: t('skills') },
    { href: `${base}/projects`, label: t('projects') },
    { href: `${base}/preview`, label: t('preview') },
  ];

  return (
    <Tabs items={items} label={t('label')}>
      {children}
    </Tabs>
  );
}
