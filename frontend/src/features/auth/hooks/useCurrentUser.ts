'use client';

import { useQuery } from '@apollo/client/react';
import { ME } from '../api/auth.operations';

export function useCurrentUser() {
  const { data, loading, error, refetch } = useQuery(ME, { ssr: false });

  return { user: data?.me ?? null, loading, error, refetch };
}
