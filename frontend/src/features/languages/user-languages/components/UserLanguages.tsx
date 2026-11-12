'use client';

import { skipToken, useQuery } from '@apollo/client/react';
import { USER_LANGUAGES } from '@/features/languages/user-languages/api/userLanguages.operations';
import type { UserLanguageFieldsFragment } from '@/gql/graphql';
import { useState } from 'react';
import { Button } from '@/shared/components/buttons';
import { UserLanguageFormModal } from './UserLanguageFormModal';
import { useTranslations } from 'next-intl';
import { UserLanguageItem } from '@/features/languages/user-languages/components/user-language-item/UserLanguageItem';

type Props = { userId: string; canEdit: boolean };

type ModalState =
  | { type: 'create' }
  | { type: 'update'; language: UserLanguageFieldsFragment }
  | { type: 'delete'; language: UserLanguageFieldsFragment };

export const UserLanguages = ({ userId, canEdit }: Props) => {
  const t = useTranslations('userLanguage');
  const [modal, setModal] = useState<ModalState | null>(null);

  const { data } = useQuery(USER_LANGUAGES, userId ? { variables: { userId } } : skipToken);

  return (
    <div>
      <h3>{t('title')}</h3>
      <ul>
        {data?.userLanguages.map((language) => (
          <li key={language.id}>
            <UserLanguageItem
              canEdit={canEdit}
              userLanguage={language}
              onClick={() => setModal({ type: 'update', language })}
            />
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
