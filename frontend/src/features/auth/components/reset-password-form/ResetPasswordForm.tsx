'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { LOGOUT, RESET_PASSWORD } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateConfirmPassword, validatePassword } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';

export interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD);
  const [logout] = useMutation(LOGOUT);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { password: '', confirmPassword: '' },
    ({ password, confirmPassword }, t) => ({
      password: validatePassword(password, t, t('password.newRequired')),
      confirmPassword: validateConfirmPassword(password, confirmPassword, t),
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

      if (appError.code === 'BAD_USER_INPUT' && !appError.fieldErrors.token) {
        setServerErrors({
          password: appError.fieldErrors.newPassword,
          confirmPassword: appError.fieldErrors.confirmPassword,
        });
      } else {
        toast.error(appError.fieldErrors.token ?? errorMessage(appError));
      }
      return;
    }

    await logout().catch(() => undefined);
    toast.success('Your password has been reset. Please sign in.');
    router.replace(AuthRoute.signIn);
  };

  return (
    <AuthForm
      title="Reset password"
      subtitle="Here you should write a new password and confirm it"
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            SUBMIT
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.signIn)}>
            GO TO SIGN IN
          </Button>
        </>
      }
    >
      <Input
        label="New password"
        type="password"
        autoComplete="new-password"
        {...register('password')}
      />
      <Input
        label="Confirm password"
        type="password"
        autoComplete="new-password"
        {...register('confirmPassword')}
      />
    </AuthForm>
  );
}
