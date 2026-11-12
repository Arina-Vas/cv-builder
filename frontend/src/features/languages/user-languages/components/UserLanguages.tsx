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
import { UserLanguageItem } from '@/features/languages/user-languages/components/user-language-item/UserLanguageItem';
import { ConfirmDialog } from '@/shared/components/dialog';
import s from './UserLanguages.module.css';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { TrashIcon } from '@/shared/components/icons/TrashIcon';

type Props = { userId: string; canEdit: boolean };

type ModalState = { type: 'create' } | { type: 'update'; language: UserLanguageFieldsFragment };

export const UserLanguages = ({ userId, canEdit }: Props) => {
  const t = useTranslations('userLanguage');
  const tActions = useTranslations('common.actions');
  const [modal, setModal] = useState<ModalState | null>(null);

  const [selectingMode, setSelectingMode] = useState<boolean>(false);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { data } = useQuery(USER_LANGUAGES, userId ? { variables: { userId } } : skipToken);
  const [deleteLanguages] = useMutation(DELETE_USER_LANGUAGES, USER_LANGUAGE_MUTATION_OPTIONS);

  const toggleLanguageId = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelection = () => {
    setSelectingMode(false);
    setSelectedIds(new Set());
  };

  const handleDeleteLanguages = async () => {
    await deleteLanguages({ variables: { ids: [...selectedIds], userId } });
    exitSelection();
  };

  return (
    <div className={s.root}>
      <h3 className={s.title}>{t('title')}</h3>
      <ul className={s.list}>
        {data?.userLanguages.map((language) => (
          <li key={language.id}>
            <UserLanguageItem
              canEdit={canEdit}
              userLanguage={language}
              onClick={() =>
                selectingMode
                  ? toggleLanguageId(language.id)
                  : setModal({ type: 'update', language })
              }
              selected={selectingMode ? selectedIds.has(language.id) : undefined}
            />
          </li>
        ))}
      </ul>

      <div className={s.actions}>
        {canEdit && !selectingMode && (
          <>
            <Button size={'sm'} onClick={() => setModal({ type: 'create' })} variant={'ghost'}>
              <PlusIcon />
              {t('addButton')}
            </Button>
            <Button
              variant={'text'}
              size={'sm'}
              disabled={!data?.userLanguages.length}
              onClick={() => {
                setSelectingMode(true);
              }}
            >
              <TrashIcon />
              {t('removeButton')}
            </Button>
          </>
        )}

        {canEdit && selectingMode && (
          <>
            <Button size={'sm'} onClick={exitSelection} variant={'secondary'}>
              {tActions('cancel')}
            </Button>
            <Button
              disabled={selectedIds.size === 0}
              size={'sm'}
              onClick={() => setOpenConfirmDialog(true)}
            >
              {t('removeCount', { count: selectedIds.size })}
            </Button>
          </>
        )}
      </div>

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
