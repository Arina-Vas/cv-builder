import { FormModal } from '@/shared/components/form';
import { Input } from '@/shared/components/inputs';
import type { SkillFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useAppForm } from '@/shared/lib/form';
import { useMutation, useQuery } from '@apollo/client/react';
import {
  CREATE_SKILL,
  SKILL_CATEGORIES,
  SKILL_MUTATION_OPTIONS,
  UPDATE_SKILL,
} from '@/features/skills/api/skills.operations';
import { type SkillFormValues, skillSchema } from '@/features/skills/lib/skill.schema';
import { Controller } from 'react-hook-form';
import { Select } from '@/shared/components/select/Select';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill?: SkillFieldsFragment;
};
export const SkillFormModal = ({ open, onOpenChange, skill }: Props) => {
  const t = useTranslations('skills');
  const tValidation = useTranslations('validation');
  const schema = useMemo(() => skillSchema(tValidation), [tValidation]);
  const form = useAppForm({ schema, defaultValues: { name: '', categoryId: '' } });
  const errorMessage = useErrorMessage();

  const [createSkill] = useMutation(CREATE_SKILL, SKILL_MUTATION_OPTIONS);
  const [updateSkill] = useMutation(UPDATE_SKILL, SKILL_MUTATION_OPTIONS);

  const { data, error, loading } = useQuery(SKILL_CATEGORIES, { skip: !open });
  const skillCategoryOptions = data?.skillCategories.map((category) => ({
    value: category.id,
    label: category.name,
  }));

  const handleSubmit = (values: SkillFormValues) => {
    return skill
      ? updateSkill({ variables: { input: { ...values, id: skill.id } } })
      : createSkill({ variables: { input: values } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={skill ? t('edit.title') : t('create.title')}
      form={form}
      mode={skill ? 'update' : 'create'}
      values={{
        name: skill?.name ?? '',
        categoryId: skill?.category.id ?? '',
      }}
      requireDirty={!!skill}
    >
      <Input
        label={t('fields.name')}
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
      <Controller
        control={form.control}
        name="categoryId"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.category')}
            options={skillCategoryOptions ?? []}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={loading}
            error={fieldState.error?.message ?? (error && errorMessage(parseError(error)))}
          />
        )}
      />
    </FormModal>
  );
};
