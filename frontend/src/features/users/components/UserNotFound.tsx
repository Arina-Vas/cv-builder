import { ErrorState } from '@/shared/components/error-state/ErrorState';
import { useTranslations } from 'next-intl';

export const UserNotFound = () => {
  const t = useTranslations('users.notFound');

  return <ErrorState inline title={t('title')} message={t('message')} />;
};
