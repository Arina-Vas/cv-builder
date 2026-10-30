'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { LOGOUT, RESET_PASSWORD } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateConfirmPassword, validatePassword } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';

export interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD);
  const [logout] = useMutation(LOGOUT);

  const { values, isValid, register } = useFormFields(
    { password: '', confirmPassword: '' },
    ({ password, confirmPassword }, tValidation) => ({
      password: validatePassword(password, tValidation, tValidation('password.newRequired')),
      confirmPassword: validateConfirmPassword(password, confirmPassword, tValidation),
    }),
  );

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      await resetPassword({
        variables: {
          input: {
            token,
            newPassword: values.password,
            confirmPassword: values.confirmPassword,
          },
        },
      });
    } catch (error) {
      const appError = parseError(error);

      // the backend does not say whether the link is invalid or expired, so one text covers both;
      // password field errors are caught by the client validation first, so they go to the toast
      toast.error(
        appError.fieldErrors.token ? t('errors.resetLinkInvalid') : errorMessage(appError),
      );
      return;
    }

    await logout().catch(() => undefined);
    toast.success(t('resetPassword.success'));
    router.replace(AuthRoute.signIn);
  };

  return (
    <AuthForm
      title={t('resetPassword.title')}
      subtitle={t('resetPassword.subtitle')}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            {t('resetPassword.submit')}
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.signIn)}>
            {t('resetPassword.goToSignIn')}
          </Button>
        </>
      }
    >
      <Input
        label={t('resetPassword.newPassword')}
        type="password"
        autoComplete="new-password"
        {...register('password')}
      />
      <Input
        label={t('resetPassword.confirmPassword')}
        type="password"
        autoComplete="new-password"
        {...register('confirmPassword')}
      />
    </AuthForm>
  );
}
