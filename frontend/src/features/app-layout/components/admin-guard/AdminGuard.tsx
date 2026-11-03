'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useRef, type ReactNode } from 'react';
import { AuthRoute } from '@/features/auth/auth.constants';
import { useCurrentUser } from '@/features/auth/hooks/useCurrentUser';
import { useToast } from '@/shared/components/toast/ToastProvider';

export function AdminGuard({ children }: { children: ReactNode }) {
  const t = useTranslations('layout');
  const router = useRouter();
  const toast = useToast();
  const { user } = useCurrentUser();
  const notified = useRef(false);

  const isAdmin = user?.role === 'ADMIN';
  const isForbidden = user !== null && !isAdmin;

  useEffect(() => {
    if (!isForbidden || notified.current) return;
    notified.current = true;
    toast.error(t('notAuthorized'));
    router.replace(AuthRoute.home);
  }, [isForbidden, router, t, toast]);

  return isAdmin ? children : null;
}
