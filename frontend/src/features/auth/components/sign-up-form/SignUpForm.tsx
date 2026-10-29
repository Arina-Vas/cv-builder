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

export function SignUpForm() {
  const router = useRouter();
  const toast = useToast();
  const [signUp, { loading }] = useMutation(SIGN_UP);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { email: '', password: '', confirmPassword: '' },
    ({ email, password, confirmPassword }) => ({
      email: validateEmail(email),
      password: validatePassword(password),
      confirmPassword: validateConfirmPassword(password, confirmPassword),
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
      const { code, message, fieldErrors } = parseError(error);

      if (code === 'BAD_USER_INPUT' || code === 'CONFLICT') {
        setServerErrors(fieldErrors);
      } else {
        toast.error(message);
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
