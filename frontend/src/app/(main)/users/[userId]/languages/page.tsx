'use client';

import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { UserLanguages } from '@/features/languages/user-languages/components/UserLanguages';
import { useParams } from 'next/navigation';

export default function UserLanguagesPage() {
  const { user } = useCurrentUser();
  const { userId } = useParams();

  if (!user) return null;

  return <UserLanguages userId={user.id} canEdit={user.id === userId} />;
}
