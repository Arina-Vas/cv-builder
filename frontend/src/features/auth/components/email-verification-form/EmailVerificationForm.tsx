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

function useCooldown() {
  const [secondsLeft, setSecondsLeft] = useState(0);

  useEffect(() => {
    if (secondsLeft <= 0) return;
    const timer = setTimeout(() => setSecondsLeft((seconds) => seconds - 1), 1000);
    return () => clearTimeout(timer);
  }, [secondsLeft]);

  return [secondsLeft, setSecondsLeft] as const;
}

export function EmailVerificationForm() {
  const router = useRouter();
  const toast = useToast();
  const [verifyEmail, { loading }] = useMutation(VERIFY_EMAIL);
  const [resendCode, { loading: resending }] = useMutation(RESEND_VERIFICATION_CODE);

  const [code, setCode] = useState('');
  const [serverError, setServerError] = useState<string>();
  const [cooldown, setCooldown] = useCooldown();

  const isValid = !validateCode(code);

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
      const { code: errorCode, message, fieldErrors } = parseError(error);

      if (errorCode === 'BAD_USER_INPUT') {
        setServerError(fieldErrors.code ?? message);
      } else if (errorCode === 'CONFLICT') {
        toast.info(message);
        router.replace(AuthRoute.home);
      } else {
        toast.error(message);
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
      const { code: errorCode, message, retryAfter } = parseError(error);

      if (errorCode === 'RATE_LIMITED') {
        setCooldown(retryAfter ?? RESEND_CODE_COOLDOWN_SECONDS);
        toast.warning(message);
      } else {
        toast.error(message);
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
