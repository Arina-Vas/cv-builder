'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { REQUEST_PASSWORD_RESET } from '../../api/auth.operations';
import { AuthRoute } from '../../auth.constants';
import { useFormFields } from '../../lib/useFormFields';
import { validateEmail } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';

export function ForgotPasswordForm() {
  const router = useRouter();
  const t = useTranslations('auth');
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [requestPasswordReset, { loading }] = useMutation(REQUEST_PASSWORD_RESET);

  const { values, isValid, register } = useFormFields({ email: '' }, ({ email }, tValidation) => ({
    email: validateEmail(email, tValidation),
  }));

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      await requestPasswordReset({ variables: { input: { email: values.email.trim() } } });
      toast.success(t('forgotPassword.sent'));
    } catch (error) {
      const appError = parseError(error);

      if (appError.code === 'RATE_LIMITED') {
        toast.warning(errorMessage(appError));
      } else {
        toast.error(errorMessage(appError));
      }
    }
  };

  return (
    <AuthForm
      title={t('forgotPassword.title')}
      subtitle={t('forgotPassword.subtitle')}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            {t('forgotPassword.submit')}
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.signIn)}>
            {t('forgotPassword.cancel')}
          </Button>
        </>
      }
    >
      <Input label={t('fields.email')} type="email" autoComplete="email" {...register('email')} />
    </AuthForm>
  );
}
