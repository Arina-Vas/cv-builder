'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { REQUEST_PASSWORD_RESET } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateEmail } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';

const CONFIRMATION_MESSAGE =
  'If an account with this email exists, you will receive password reset instructions.';

export function ForgotPasswordForm() {
  const router = useRouter();
  const toast = useToast();
  const [requestPasswordReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { email: '' },
    ({ email }) => ({ email: validateEmail(email) }),
  );

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      await requestPasswordReset({ variables: { input: { email: values.email.trim() } } });
      toast.success(CONFIRMATION_MESSAGE);
    } catch (error) {
      const { code, message, fieldErrors } = parseError(error);

      if (code === 'BAD_USER_INPUT') {
        setServerErrors(fieldErrors);
      } else if (code === 'RATE_LIMITED') {
        toast.warning(message);
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <AuthForm
      title="Forgot password"
      subtitle="We will send you an email with further instructions"
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            RESET PASSWORD
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.signIn)}>
            CANCEL
          </Button>
        </>
      }
    >
      <Input label="Email" type="email" autoComplete="email" {...register('email')} />
    </AuthForm>
  );
}
