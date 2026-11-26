import { useMutation } from '@apollo/client/react';
import type { CvSkillFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { Controller } from 'react-hook-form';
import {
  CV_SKILL_MUTATION_OPTIONS,
  CV_SKILL_REFETCH_ERROR_CODES,
  CV_SKILL_REFETCH_QUERIES,
  UPDATE_CV_SKILL,
} from '@/features/cv-skills/api/cvSkills.operations';
import {
  type CvSkillUpdateFormValues,
  cvSkillUpdateSchema,
} from '@/features/cv-skills/lib/cvSkill.schema';
import { MASTERIES } from '@/features/skills/user-skills/lib/mastery';
import { FormModal } from '@/shared/components/form';
import { Select } from '@/shared/components/select/Select';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { useRefetchOnError } from '@/shared/lib/apollo/useRefetchOnError';
import { useAppForm } from '@/shared/lib/form';

type Props = {
  cvSkill: CvSkillFieldsFragment | null;
  onOpenChange: (open: boolean) => void;
};

export const CvSkillUpdateModal = ({ cvSkill, onOpenChange }: Props) => {
  const t = useTranslations('cvSkills');
  const tMastery = useTranslations('userSkill.masteryLevel');
  const tActions = useTranslations('common.actions');
  const tValidation = useTranslations('validation');

  const withRefetch = useRefetchOnError(CV_SKILL_REFETCH_QUERIES, CV_SKILL_REFETCH_ERROR_CODES);

  const schema = useMemo(() => cvSkillUpdateSchema(tValidation), [tValidation]);
  const values = { mastery: cvSkill?.mastery ?? '' };
  const form = useAppForm({ schema, defaultValues: values });

  const [updateCvSkill] = useMutation(UPDATE_CV_SKILL, CV_SKILL_MUTATION_OPTIONS);

  const masteryOptions: SelectOption[] = MASTERIES.map((mastery) => ({
    value: mastery,
    label: tMastery(mastery),
  }));

  const onSubmit = async ({ mastery }: CvSkillUpdateFormValues) => {
    if (!cvSkill) return;
    await withRefetch(() => updateCvSkill({ variables: { input: { id: cvSkill.id, mastery } } }));
  };

  return (
    <FormModal
      open={cvSkill !== null}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      title={t('form.updateTitle')}
      form={form}
      mode="update"
      values={values}
      requireDirty
      submitLabel={tActions('save')}
    >
      <Select
        name="skillId"
        label={t('form.fields.skillId')}
        options={cvSkill ? [{ value: cvSkill.skill.id, label: cvSkill.skill.name }] : []}
        value={cvSkill?.skill.id}
        disabled
      />
      <Controller
        control={form.control}
        name="mastery"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('form.fields.mastery')}
            options={masteryOptions}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
    </FormModal>
  );
};
