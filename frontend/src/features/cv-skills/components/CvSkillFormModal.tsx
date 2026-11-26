import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import {
  AVAILABLE_CV_SKILLS,
  CREATE_CV_SKILL,
  CV_SKILL_MUTATION_OPTIONS,
  CV_SKILL_REFETCH_ERROR_CODES,
  CV_SKILL_REFETCH_QUERIES,
} from '@/features/cv-skills/api/cvSkills.operations';
import { type CvSkillFormValues, cvSkillSchema } from '@/features/cv-skills/lib/cvSkill.schema';
import { FormModal } from '@/shared/components/form';
import { Select } from '@/shared/components/select/Select';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import { useAppForm } from '@/shared/lib/form';
import s from './CvSkillFormModal.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  cvId: string;
  cvSkillsCount: number;
};

const DEFAULT_VALUES = { skillId: '' };

export const CvSkillFormModal = ({ open, onOpenChange, cvId, cvSkillsCount }: Props) => {
  const t = useTranslations('cvSkills');
  const tActions = useTranslations('common.actions');
  const tValidation = useTranslations('validation');

  const errorMessage = useErrorMessage();
  const withRefetch = useRefetchOnError(CV_SKILL_REFETCH_QUERIES, CV_SKILL_REFETCH_ERROR_CODES);

  const schema = useMemo(() => cvSkillSchema(tValidation), [tValidation]);
  const form = useAppForm({ schema, defaultValues: DEFAULT_VALUES });

  const {
    data: skillsData,
    loading: skillsLoading,
    error: skillsError,
  } = useQuery(
    AVAILABLE_CV_SKILLS,
    open ? { variables: { cvId }, fetchPolicy: 'network-only' } : skipToken,
  );

  const [createCvSkill] = useMutation(CREATE_CV_SKILL, CV_SKILL_MUTATION_OPTIONS);

  const skillOptions: SelectOption[] =
    skillsData?.availableCvSkills.map((skill) => ({ value: skill.id, label: skill.name })) ?? [];

  // A CV can only list skills from the owner's profile (the backend rejects others, and a profile skill
  // cannot be removed while a CV lists it), so an empty list means the profile has nothing more to offer
  const noOptions =
    !skillsLoading && Boolean(skillsData) && !skillsError && skillOptions.length === 0;

  const onSubmit = (values: CvSkillFormValues) =>
    withRefetch(() => createCvSkill({ variables: { input: { cvId, skillId: values.skillId } } }));

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      title={t('form.createTitle')}
      form={form}
      mode="create"
      values={DEFAULT_VALUES}
      submitLabel={tActions('add')}
      errorMessages={{
        CONFLICT: { skillId: t('errors.alreadyAdded') },
        BAD_USER_INPUT: { skillId: t('errors.notOwnerSkill') },
      }}
    >
      <div>
        <Controller
          control={form.control}
          name="skillId"
          render={({ field, fieldState }) => (
            <Select
              ref={field.ref}
              name={field.name}
              label={t('form.fields.skillId')}
              options={skillOptions}
              value={field.value}
              onValueChange={field.onChange}
              onBlur={field.onBlur}
              disabled={skillsLoading || noOptions}
              error={
                fieldState.error?.message ?? (skillsError && errorMessage(parseError(skillsError)))
              }
            />
          )}
        />
        <p className={noOptions ? s.notice : s.hint} role="status">
          {noOptions
            ? cvSkillsCount > 0
              ? t('form.empty.allAdded')
              : t('form.empty.noProfileSkills')
            : t('form.hint')}
        </p>
      </div>
    </FormModal>
  );
};
