import { useTranslations } from 'next-intl';
import layout from '@/shared/components/form/FormLayout.module.css';
import s from './UserProfile.module.css';

const FIELD_COUNT = 4;

export const UserProfileSkeleton = () => {
  const t = useTranslations('users.profile');

  return (
    <section className={s.root} aria-busy="true" aria-label={t('loading')}>
      <div className={s.header}>
        <span className={`${s.skeleton} ${s.skeletonAvatar}`} />
        <div className={s.info}>
          <span className={`${s.skeleton} ${s.skeletonName}`} />
          <span className={`${s.skeleton} ${s.skeletonText}`} />
          <span className={`${s.skeleton} ${s.skeletonText}`} />
        </div>
      </div>

      <div className={`${layout.grid} ${s.form}`}>
        {Array.from({ length: FIELD_COUNT }, (_, index) => (
          <span key={index} className={`${s.skeleton} ${s.skeletonField}`} />
        ))}
      </div>
    </section>
  );
};
