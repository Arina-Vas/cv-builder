'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Suspense } from 'react';
import { Skills } from '@/features/skills/components/Skills';
import { useTranslations } from 'next-intl';
import { UserSkills } from '@/features/skills/user-skills/components/UserSkills';

export default function SkillsPage() {
  const { user } = useCurrentUser();
  const t = useTranslations('userSkill');

  if (!user) return null;

  return user.role === 'ADMIN' ? (
    <Suspense>
      <Skills />
    </Suspense>
  ) : (
    <UserSkills userId={user.id} canEdit emptyMessage={t('empty')} />
  );
}
