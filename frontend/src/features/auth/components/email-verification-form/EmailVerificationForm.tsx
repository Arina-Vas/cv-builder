'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { Button } from '@/shared/components/buttons';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { RESEND_VERIFICATION_CODE, VERIFY_EMAIL } from '../../api/auth.operations';
import { AuthRoute, RESEND_CODE_COOLDOWN_SECONDS } from '../../auth.constants';
import { validateCode } from '../../lib/validation';
import { AuthForm } from '../auth-form/AuthForm';
import { OtpInput } from '../otp-input/OtpInput';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import { useTranslations } from 'next-intl';

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
      toast.success('Email verified');
      router.replace(AuthRoute.home);
    } catch (error) {
      const appError = parseError(error);

      if (appError.code === 'BAD_USER_INPUT') {
        setServerError(appError.fieldErrors.code ?? appError.message);
      } else if (appError.code === 'CONFLICT') {
        toast.info(appError.message);
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
      toast.success('Verification code sent');
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
      title="Email verification"
      subtitle="Enter the verification code we sent to your email."
      onSubmit={handleSubmit}
      actions={
        <>
          <Button type="submit" disabled={!isValid} loading={loading}>
            CONFIRM
          </Button>
          <Button variant="text" disabled={cooldown > 0} loading={resending} onClick={handleResend}>
            {cooldown > 0 ? `RESEND CODE (${cooldown}s)` : 'RESEND CODE'}
          </Button>
          <Button variant="ghost" onClick={() => router.push(AuthRoute.home)}>
            LATER
          </Button>
        </>
      }
    >
      <OtpInput value={code} onChange={handleCodeChange} error={serverError} disabled={loading} />
    </AuthForm>
  );
}
