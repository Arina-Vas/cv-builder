'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useEffect, useState } from 'react';

import { Button } from '@/shared/components/buttons';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { RESEND_VERIFICATION_CODE, VERIFY_EMAIL } from '../../api/auth.operations';
import { AuthRoute, RESEND_CODE_COOLDOWN_SECONDS } from '../../auth.constants';
import { validateCode } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';
import { OtpInput } from '../otp-input/OtpInput';

function useCooldown(initialSeconds: number) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return [secondsLeft, setSecondsLeft] as const;
}

export interface EmailVerificationFormProps {
  codeJustSent?: boolean;
}

export function EmailVerificationForm({ codeJustSent = false }: EmailVerificationFormProps) {
  const router = useRouter();
  const t = useTranslations('auth');
  const tValidation = useTranslations('validation');
  const errorMessage = useErrorMessage();
  const toast = useToast();
  const [verifyEmail, { loading }] = useMutation(VERIFY_EMAIL);
  const [resendCode, { loading: resending }] = useMutation(RESEND_VERIFICATION_CODE);

  const [code, setCode] = useState('');
  const [serverError, setServerError] = useState<string>();
  const [cooldown, setCooldown] = useCooldown(codeJustSent ? RESEND_CODE_COOLDOWN_SECONDS : 0);

  const isValid = !validateCode(code, tValidation);

  const handleCodeChange = (value: string) => {
    setCode(value);
    setServerError(undefined);
  };

  const handleSubmit = async () => {
    if (!isValid || loading) return;

    try {
      await verifyEmail({ variables: { input: { code } } });
      toast.success(t('verifyEmail.verified'));
      router.replace(AuthRoute.home);
    } catch (error) {
      const appError = parseError(error);

      if (appError.code === 'BAD_USER_INPUT') {
        setServerError(t('errors.codeInvalid'));
      } else if (appError.code === 'CONFLICT') {
        toast.info(t('errors.alreadyVerified'));
        router.replace(AuthRoute.home);
      } else {
        toast.error(errorMessage(appError));
      }
    }
  };

  const handleResend = async () => {
    if (cooldown > 0 || resending) return;

    try {
      await resendCode();
      handleCodeChange('');
      setCooldown(RESEND_CODE_COOLDOWN_SECONDS);
      toast.success(t('verifyEmail.codeSent'));
    } catch (error) {
      const appError = parseError(error);

      if (appError.code === 'RATE_LIMITED') {
        setCooldown(appError.retryAfter ?? RESEND_CODE_COOLDOWN_SECONDS);
        toast.warning(errorMessage(appError));
      } else {
        toast.error(errorMessage(appError));
      }
    }
  };

  return (
    <AuthForm
      title={t('verifyEmail.title')}
      subtitle={t('verifyEmail.subtitle')}
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            {t('verifyEmail.confirm')}
          </Button>
          <Button variant="text" disabled={cooldown > 0} loading={resending} onClick={handleResend}>
            {t('verifyEmail.resend', { seconds: cooldown })}
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.home)}>
            {t('verifyEmail.later')}
          </Button>
        </>
      }
    >
      <OtpInput value={code} onChange={handleCodeChange} error={serverError} disabled={loading} />
    </AuthForm>
  );
}
