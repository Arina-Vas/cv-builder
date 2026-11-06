import { useTranslations } from 'next-intl';
import { useCallback } from 'react';
import type { AppError } from '@/shared/lib/apollo/graphql-errors';

// Stable between renders, so it can be an effect dependency (ApiErrorToaster subscribes with it)
export const useErrorMessage = () => {
  const t = useTranslations('errors');

  return useCallback(
    ({ code = 'INTERNAL_SERVER_ERROR', retryAfter }: AppError) =>
      code === 'RATE_LIMITED' ? t('RATE_LIMITED', { seconds: retryAfter ?? 0 }) : t(code),
    [t],
  );
};
