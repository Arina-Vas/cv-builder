'use client';

import { Button } from '@/shared/components/buttons';
import { useLogout } from '../../hooks/useLogout';

export function LogoutButton() {
  const { logout, loading } = useLogout();

  return (
    <Button variant="secondary" loading={loading} onClick={logout}>
      LOGOUT
    </Button>
  );
}
