import s from './UserLanguageItem.module.css';
import { LevelBar } from '@/shared/components/level-bar/LevelBar';
import { PROFICIENCY_LEVEL } from '@/features/languages/user-languages/lib/proficiency';
import type { UserLanguageFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useId } from 'react';

type Props = {
  canEdit: boolean;
  onClick?: () => void;
  userLanguage: UserLanguageFieldsFragment;
};
export const UserLanguageItem = ({ canEdit, userLanguage, onClick }: Props) => {
  const tProficiency = useTranslations('userLanguage.proficiencyLevel');
  const nameId = useId();

  const content = (
    <>
      <LevelBar
        level={PROFICIENCY_LEVEL[userLanguage.proficiency]}
        label={tProficiency(userLanguage.proficiency)}
        aria-labelledby={nameId}
      />
      <span id={nameId}>{userLanguage.language.name}</span>
    </>
  );

  return canEdit ? (
    <button type="button" className={s.item} onClick={onClick}>
      {content}
    </button>
  ) : (
    <div className={s.item}>{content}</div>
  );
};
