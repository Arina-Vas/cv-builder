'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { SIGN_IN } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateEmail, validatePassword } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';

export function SignInForm() {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const [signIn, { loading }] = useMutation(SIGN_IN);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { email: '', password: '' },
    ({ email, password }, tValidation) => ({
      email: validateEmail(email, tValidation),
      password: validatePassword(password, tValidation),
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
      const appError = parseError(error);

      // field errors (BAD_USER_INPUT) are caught by the client validation first, so they go to the toast
      if (appError.code === 'UNAUTHENTICATED') {
        setServerErrors({ password: t('errors.invalidCredentials') });
      } else {
        toast.error(errorMessage(appError));
      }
    }
  };

  return (
    <AuthForm
      title={t('signIn.title')}
      subtitle={t('signIn.subtitle')}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            {t('signIn.submit')}
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.forgotPassword)}>
            {t('signIn.forgotPassword')}
          </Button>
        </>
      }
    >
      <Input label={t('fields.email')} type="email" autoComplete="email" {...register('email')} />
      <Input
        label={t('fields.password')}
        type="password"
        autoComplete="current-password"
        {...register('password')}
      />
    </AuthForm>
  );
}
