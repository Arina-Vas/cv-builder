import { useTranslations } from 'next-intl';
import type { AppError } from '@/shared/lib/apollo/graphql-errors';

export const useErrorMessage = () => {
  const t = useTranslations('errors');

  return ({ code = 'INTERNAL_SERVER_ERROR', retryAfter }: AppError) =>
    code === 'RATE_LIMITED' ? t('RATE_LIMITED', { seconds: retryAfter ?? 0 }) : t(code);
};
