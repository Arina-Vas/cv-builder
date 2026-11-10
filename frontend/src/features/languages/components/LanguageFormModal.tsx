import { FormModal } from '@/shared/components/form';
import { Input } from '@/shared/components/inputs';
import type { LanguageFieldsFragment } from '@/gql/graphql';
import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import { useAppForm } from '@/shared/lib/form';
import { useMutation } from '@apollo/client/react';
import { type LanguageFormValues, languageSchema } from '@/features/languages/lib/language.schema';
import {
  CREATE_LANGUAGE,
  LANGUAGE_MUTATION_OPTIONS,
  UPDATE_LANGUAGE,
} from '@/features/languages/api/languages.operations';
import s from './LanguageFormModal.module.css';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  language?: LanguageFieldsFragment;
};
export const LanguageFormModal = ({ open, onOpenChange, language }: Props) => {
  const t = useTranslations('languages');
  const tValidation = useTranslations('validation');
  const schema = useMemo(() => languageSchema(tValidation), [tValidation]);
  const form = useAppForm({ schema, defaultValues: { name: '', iso: '', nativeName: '' } });

  const [createLanguage] = useMutation(CREATE_LANGUAGE, LANGUAGE_MUTATION_OPTIONS);
  const [updateLanguage] = useMutation(UPDATE_LANGUAGE, LANGUAGE_MUTATION_OPTIONS);

  const handleSubmit = (values: LanguageFormValues) => {
    return language
      ? updateLanguage({ variables: { input: { ...values, id: language.id } } })
      : createLanguage({ variables: { input: values } });
  };

  return (
    <FormModal
      open={open}
      onOpenChange={onOpenChange}
      onSubmit={handleSubmit}
      title={language ? t('edit.title') : t('create.title')}
      form={form}
      mode={language ? 'update' : 'create'}
      values={{
        name: language?.name ?? '',
        iso: language?.iso ?? '',
        nativeName: language?.nativeName ?? '',
      }}
      requireDirty={!!language}
    >
      <Input
        label={t('fields.name')}
        {...form.register('name')}
        error={form.formState.errors.name?.message}
      />
      <Input
        label={t('fields.iso')}
        className={s.isoUpperCase}
        {...form.register('iso')}
        error={form.formState.errors.iso?.message}
      />
      <Input
        label={t('fields.nativeName')}
        {...form.register('nativeName')}
        error={form.formState.errors.nativeName?.message}
      />
    </FormModal>
  );
};
