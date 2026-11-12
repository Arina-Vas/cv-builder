'use client';

import { useMutation } from '@apollo/client/react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { RESEND_VERIFICATION_CODE } from '@/features/auth/api/auth.operations';
import { AuthRoute } from '@/features/auth/auth.constants';
import { Button } from '@/shared/components/buttons';
import { useToast } from '@/shared/components/toast/ToastProvider';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import { parseError } from '@/shared/lib/apollo/graphql-errors';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';

interface VerifyEmailButtonProps {
  onAlreadyVerified: () => void;
}

export const VerifyEmailButton = ({ onAlreadyVerified }: VerifyEmailButtonProps) => {
  const router = useRouter();
  const t = useTranslations('users.profile');
  const tAuth = useTranslations('auth');
  const toast = useToast();
  const errorMessage = useErrorMessage();
  const [sendCode, { loading }] = useMutation(RESEND_VERIFICATION_CODE, {
    context: NO_ERROR_TOAST,
  });

  const handleClick = async () => {
    try {
      await sendCode();
      toast.success(t('verificationSent'));
      router.push(`${AuthRoute.verifyEmail}?sent=1`);
    } catch (error) {
      const appError = parseError(error);

      if (appError.code === 'RATE_LIMITED') {
        toast.warning(errorMessage(appError));
      } else if (appError.code === 'CONFLICT') {
        toast.info(tAuth('errors.alreadyVerified'));
        onAlreadyVerified();
      } else {
        toast.error(t('verificationFailed'));
      }
    }
  };

  return (
    <Button variant="secondary" loading={loading} onClick={handleClick}>
      {t('verifyEmail')}
    </Button>
  );
};
