'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { SIGN_UP } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateConfirmPassword, validateEmail, validatePassword } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';

export function SignUpForm() {
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [signUp, { loading }] = useMutation(SIGN_UP);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { email: '', password: '', confirmPassword: '' },
    ({ email, password, confirmPassword }, t) => ({
      email: validateEmail(email, t),
      password: validatePassword(password, t),
      confirmPassword: validateConfirmPassword(password, confirmPassword, t),
    }),
  );

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      await signUp({
        variables: {
          input: {
            email: values.email.trim(),
            password: values.password,
            confirmPassword: values.confirmPassword,
          },
        },
      });
      // signUp starts a session and sends the code: the user verifies while signed in.
      router.replace(`${AuthRoute.verifyEmail}?sent=1`);
    } catch (error) {
      const appError = parseError(error);

      if (appError.code === 'BAD_USER_INPUT' || appError.code === 'CONFLICT') {
        setServerErrors(appError.fieldErrors);
      } else {
        toast.error(errorMessage(appError));
      }
    }
  };

  return (
    <AuthForm
      title="Sign up now"
      subtitle="Welcome! Sign up to continue"
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            CREATE ACCOUNT
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.signIn)}>
            I HAVE AN ACCOUNT
          </Button>
        </>
      }
    >
      <Input label="Email" type="email" autoComplete="email" {...register('email')} />
      <Input
        label="Password"
        type="password"
        autoComplete="new-password"
        {...register('password')}
      />
      <Input
        label="Confirm Password"
        type="password"
        autoComplete="new-password"
        {...register('confirmPassword')}
      />
    </AuthForm>
  );
}
