'use client';

import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { useEmailVerified } from './useEmailVerified';

/**
 * UX gate for actions an unverified user can't do (the backend rejects them with EMAIL_NOT_VERIFIED).
 * `locked` → render the trigger with `aria-disabled` (stays focusable), `guard(fn)` → its handler:
 * runs `fn` when verified, explains with a toast when not, does nothing while ME loads.
 */
export function useVerifiedGuard() {
  const { isVerified, loading } = useEmailVerified();
  const toast = useToast();
  const t = useTranslations('errors');

  const guard = useCallback(
    <A extends unknown[]>(fn: (...args: A) => void) =>
      (...args: A) => {
        if (loading) return;
        if (!isVerified) {
          toast.warning(t('EMAIL_NOT_VERIFIED'));
          return;
        }
        fn(...args);
      },
    [isVerified, loading, toast, t],
  );

  return { locked: !isVerified, guard };
}
