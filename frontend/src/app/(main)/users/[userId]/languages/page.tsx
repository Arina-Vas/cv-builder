'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { UserLanguages } from '@/features/languages/user-languages/components/UserLanguages';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function UserLanguagesPage() {
  const { user } = useCurrentUser();
  const { userId } = useParams<{ userId: string }>();
  const t = useTranslations('userLanguage');

  if (!user) return null;

  return (
    <UserLanguages
      userId={userId}
      canEdit={user.role === 'ADMIN' || user.id === userId}
      emptyMessage={t('emptyProfile')}
    />
  );
}
