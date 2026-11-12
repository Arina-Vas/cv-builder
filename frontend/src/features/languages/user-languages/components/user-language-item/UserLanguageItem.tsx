import s from './UserLanguageItem.module.css';
import { LevelBar } from '@/shared/components/level-bar/LevelBar';
import { PROFICIENCY_LEVEL } from '@/features/languages/user-languages/lib/proficiency';
import type { UserLanguageFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useId } from 'react';
import { useActionGate } from '@/shared/lib/action-gate/ActionGate';

type Props = {
  canEdit: boolean;
  onClick?: () => void;
  userLanguage: UserLanguageFieldsFragment;
  selected?: boolean;
};
export const UserLanguageItem = ({ canEdit, userLanguage, onClick, selected }: Props) => {
  const tProficiency = useTranslations('userLanguage.proficiencyLevel');
  const nameId = useId();
  // opening Update changes data: locked for an unverified user. Selection mode is reached only
  // through the gated REMOVE LANGUAGES, so a click there is never locked here.
  const { locked, guard } = useActionGate();
  const gated = selected === undefined;

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
    <button
      type="button"
      className={s.item}
      aria-pressed={selected}
      aria-disabled={(gated && locked) || undefined}
      onClick={onClick && (gated ? guard(onClick) : onClick)}
    >
      {content}
    </button>
  ) : (
    <div className={s.item}>{content}</div>
  );
};
