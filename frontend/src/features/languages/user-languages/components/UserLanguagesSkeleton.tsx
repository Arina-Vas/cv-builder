import { useTranslations } from 'next-intl';
import { Skeleton } from '@/shared/components/skeleton/Skeleton';
// one stylesheet for the list and its placeholder: the skeleton reuses the list grid
import s from './UserLanguages.module.css';

const SKELETON_ITEMS = 3;

export const UserLanguagesSkeleton = () => {
  const t = useTranslations('userLanguage');

  return (
    <ul className={s.list} aria-busy="true" aria-label={t('loading')}>
      {Array.from({ length: SKELETON_ITEMS }, (_, index) => (
        <li key={index} className={s.skeletonItem}>
          <Skeleton className={s.skeletonBar} />
          <Skeleton className={s.skeletonName} />
        </li>
      ))}
    </ul>
  );
};
