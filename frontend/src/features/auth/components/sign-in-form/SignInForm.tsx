'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { SIGN_IN } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateEmail, validatePassword } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';

export function SignInForm() {
  const router = useRouter();
  const toast = useToast();
  const [signIn, { loading }] = useMutation(SIGN_IN);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { email: '', password: '' },
    ({ email, password }) => ({
      email: validateEmail(email),
      password: validatePassword(password),
    }),
  );

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      await signIn({
        variables: { input: { email: values.email.trim(), password: values.password } },
      });
      router.replace(AuthRoute.home);
    } catch (error) {
      const { code, message, fieldErrors } = parseError(error);

      if (code === 'BAD_USER_INPUT') {
        setServerErrors(fieldErrors);
      } else if (code === 'UNAUTHENTICATED') {
        setServerErrors({ password: message });
      } else {
        toast.error(message);
      }
    }
  };

  return (
    <AuthForm
      title="Welcome back"
      subtitle="Hello again! Sign in to continue"
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            SIGN IN
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.forgotPassword)}>
            FORGOT PASSWORD
          </Button>
        </>
      }
    >
      <Input label="Email" type="email" autoComplete="email" {...register('email')} />
      <Input
        label="Password"
        type="password"
        autoComplete="current-password"
        {...register('password')}
      />
    </AuthForm>
  );
}
