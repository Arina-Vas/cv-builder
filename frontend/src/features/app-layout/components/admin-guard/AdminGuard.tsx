'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, type ReactNode } from 'react';
import { AuthRoute } from '@/features/auth/auth.constants';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { Button } from '@/shared/components/buttons';
import { useToast } from '@/shared/components/toast/ToastProvider';
import s from './AdminGuard.module.css';

export function AdminGuard({ children }: { children: ReactNode }) {
  const t = useTranslations('layout');
  const router = useRouter();
  const toast = useToast();
  const { user, loading, error, refetch } = useCurrentUser();
  const notified = useRef(false);

  const isAdmin = user?.role === 'ADMIN';
  const isForbidden = user !== null && !isAdmin;

  useEffect(() => {
    if (!isForbidden || notified.current) return;
    notified.current = true;
    toast.error(t('notAuthorized'));
    router.replace(AuthRoute.home);
  }, [isForbidden, router, t, toast]);

  if (isAdmin) return children;

  if (error && !user) {
    return (
      <div className={s.state} role="alert">
        <h1 className={s.title}>{t('accessCheck.title')}</h1>
        <p className={s.message}>{t('accessCheck.message')}</p>
        <Button variant="secondary" loading={loading} onClick={() => void refetch()}>
          {t('accessCheck.retry')}
        </Button>
      </div>
    );
  }

  if (!user && loading) {
    return (
      <div className={s.state} role="status" aria-label={t('accessCheck.loading')}>
        <span className={s.spinner} aria-hidden="true" />
      </div>
    );
  }

  return null;
}
