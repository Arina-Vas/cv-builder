'use client';

import { useEffect } from 'react';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { apiErrors } from './api-errors';
import { useErrorMessage } from './useErrorMessage';

/**
 * Shows API errors reported to `apiErrors` as error toasts with our own text (`errors.<code>`).
 * Mounted once in the root layout, inside ToastProvider; renders nothing itself.
 */
export function ApiErrorToaster() {
  const toast = useToast();
  const errorMessage = useErrorMessage();

  useEffect(
    () => apiErrors.subscribe((error) => toast.error(errorMessage(error))),
    [toast, errorMessage],
  );

  return null;
}
