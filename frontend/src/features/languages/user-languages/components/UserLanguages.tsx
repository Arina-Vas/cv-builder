'use client';

import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  DELETE_USER_LANGUAGES,
  USER_LANGUAGE_MUTATION_OPTIONS,
  USER_LANGUAGES,
} from '@/features/languages/user-languages/api/userLanguages.operations';
import type { UserLanguageFieldsFragment } from '@/gql/graphql';
import { useState } from 'react';
import { UserLanguageFormModal } from './UserLanguageFormModal';
import { useTranslations } from 'next-intl';
import { LevelItem } from '@/shared/components/level-item/LevelItem';
import { ConfirmDialog } from '@/shared/components/dialog';
import s from './UserLanguages.module.css';
import { useSelection } from '@/shared/hooks/useSelection';
import { AsyncList } from '@/shared/components/async-list/AsyncList';
import { SelectionActions } from '@/shared/components/selection-actions/SelectionActions';
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

      <AsyncList
        items={data?.userLanguages}
        error={error}
        loading={loading}
        onRetry={() => refetch()}
        loadErrorMessage={t('loadError')}
        retryLabel={t('retry')}
        loadingLabel={t('loading')}
        emptyMessage={emptyMessage}
      >
        {
          <ul className={s.list}>
            {data?.userLanguages.map((language) => (
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
        }
      </AsyncList>

      {data && (
        <SelectionActions
          canEdit={canEdit}
          selecting={selectingMode}
          selectedCount={selectedIds.size}
          canRemove={data.userLanguages.length > 0}
          addLabel={t('addButton')}
          removeLabel={t('removeButton')}
          removeCountLabel={t('removeCount', { count: selectedIds.size })}
          cancelLabel={tActions('cancel')}
          onAdd={() => setModal({ type: 'create' })}
          onStartRemove={start}
          onCancel={exit}
          onRemove={() => setOpenConfirmDialog(true)}
        />
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
