'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Suspense } from 'react';
import { Languages } from '@/features/languages/components/Languages';
import { UserLanguages } from '@/features/languages/user-languages/components/UserLanguages';
import { useTranslations } from 'next-intl';

export default function LanguagesPage() {
  const { user } = useCurrentUser();
  const t = useTranslations('userLanguage');

  if (!user) return null;

  return user.role === 'ADMIN' ? (
    <Suspense>
      <Languages />
    </Suspense>
  ) : (
    <UserLanguages userId={user.id} canEdit emptyMessage={t('empty')} />
  );
}
