import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  DELETE_USER_SKILLS,
  USER_SKILL_MUTATION_OPTIONS,
  USER_SKILLS,
} from '@/features/skills/user-skills/api/userSkills.operations';
import { groupByCategory } from '@/features/skills/user-skills/lib/groupByCategory';
import { LevelItem } from '@/shared/components/level-item/LevelItem';
import { MASTERY_LEVEL } from '@/features/skills/user-skills/lib/mastery';
import { useTranslations } from 'next-intl';
import { useSelection } from '@/shared/hooks/useSelection';
import { Fragment, useState } from 'react';
import type { UserSkillFieldsFragment } from '@/gql/graphql';
import { Button } from '@/shared/components/buttons';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { TrashIcon } from '@/shared/components/icons/TrashIcon';
import { UserSkillFormModal } from '@/features/skills/user-skills/components/UserSkillFormModal';
import s from './UserSkills.module.css';
import { ConfirmDialog } from '@/shared/components/dialog';
import { UserSkillsSkeleton } from '@/features/skills/user-skills/components/UserSkillsSkeleton';

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

  const [deleteSkills] = useMutation(DELETE_USER_SKILLS, USER_SKILL_MUTATION_OPTIONS);

  const handleDeleteSkills = async () => {
    await deleteSkills({ variables: { ids: [...selectedIds], userId } });
    exit();
  };

  const groupedSkills = groupByCategory(data?.userSkills ?? []);

  return (
    <div className={s.root}>
      {error && !data ? (
        <div className={s.error} role="alert">
          <p className={s.errorText}>{t('loadError')}</p>
          <Button variant="secondary" size="sm" loading={loading} onClick={() => refetch()}>
            {t('retry')}
          </Button>
        </div>
      ) : !data ? (
        <UserSkillsSkeleton />
      ) : data.userSkills.length === 0 ? (
        <p className={s.empty}>{emptyMessage}</p>
      ) : (
        groupedSkills.map((group) => (
          <Fragment key={group.category.id}>
            <h2 className={s.title}>{group.category.name}</h2>
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
          </Fragment>
        ))
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
                disabled={!data.userSkills.length}
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
        message={t('remove.message', { count: selectedIds.size })}
        onConfirm={handleDeleteSkills}
      />
    </div>
  );
};
