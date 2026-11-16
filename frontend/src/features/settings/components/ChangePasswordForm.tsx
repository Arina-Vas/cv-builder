'use client';

import { useMutation } from '@apollo/client/react';
import { useTranslations } from 'next-intl';
import { useEffect, useMemo } from 'react';
import { CHANGE_PASSWORD } from '@/features/settings/api/settings.operations';
import {
  changePasswordSchema,
  type ChangePasswordValues,
  EMPTY_CHANGE_PASSWORD,
} from '@/features/settings/lib/change-password.schema';
import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useAppForm } from '@/shared/lib/form';
import s from './Settings.module.css';

const FIELDS = ['currentPassword', 'newPassword', 'confirmPassword'] as const;
const SERVER_ERROR = 'server';

type ServerErrorKey = 'changePassword.currentIncorrect' | 'changePassword.sameAsCurrent';

export const ChangePasswordForm = () => {
  const t = useTranslations('settings.changePassword');
  const tValidation = useTranslations('validation');
  const toast = useToast();
  const errorMessage = useErrorMessage();

  const schema = useMemo(() => changePasswordSchema(tValidation), [tValidation]);
  const form = useAppForm({ schema, defaultValues: EMPTY_CHANGE_PASSWORD });
  const { errors, isValid, isSubmitting } = form.formState;

  const [changePassword] = useMutation(CHANGE_PASSWORD, { context: NO_ERROR_TOAST });

  useEffect(() => {
    const { errors: current } = form.formState;
    const names = FIELDS.filter((name) => current[name] && current[name].type !== SERVER_ERROR);
    if (names.length > 0) void form.trigger(names);
  }, [schema, form]);

  const setServerError = (name: keyof ChangePasswordValues, key: ServerErrorKey) =>
    form.setError(name, { type: SERVER_ERROR, message: key }, { shouldFocus: true });

  const handleSubmit = form.handleSubmit(async (input) => {
    try {
      await changePassword({ variables: { input } });
    } catch (error) {
      const appError = parseError(error);
      if (appError.fieldErrors.currentPassword) {
        setServerError('currentPassword', 'changePassword.currentIncorrect');
      } else if (appError.fieldErrors.newPassword) {
        // The schema already checks the new password like the backend does, so the only error the
        // backend can still return for it is "equal to the current one"
        setServerError('newPassword', 'changePassword.sameAsCurrent');
      } else {
        toast.error(errorMessage(appError));
      }
      return;
    }

    form.reset(EMPTY_CHANGE_PASSWORD);
    toast.success(t('success'));
  });

  const errorText = (name: keyof ChangePasswordValues) => {
    const error = errors[name];
    if (!error?.message) return undefined;
    return error.type === SERVER_ERROR
      ? tValidation(error.message as ServerErrorKey)
      : error.message;
  };

  const field = (name: keyof ChangePasswordValues) => ({
    ...form.register(name, {
      // A new password re-checks "Passwords do not match", but only once the confirmation has a value:
      // `deps` would also flag an untouched empty confirmation as required
      onChange:
        name === 'newPassword'
          ? () => {
              if (form.getValues('confirmPassword')) void form.trigger('confirmPassword');
            }
          : undefined,
    }),
    error: errorText(name),
  });

  return (
    <section className={s.section} aria-labelledby="change-password-title">
      <h2 id="change-password-title" className={s.title}>
        {t('title')}
      </h2>

      <form className={s.passwordForm} noValidate onSubmit={handleSubmit}>
        <Input
          label={t('currentPassword')}
          type="password"
          autoComplete="current-password"
          {...field('currentPassword')}
        />
        <Input
          label={t('newPassword')}
          type="password"
          autoComplete="new-password"
          {...field('newPassword')}
        />
        <Input
          label={t('confirmPassword')}
          type="password"
          autoComplete="new-password"
          {...field('confirmPassword')}
        />

        <div className={s.actions}>
          <Button type="submit" variant="primary" gated loading={isSubmitting} disabled={!isValid}>
            {t('submit')}
          </Button>
        </div>
      </form>
    </section>
  );
};
