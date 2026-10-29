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

export interface ResetPasswordFormProps {
  token: string;
}

export function ResetPasswordForm({ token }: ResetPasswordFormProps) {
  const router = useRouter();
  const toast = useToast();
  const [resetPassword, { loading }] = useMutation(RESET_PASSWORD);
  const [logout] = useMutation(LOGOUT);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { password: '', confirmPassword: '' },
    ({ password, confirmPassword }) => ({
      password: validatePassword(password, 'New password is required'),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
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
      const { code, message, fieldErrors } = parseError(error);

      if (code === 'BAD_USER_INPUT' && !fieldErrors.token) {
        setServerErrors({
          password: fieldErrors.newPassword,
          confirmPassword: fieldErrors.confirmPassword,
        });
      } else {
        toast.error(fieldErrors.token ?? message);
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
