'use client';

import { useCurrentUser } from './useCurrentUser';

export function useEmailVerified() {
  const { user, loading } = useCurrentUser();

  return { isVerified: Boolean(user?.emailVerifiedAt), loading };
}
