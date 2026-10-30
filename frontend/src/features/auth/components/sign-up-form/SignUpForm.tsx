'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { SIGN_UP } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateConfirmPassword, validateEmail, validatePassword } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';

export function SignUpForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [signUp, { loading }] = useMutation(SIGN_UP);

  const { values, isValid, register, setServerErrors } = useFormFields(
    { email: '', password: '', confirmPassword: '' },
    ({ email, password, confirmPassword }, tValidation) => ({
      email: validateEmail(email, tValidation),
      password: validatePassword(password, tValidation),
      confirmPassword: validateConfirmPassword(password, confirmPassword, tValidation),
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

      // field errors (BAD_USER_INPUT) are caught by the client validation first, so they go to the toast
      if (appError.code === 'CONFLICT') {
        setServerErrors({ email: t('errors.emailTaken') });
      } else {
        toast.error(errorMessage(appError));
      }
    }
  };

  return (
    <AuthForm
      title={t('signUp.title')}
      subtitle={t('signUp.subtitle')}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            {t('signUp.submit')}
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.signIn)}>
            {t('signUp.haveAccount')}
          </Button>
        </>
      }
    >
      <Input label={t('fields.email')} type="email" autoComplete="email" {...register('email')} />
      <Input
        label={t('fields.password')}
        type="password"
        autoComplete="new-password"
        {...register('password')}
      />
      <Input
        label={t('fields.confirmPassword')}
        type="password"
        autoComplete="new-password"
        {...register('confirmPassword')}
      />
    </AuthForm>
  );
}
