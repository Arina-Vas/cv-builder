import { ErrorState } from '@/shared/components/error-state/ErrorState';
import { useTranslations } from 'next-intl';

export const CvNotFound = () => {
  const t = useTranslations('cvs.notFound');

  return <ErrorState inline title={t('title')} message={t('message')} />;
};
