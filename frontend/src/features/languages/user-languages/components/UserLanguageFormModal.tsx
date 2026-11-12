import { FormModal } from '@/shared/components/form';
import { Controller } from 'react-hook-form';
import { Select } from '@/shared/components/select/Select';
import { skipToken, useMutation, useQuery } from '@apollo/client/react';
import {
  AVAILABLE_USER_LANGUAGES,
  CREATE_USER_LANGUAGE,
  UPDATE_USER_LANGUAGE,
  USER_LANGUAGE_MUTATION_OPTIONS,
} from '@/features/languages/user-languages/api/userLanguages.operations';
import { useTranslations } from 'next-intl';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import type { UserLanguageFormValues } from '../lib/userLanguage.schema';
import { userLanguageSchema } from '../lib/userLanguage.schema';
import { useAppForm } from '@/shared/lib/form';
import { useMemo } from 'react';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { PROFICIENCIES } from '../lib/proficiency';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import type { UserLanguageFieldsFragment } from '@/gql/graphql';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  userLanguage?: UserLanguageFieldsFragment;
};

export const UserLanguageFormModal = ({ open, onOpenChange, userId, userLanguage }: Props) => {
  const t = useTranslations('userLanguage.form');
  const tProficiency = useTranslations('userLanguage.proficiencyLevel');
  const tValidation = useTranslations('validation');
  const errorMessage = useErrorMessage();

  const schema = useMemo(() => userLanguageSchema(tValidation), [tValidation]);
  const form = useAppForm({
    schema,
    defaultValues: {
      languageId: userLanguage?.language.id ?? '',
      proficiency: userLanguage?.proficiency ?? '',
    },
  });
  const {
    data: languagesData,
    loading: languagesLoading,
    error: languageError,
  } = useQuery(
    AVAILABLE_USER_LANGUAGES,
    open && !userLanguage ? { variables: { userId } } : skipToken,
  );

  const languageOptions: SelectOption[] = userLanguage
    ? [{ value: userLanguage.language.id, label: userLanguage.language.name }]
    : (languagesData?.availableUserLanguages.map((l) => ({ value: l.id, label: l.name })) ?? []);

  const proficiencyOptions: SelectOption[] = PROFICIENCIES.map((proficiency) => ({
    value: proficiency,
    label: tProficiency(proficiency),
  }));

  const [createUserLanguage] = useMutation(CREATE_USER_LANGUAGE, USER_LANGUAGE_MUTATION_OPTIONS);
  const [updateUserLanguage] = useMutation(UPDATE_USER_LANGUAGE, USER_LANGUAGE_MUTATION_OPTIONS);

  const onSubmit = async (values: UserLanguageFormValues) => {
    return userLanguage
      ? await updateUserLanguage({
          variables: { input: { id: userLanguage.id, userId, proficiency: values.proficiency } },
        })
      : await createUserLanguage({ variables: { input: { userId, ...values } } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={onSubmit}
      title={userLanguage ? t('updateTitle') : t('createTitle')}
      form={form}
      mode={userLanguage ? 'update' : 'create'}
      values={{
        languageId: userLanguage?.language.id ?? '',
        proficiency: userLanguage?.proficiency ?? '',
      }}
      requireDirty={!!userLanguage}
    >
      <Controller
        control={form.control}
        name="languageId"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.languageId')}
            options={languageOptions}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            disabled={languagesLoading || !!userLanguage}
            error={
              fieldState.error?.message ??
              (languageError && errorMessage(parseError(languageError)))
            }
          />
        )}
      />
      <Controller
        control={form.control}
        name="proficiency"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.proficiency')}
            options={proficiencyOptions}
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
