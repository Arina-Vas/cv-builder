'use client';

import { useApolloClient, useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';

import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';

import { LOGOUT } from '../api/auth.operations';
import { AuthRoute } from '../auth.constants';

export function useLogout() {
  const router = useRouter();
  const client = useApolloClient();
  // a failed logout is ignored on purpose (the user leaves anyway), so no toast either
  const [logout, { loading }] = useMutation(LOGOUT, { context: NO_ERROR_TOAST });

  const handleLogout = async () => {
    await logout().catch(() => undefined);
    await client.clearStore();
    router.replace(AuthRoute.signIn);
  };

  return { logout: handleLogout, loading };
}
