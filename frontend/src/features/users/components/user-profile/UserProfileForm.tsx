'use client';

import { useMutation, useQuery } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { useMemo, useState } from 'react';
import { Controller, type Path } from 'react-hook-form';
import type { UserQuery } from '@/gql/graphql';
import { UPDATE_PROFILE, USER_FORM_OPTIONS } from '@/features/users/api/users.operations';
import { type ProfileFormValues, profileSchema } from '@/features/users/lib/user.schema';
import { Button } from '@/shared/components/buttons';
import layout from '@/shared/components/form/FormLayout.module.css';
import { Input } from '@/shared/components/inputs';
import { Select } from '@/shared/components/select/Select';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useAppForm } from '@/shared/lib/form';
import s from './UserProfile.module.css';
import { VerifyEmailButton } from './VerifyEmailButton';

type ProfileUser = UserQuery['user'];

interface UserProfileFormProps {
  user: ProfileUser;
  canEdit: boolean;
  canVerifyEmail: boolean;
  onEmailAlreadyVerified: () => void;
}

type Named = { id: string; name: string } | null | undefined;

const toOptions = (items: Named[] = []): SelectOption[] =>
  items.flatMap((item) => (item ? [{ value: item.id, label: item.name }] : []));

const toFormValues = (user: ProfileUser): ProfileFormValues => ({
  firstName: user.firstName ?? '',
  lastName: user.lastName ?? '',
  departmentId: user.department?.id ?? '',
  positionId: user.position?.id ?? '',
});

export const UserProfileForm = ({
  user,
  canEdit,
  canVerifyEmail,
  onEmailAlreadyVerified,
}: UserProfileFormProps) => {
  const t = useTranslations('users');
  const tActions = useTranslations('common.actions');
  const tValidation = useTranslations('validation');
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const [submitError, setSubmitError] = useState<string>();

  const schema = useMemo(() => profileSchema(tValidation), [tValidation]);
  const form = useAppForm({ schema, defaultValues: toFormValues(user) });
  const { errors, isDirty, isValid, isSubmitting } = form.formState;

  const { data: optionsData, loading: optionsLoading } = useQuery(USER_FORM_OPTIONS, {
    skip: !canEdit,
  });

  const departments = useMemo(
    () => toOptions(optionsData?.departments.items ?? [user.department]),
    [optionsData, user.department],
  );
  const positions = useMemo(
    () => toOptions(optionsData?.positions.items ?? [user.position]),
    [optionsData, user.position],
  );
  const selectDisabled = !canEdit || optionsLoading;

  const [updateProfile] = useMutation(UPDATE_PROFILE, { context: NO_ERROR_TOAST });

  const handleSubmit = form.handleSubmit(async (values) => {
    setSubmitError(undefined);
    try {
      const { data } = await updateProfile({ variables: { input: { id: user.id, ...values } } });
      form.reset(data ? toFormValues(data.updateProfile) : values);
      toast.success(t('profile.updated'));
    } catch (error) {
      const appError = parseError(error);
      const message = errorMessage(appError);
      const field = Object.keys(appError.fieldErrors).find(
        (name): name is Path<ProfileFormValues> => name in form.getValues(),
      );

      if (field) {
        form.setError(field, { type: 'server', message }, { shouldFocus: true });
      } else {
        setSubmitError(message);
      }
    }
  });

  return (
    <form className={`${layout.grid} ${s.form}`} noValidate onSubmit={handleSubmit}>
      <Input
        label={t('fields.firstName')}
        disabled={!canEdit}
        {...form.register('firstName')}
        error={errors.firstName?.message}
      />
      <Input
        label={t('fields.lastName')}
        disabled={!canEdit}
        {...form.register('lastName')}
        error={errors.lastName?.message}
      />
      <Controller
        control={form.control}
        name="departmentId"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.department')}
            options={departments}
            disabled={selectDisabled}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />
      <Controller
        control={form.control}
        name="positionId"
        render={({ field, fieldState }) => (
          <Select
            ref={field.ref}
            name={field.name}
            label={t('fields.position')}
            options={positions}
            disabled={selectDisabled}
            value={field.value}
            onValueChange={field.onChange}
            onBlur={field.onBlur}
            error={fieldState.error?.message}
          />
        )}
      />

      {canEdit && (
        <div className={`${layout.full} ${s.actions}`}>
          {submitError && (
            <p className={s.submitError} role="alert">
              {submitError}
            </p>
          )}
          {canVerifyEmail && <VerifyEmailButton onAlreadyVerified={onEmailAlreadyVerified} />}
          <Button
            type="submit"
            variant="primary"
            loading={isSubmitting}
            disabled={!isDirty || !isValid}
          >
            {tActions('update')}
          </Button>
        </div>
      )}
    </form>
  );
};
