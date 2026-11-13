import { useTranslations } from 'next-intl';
import layout from '@/shared/components/form/FormLayout.module.css';
import { Skeleton } from '@/shared/components/skeleton/Skeleton';
import s from './UserProfile.module.css';

const FIELD_COUNT = 4;

export const UserProfileSkeleton = () => {
  const t = useTranslations('users.profile');

  return (
    <section className={s.root} aria-busy="true" aria-label={t('loading')}>
      <div className={s.header}>
        <Skeleton className={s.skeletonAvatar} />
        <div className={s.info}>
          <Skeleton className={s.skeletonName} />
          <Skeleton className={s.skeletonText} />
          <Skeleton className={s.skeletonText} />
        </div>
      </div>

      <div className={`${layout.grid} ${s.form}`}>
        {Array.from({ length: FIELD_COUNT }, (_, index) => (
          <Skeleton key={index} className={s.skeletonField} />
        ))}
      </div>
    </section>
  );
};
