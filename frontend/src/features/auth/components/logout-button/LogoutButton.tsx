'use client';

import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/buttons';
import { useLogout } from '../../hooks/useLogout';

export function LogoutButton() {
  const { logout, loading } = useLogout();
  const t = useTranslations('auth');

  return (
    <Button variant="secondary" loading={loading} onClick={logout}>
      {t('logout')}
    </Button>
  );
}
