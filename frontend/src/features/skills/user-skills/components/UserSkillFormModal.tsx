import type { UserSkillFieldsFragment } from '@/gql/graphql';
import { Controller } from 'react-hook-form';
import { Select } from '@/shared/components/select/Select';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { FormModal } from '@/shared/components/form';
import { useTranslations } from 'next-intl';
import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  AVAILABLE_USER_SKILLS,
  CREATE_USER_SKILL,
  UPDATE_USER_SKILL,
  USER_SKILL_MUTATION_OPTIONS,
} from '@/features/skills/user-skills/api/userSkills.operations';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useMemo } from 'react';
import { useAppForm } from '@/shared/lib/form';
import {
  type UserSkillFormValues,
  userSkillSchema,
} from '@/features/skills/user-skills/lib/userSkill.schema';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { MASTERIES } from '@/features/skills/user-skills/lib/mastery';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userSkill?: UserSkillFieldsFragment;
};
export const UserSkillFormModal = ({ open, onOpenChange, userSkill, userId }: Props) => {
  const t = useTranslations('userSkill');
  const tActions = useTranslations('common.actions');
  const tValidation = useTranslations('validation');

  const errorMessage = useErrorMessage();

  const schema = useMemo(() => userSkillSchema(tValidation), [tValidation]);
  const form = useAppForm({
    schema,
    defaultValues: {
      skillId: userSkill?.skill.id ?? '',
      mastery: userSkill?.mastery ?? '',
    },
  });

  const {
    data: skillsData,
    loading: skillsLoading,
    error: skillsError,
  } = useQuery(AVAILABLE_USER_SKILLS, open && !userSkill ? { variables: { userId } } : skipToken);

  const [createUserSkill] = useMutation(CREATE_USER_SKILL, USER_SKILL_MUTATION_OPTIONS);
  const [updateUserSkill] = useMutation(UPDATE_USER_SKILL, USER_SKILL_MUTATION_OPTIONS);

  const skillOptions: SelectOption[] = userSkill
    ? [{ value: userSkill.skill.id, label: userSkill.skill.name }]
    : (skillsData?.availableUserSkills.map((s) => ({ value: s.id, label: s.name })) ?? []);

  const masteryOptions: SelectOption[] = MASTERIES.map((mastery) => ({
    value: mastery,
    label: t(`masteryLevel.${mastery}`),
  }));

  const onSubmit = async (values: UserSkillFormValues) => {
    return userSkill
      ? await updateUserSkill({
          variables: { input: { id: userSkill.id, userId, mastery: values.mastery } },
        })
      : await createUserSkill({ variables: { input: { userId, ...values } } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      title={userSkill ? t('form.updateTitle') : t('form.createTitle')}
      form={form}
      mode={userSkill ? 'update' : 'create'}
      values={{
        skillId: userSkill?.skill.id ?? '',
        mastery: userSkill?.mastery ?? '',
      }}
      requireDirty={!!userSkill}
      submitLabel={userSkill ? undefined : tActions('add')}
    >
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
            disabled={skillsLoading || !!userSkill}
            error={
              fieldState.error?.message ?? (skillsError && errorMessage(parseError(skillsError)))
            }
          />
        )}
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
