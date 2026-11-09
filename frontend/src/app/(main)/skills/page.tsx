'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Suspense } from 'react';
import { Skills } from '@/features/skills/components/Skills';

export default function SkillsPage() {
  const { user } = useCurrentUser();

  if (!user) return null;

  return user.role === 'ADMIN' ? (
    <Suspense>
      <Skills />
    </Suspense>
  ) : (
    <h1>User skills</h1>
  );
}
