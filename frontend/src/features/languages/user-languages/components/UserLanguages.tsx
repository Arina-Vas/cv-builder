'use client';

import { skipToken, useQuery } from '@apollo/client/react';
import { USER_LANGUAGES } from '@/features/languages/user-languages/api/userLanguages.operations';
import type { UserLanguageFieldsFragment } from '@/gql/graphql';
import { useState } from 'react';
import { Button } from '@/shared/components/buttons';
import { LevelBar } from '@/shared/components/level-bar/LevelBar';
import { PROFICIENCY_LEVEL } from '@/features/languages/user-languages/lib/proficiency';
import { UserLanguageFormModal } from '@/features/languages/user-languages/components/UserLanguageFormModal';
import { useTranslations } from 'next-intl';

type Props = { userId: string; canEdit: boolean };

type ModalState =
  | { type: 'create' }
  | { type: 'update'; language: UserLanguageFieldsFragment }
  | { type: 'delete'; language: UserLanguageFieldsFragment };

export const UserLanguages = ({ userId, canEdit }: Props) => {
  const t = useTranslations('userLanguage');
  const tProficiency = useTranslations('userLanguage.proficiencyLevel');

  const [modal, setModal] = useState<ModalState | null>(null);

  const { data } = useQuery(USER_LANGUAGES, userId ? { variables: { userId } } : skipToken);

  return (
    <div>
      <h3>{t('title')}</h3>
      <ul>
        {data?.userLanguages.map((language) => (
          <li key={language.id}>
            <LevelBar
              level={PROFICIENCY_LEVEL[language.proficiency]}
              label={tProficiency(language.proficiency)}
              key={language.id}
              onClick={canEdit ? () => setModal({ type: 'update', language }) : undefined}
            />
            <span>{language.language.name}</span>
          </li>
        ))}
      </ul>

      {canEdit && <Button onClick={() => setModal({ type: 'create' })}>{t('addButton')}</Button>}
      <UserLanguageFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        userId={userId}
        userLanguage={modal?.type === 'update' ? modal.language : undefined}
      />
    </div>
  );
};
