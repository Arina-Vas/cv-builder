import { useTranslations } from 'next-intl';
import layout from '@/shared/components/form/FormLayout.module.css';
import { Skeleton } from '@/shared/components/skeleton/Skeleton';
import s from './CvDetails.module.css';

export const CvDetailsSkeleton = () => {
  const t = useTranslations('cvs.details');

  return (
    <div className={`${layout.stack} ${s.form}`} aria-busy="true" aria-label={t('loading')}>
      <Skeleton className={s.skeletonInput} />
      <Skeleton className={s.skeletonInput} />
      <Skeleton className={s.skeletonTextarea} />
      <div className={s.actions}>
        <Skeleton className={s.skeletonButton} />
      </div>
    </div>
  );
};
