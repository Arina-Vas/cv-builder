import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  DELETE_USER_SKILLS,
  USER_SKILL_MUTATION_OPTIONS,
  USER_SKILL_REFETCH_ERROR_CODES,
  USER_SKILL_REFETCH_QUERIES,
  USER_SKILLS,
} from '@/features/skills/user-skills/api/userSkills.operations';
import { useFormatter, useTranslations } from 'next-intl';
import { useSelection } from '@/shared/hooks/useSelection';
import { useState } from 'react';
import type { UserSkillFieldsFragment } from '@/gql/graphql';
import { UserSkillFormModal } from '@/features/skills/user-skills/components/UserSkillFormModal';
import { SkillGroups } from '@/features/skills/user-skills/components/SkillGroups';
import s from './UserSkills.module.css';
import { ConfirmDialog } from '@/shared/components/dialog';
import { AsyncList } from '@/shared/components/async-list/AsyncList';
import { SelectionActions } from '@/shared/components/selection-actions/SelectionActions';
import { hasErrorCode, parseError } from '@/shared/lib/apollo/graphql-errors';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import { UserNotFound } from '@/features/users/components/UserNotFound';

type Props = {
  userId: string;
  canEdit: boolean;
  emptyMessage: string;
};

type ModalState = { type: 'create' } | { type: 'update'; skill: UserSkillFieldsFragment };

export const UserSkills = ({ userId, canEdit, emptyMessage }: Props) => {
  const t = useTranslations('userSkill');
  const format = useFormatter();
  const tActions = useTranslations('common.actions');

  const { selectingMode, selectedIds, toggle, start, exit } = useSelection();

  const [modal, setModal] = useState<ModalState | null>(null);
  const [openConfirmDialog, setOpenConfirmDialog] = useState(false);
  const [inUseIds, setInUseIds] = useState<string[]>([]);

  const { data, loading, error, refetch } = useQuery(
    USER_SKILLS,
    userId ? { variables: { userId } } : skipToken,
  );

  const withRefetch = useRefetchOnError(USER_SKILL_REFETCH_QUERIES, USER_SKILL_REFETCH_ERROR_CODES);

  const [deleteSkills] = useMutation(DELETE_USER_SKILLS, USER_SKILL_MUTATION_OPTIONS);

  const handleDeleteSkills = async () => {
    try {
      await withRefetch(() => deleteSkills({ variables: { ids: [...selectedIds], userId } }));
      exit();
    } catch (error) {
      setInUseIds(parseError(error).ids ?? []);
      throw error;
    }
  };

  const inUseNames =
    data?.userSkills.filter((item) => inUseIds.includes(item.id)).map((item) => item.skill.name) ??
    [];

  if (hasErrorCode(error, 'NOT_FOUND')) return <UserNotFound />;

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
        errorMessages={{
          ENTITY_IN_USE: t('remove.inUse', {
            count: inUseNames.length,
            skills: format.list(inUseNames),
          }),
        }}
      />
    </div>
  );
};
