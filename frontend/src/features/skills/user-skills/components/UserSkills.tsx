import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  DELETE_USER_SKILLS,
  USER_SKILL_MUTATION_OPTIONS,
  USER_SKILL_REFETCH_ERROR_CODES,
  USER_SKILL_REFETCH_QUERIES,
  USER_SKILLS,
} from '@/features/skills/user-skills/api/userSkills.operations';
import { useTranslations } from 'next-intl';
import { useSelection } from '@/shared/hooks/useSelection';
import { useState } from 'react';
import type { UserSkillFieldsFragment } from '@/gql/graphql';
import { UserSkillFormModal } from '@/features/skills/user-skills/components/UserSkillFormModal';
import { SkillGroups } from '@/features/skills/user-skills/components/SkillGroups';
import s from './UserSkills.module.css';
import { ConfirmDialog } from '@/shared/components/dialog';
import { AsyncList } from '@/shared/components/async-list/AsyncList';
import { SelectionActions } from '@/shared/components/selection-actions/SelectionActions';
import { notFound } from 'next/navigation';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';

type Props = {
  userId: string;
  canEdit: boolean;
  emptyMessage: string;
};

type ModalState = { type: 'create' } | { type: 'update'; skill: UserSkillFieldsFragment };

export const UserSkills = ({ userId, canEdit, emptyMessage }: Props) => {
  const t = useTranslations('userSkill');
  const tActions = useTranslations('common.actions');

  const { selectingMode, selectedIds, toggle, start, exit } = useSelection();

  const [modal, setModal] = useState<ModalState | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);

  const { data, loading, error, refetch } = useQuery(
    USER_SKILLS,
    userId ? { variables: { userId } } : skipToken,
  );

  const withRefetch = useRefetchOnError(USER_SKILL_REFETCH_QUERIES, USER_SKILL_REFETCH_ERROR_CODES);

  const [deleteSkills] = useMutation(DELETE_USER_SKILLS, USER_SKILL_MUTATION_OPTIONS);

  const handleDeleteSkills = async () => {
    await withRefetch(() => deleteSkills({ variables: { ids: [...selectedIds], userId } }));
    exit();
  };

  if (hasErrorCode(error, 'NOT_FOUND')) notFound();

  return (
    <div className={s.root}>
      <AsyncList
        items={data?.userSkills}
        error={error}
        loading={loading}
        onRetry={() => refetch()}
        loadErrorMessage={t('loadError')}
        retryLabel={t('retry')}
        loadingLabel={t('loading')}
        emptyMessage={emptyMessage}
      >
        <SkillGroups
          skills={data?.userSkills ?? []}
          idPrefix="skill-category"
          canEdit={canEdit}
          selectedIds={selectingMode ? selectedIds : undefined}
          onItemClick={(skill) =>
            selectingMode ? toggle(skill.id) : setModal({ type: 'update', skill })
          }
        />
      </AsyncList>

      {data && (
        <SelectionActions
          canEdit={canEdit}
          selecting={selectingMode}
          selectedCount={selectedIds.size}
          canRemove={data.userSkills.length > 0}
          addLabel={t('addButton')}
          removeLabel={t('removeButton')}
          confirmRemoveLabel={t('confirmRemove')}
          cancelLabel={tActions('cancel')}
          onAdd={() => setModal({ type: 'create' })}
          onStartRemove={start}
          onCancel={exit}
          onRemove={() => setOpenConfirmDialog(true)}
        />
      )}

      <UserSkillFormModal
        open={modal?.type === 'create' || modal?.type === 'update'}
        onOpenChange={(open) => !open && setModal(null)}
        userId={userId}
        userSkill={modal?.type === 'update' ? modal.skill : undefined}
      />

      <ConfirmDialog
        title={t('remove.title')}
        open={openConfirmDialog}
        onOpenChange={setOpenConfirmDialog}
        message={t.rich('remove.message', {
          count: selectedIds.size,
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleDeleteSkills}
      />
    </div>
  );
};
