'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { notFound } from 'next/navigation';
import { useState } from 'react';
import type { CvSkillFieldsFragment } from '@/gql/graphql';
import {
  CV_SKILL_MUTATION_OPTIONS,
  CV_SKILL_REFETCH_ERROR_CODES,
  CV_SKILL_REFETCH_QUERIES,
  CV_SKILLS,
  DELETE_CV_SKILLS,
} from '@/features/cv-skills/api/cvSkills.operations';
import { CvSkillFormModal } from '@/features/cv-skills/components/CvSkillFormModal';
import { CvSkillUpdateModal } from '@/features/cv-skills/components/CvSkillUpdateModal';
import { SkillGroups } from '@/features/skills/user-skills/components/SkillGroups';
import { AsyncList } from '@/shared/components/async-list/AsyncList';
import { ConfirmDialog } from '@/shared/components/dialog';
import { SelectionActions } from '@/shared/components/selection-actions/SelectionActions';
import { useSelection } from '@/shared/hooks/useSelection';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import s from './CvSkills.module.css';

type Props = {
  cvId: string;
};

export const CvSkills = ({ cvId }: Props) => {
  const t = useTranslations('cvSkills');
  const tActions = useTranslations('common.actions');

  const { selectingMode, selectedIds, toggle, start, exit } = useSelection();

  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<CvSkillFieldsFragment | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);

  const { data, loading, error, refetch } = useQuery(CV_SKILLS, {
    variables: { cvId },
    fetchPolicy: 'cache-and-network',
  });

  const withRefetch = useRefetchOnError(CV_SKILL_REFETCH_QUERIES, CV_SKILL_REFETCH_ERROR_CODES);
  const [deleteCvSkills] = useMutation(DELETE_CV_SKILLS, CV_SKILL_MUTATION_OPTIONS);

  const handleRemove = async () => {
    await withRefetch(() => deleteCvSkills({ variables: { cvId, ids: [...selectedIds] } }));
    exit();
  };

  if (hasErrorCode(error, 'NOT_FOUND')) notFound();

  const forbidden = hasErrorCode(error, 'FORBIDDEN');

  return (
    <div className={s.root}>
      <AsyncList
        items={data?.cvSkills}
        error={error}
        loading={loading}
        onRetry={forbidden ? undefined : () => refetch()}
        loadErrorMessage={forbidden ? t('forbidden') : t('loadError')}
        retryLabel={t('retry')}
        loadingLabel={t('loading')}
        emptyMessage={t('empty')}
      >
        <SkillGroups
          skills={data?.cvSkills ?? []}
          idPrefix="cv-skill-category"
          canEdit
          selectedIds={selectingMode ? selectedIds : undefined}
          onItemClick={(cvSkill) => (selectingMode ? toggle(cvSkill.id) : setEditing(cvSkill))}
        />
      </AsyncList>

      {data && (
        <SelectionActions
          canEdit
          selecting={selectingMode}
          selectedCount={selectedIds.size}
          canRemove={data.cvSkills.length > 0}
          addLabel={t('addButton')}
          removeLabel={t('removeButton')}
          confirmRemoveLabel={t('confirmRemove')}
          cancelLabel={tActions('cancel')}
          onAdd={() => setAddOpen(true)}
          onStartRemove={start}
          onCancel={exit}
          onRemove={() => setConfirmOpen(true)}
        />
      )}

      <CvSkillFormModal open={addOpen} onOpenChange={setAddOpen} cvId={cvId} />

      <CvSkillUpdateModal cvSkill={editing} onOpenChange={(open) => !open && setEditing(null)} />

      <ConfirmDialog
        title={t('remove.title')}
        open={confirmOpen}
        onOpenChange={setConfirmOpen}
        message={t.rich('remove.message', {
          count: selectedIds.size,
          b: (chunks) => <strong>{chunks}</strong>,
        })}
        onConfirm={handleRemove}
      />
    </div>
  );
};
