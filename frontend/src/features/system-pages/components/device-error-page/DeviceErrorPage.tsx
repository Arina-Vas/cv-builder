'use client';

import { useTranslations } from 'next-intl';
import { ErrorState } from '@/shared/components/error-state/ErrorState';

export function DeviceErrorPage() {
  const t = useTranslations('common.errorPages.deviceError');

  return <ErrorState title={t('title')} message={t('message')} />;
}
