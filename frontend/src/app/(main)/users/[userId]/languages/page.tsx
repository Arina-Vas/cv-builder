'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { UserLanguages } from '@/features/languages/user-languages/components/UserLanguages';
import { useParams } from 'next/navigation';

export default function UserLanguagesPage() {
  const { user } = useCurrentUser();
  const { userId } = useParams<{ userId: string }>();

  if (!user) return null;

  return <UserLanguages userId={userId} canEdit={user.role === 'ADMIN' || user.id === userId} />;
}
