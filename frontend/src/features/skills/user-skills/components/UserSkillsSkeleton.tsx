import { useTranslations } from 'next-intl';
import { Skeleton } from '@/shared/components/skeleton/Skeleton';
// one stylesheet for the list and its placeholder: the skeleton reuses the list grid
import s from './UserSkills.module.css';

const SKELETON_ITEMS = 3;

export const UserSkillsSkeleton = () => {
  const t = useTranslations('userSkill');

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
