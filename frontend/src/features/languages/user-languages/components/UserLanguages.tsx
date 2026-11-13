'use client';

import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  DELETE_USER_LANGUAGES,
  USER_LANGUAGE_MUTATION_OPTIONS,
  USER_LANGUAGES,
} from '@/features/languages/user-languages/api/userLanguages.operations';
import type { UserLanguageFieldsFragment } from '@/gql/graphql';
import { useState } from 'react';
import { Button } from '@/shared/components/buttons';
import { UserLanguageFormModal } from './UserLanguageFormModal';
import { useTranslations } from 'next-intl';
import { LevelItem } from '@/shared/components/level-item/LevelItem';
import { ConfirmDialog } from '@/shared/components/dialog';
import s from './UserLanguages.module.css';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { TrashIcon } from '@/shared/components/icons/TrashIcon';
import { useSelection } from '@/shared/hooks/useSelection';
import { UserLanguagesSkeleton } from './UserLanguagesSkeleton';
import { PROFICIENCY_LEVEL } from '@/features/languages/user-languages/lib/proficiency';

type Props = {
  userId: string;
  canEdit: boolean;
  emptyMessage: string;
};

type ModalState = { type: 'create' } | { type: 'update'; language: UserLanguageFieldsFragment };

export const UserLanguages = ({ userId, canEdit, emptyMessage }: Props) => {
  const t = useTranslations('userLanguage');
  const tProficiency = useTranslations('userLanguage.proficiencyLevel');
  const tActions = useTranslations('common.actions');
  const [modal, setModal] = useState<ModalState | null>(null);

  const { selectingMode, selectedIds, toggle, start, exit } = useSelection();

  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const { data, loading, error, refetch } = useQuery(
    USER_LANGUAGES,
    userId ? { variables: { userId } } : skipToken,
  );
  const [deleteLanguages] = useMutation(DELETE_USER_LANGUAGES, USER_LANGUAGE_MUTATION_OPTIONS);

  const handleDeleteLanguages = async () => {
    await deleteLanguages({ variables: { ids: [...selectedIds], userId } });
    exit();
  };

  return (
    <div className={s.root}>
      <h2 className={s.title}>{t('title')}</h2>

      {error && !data ? (
        <div className={s.error} role="alert">
          <p className={s.errorText}>{t('loadError')}</p>
          <Button variant="secondary" size="sm" loading={loading} onClick={() => refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : !data ? (
        <UserLanguagesSkeleton />
      ) : data.userLanguages.length === 0 ? (
        <p className={s.empty}>{emptyMessage}</p>
      ) : (
        <ul className={s.list}>
          {data.userLanguages.map((language) => (
            <li key={language.id}>
              <LevelItem
                name={language.language.name}
                level={PROFICIENCY_LEVEL[language.proficiency]}
                levelLabel={tProficiency(language.proficiency)}
                canEdit={canEdit}
                onClick={() =>
                  selectingMode ? toggle(language.id) : setModal({ type: 'update', language })
                }
                selected={selectingMode ? selectedIds.has(language.id) : undefined}
              />
            </li>
          ))}
        </ul>
      )}

      {data && (
        <div className={s.actions}>
          {canEdit && !selectingMode && (
            <>
              <Button
                size={'sm'}
                gated
                onClick={() => setModal({ type: 'create' })}
                variant={'ghost'}
              >
                <PlusIcon />
                {t('addButton')}
              </Button>
              <Button
                variant={'text'}
                size={'sm'}
                gated
                disabled={!data.userLanguages.length}
                onClick={start}
              >
                <TrashIcon />
                {t('removeButton')}
              </Button>
            </>
          )}

          {canEdit && selectingMode && (
            <>
              <Button size={'sm'} onClick={exit} variant={'secondary'}>
                {tActions('cancel')}
              </Button>
              <Button
                disabled={selectedIds.size === 0}
                size={'sm'}
                gated
                onClick={() => setOpenConfirmDialog(true)}
              >
                {t('removeCount', { count: selectedIds.size })}
              </Button>
            </>
          )}
        </div>
      )}

      <UserLanguageFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        userId={userId}
        userLanguage={modal?.type === 'update' ? modal.language : undefined}
      />

      <ConfirmDialog
        title={t('remove.title')}
        open={openConfirmDialog}
        onOpenChange={setOpenConfirmDialog}
        message={t('remove.message', { count: selectedIds.size })}
        onConfirm={handleDeleteLanguages}
      />
    </div>
  );
};
