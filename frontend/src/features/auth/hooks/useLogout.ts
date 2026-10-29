'use client';

import { useApolloClient, useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';

import { LOGOUT } from '../api/auth.operations';
import { AuthRoute } from '../auth.constants';

export function useLogout() {
  const router = useRouter();
  const client = useApolloClient();
  const [logout, { loading }] = useMutation(LOGOUT);

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    await client.clearStore();
    router.replace(AuthRoute.signIn);
  };

  return { logout: handleLogout, loading };
}
