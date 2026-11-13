'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useParams } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { UserSkills } from '@/features/skills/user-skills/components/UserSkills';

export default function UserSkillsPage() {
  const { user } = useCurrentUser();
  const { userId } = useParams<{ userId: string }>();
  const t = useTranslations('userSkill');

  if (!user) return null;

  return (
    <UserSkills
      userId={userId}
      canEdit={user.role === 'ADMIN' || user.id === userId}
      emptyMessage={t('emptyProfile')}
    />
  );
}
