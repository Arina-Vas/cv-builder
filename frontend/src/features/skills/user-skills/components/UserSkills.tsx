import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  DELETE_USER_SKILLS,
  USER_SKILL_MUTATION_OPTIONS,
  USER_SKILL_REFETCH_ERROR_CODES,
  USER_SKILL_REFETCH_QUERIES,
  USER_SKILLS,
} from '@/features/skills/user-skills/api/userSkills.operations';
import { groupByCategory } from '@/features/skills/user-skills/lib/groupByCategory';
import { LevelItem } from '@/shared/components/level-item/LevelItem';
import { MASTERY_LEVEL } from '@/features/skills/user-skills/lib/mastery';
import { useTranslations } from 'next-intl';
import { useSelection } from '@/shared/hooks/useSelection';
import { useMemo, useState } from 'react';
import type { UserSkillFieldsFragment } from '@/gql/graphql';
import { UserSkillFormModal } from '@/features/skills/user-skills/components/UserSkillFormModal';
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

  const groupedSkills = useMemo(() => groupByCategory(data?.userSkills ?? []), [data?.userSkills]);

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
        {groupedSkills.map((group) => {
          const headingId = `skill-category-${group.category.id}`;

          return (
            <section key={group.category.id} aria-labelledby={headingId}>
              <h2 id={headingId} className={s.title}>
                {group.category.name}
              </h2>
              <ul className={s.list}>
                {group.skills.map((skill) => (
                  <li key={skill.id}>
                    <LevelItem
                      name={skill.skill.name}
                      level={MASTERY_LEVEL[skill.mastery]}
                      levelLabel={t(`masteryLevel.${skill.mastery}`)}
                      canEdit={canEdit}
                      onClick={() =>
                        selectingMode ? toggle(skill.id) : setModal({ type: 'update', skill })
                      }
                      selected={selectingMode ? selectedIds.has(skill.id) : undefined}
                    />
                  </li>
                ))}
              </ul>
            </section>
          );
        })}
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
