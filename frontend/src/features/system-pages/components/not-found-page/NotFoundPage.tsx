'use client';

import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { ErrorState } from '@/shared/components/error-state/ErrorState';

const FALLBACK_ROUTE = '/';

export function NotFoundPage() {
  const t = useTranslations('common.errorPages.notFound');
  const router = useRouter();

  const goBack = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push(FALLBACK_ROUTE);
    }
  };

  return (
    <ErrorState
      title={t('title')}
      message={t('message')}
      action={{ label: t('goBack'), onClick: goBack }}
    />
  );
}
