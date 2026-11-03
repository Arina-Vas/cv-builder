'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/shared/components/error-state/ErrorState';

interface NoInternetPageProps {
  onRetry: () => void;
  retrying?: boolean;
}

export function NoInternetPage({ onRetry, retrying = false }: NoInternetPageProps) {
  const t = useTranslations('common.errorPages.noInternet');

  return (
    <ErrorState
      title={t('title')}
      message={t('message')}
      action={{ label: t('retry'), onClick: onRetry, loading: retrying }}
    />
  );
}
