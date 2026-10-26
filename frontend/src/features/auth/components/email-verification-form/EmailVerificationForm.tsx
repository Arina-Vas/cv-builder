'use client';

import { Button } from '@/shared/components/buttons';
import { AuthForm } from '../auth-form/AuthForm';
import { OtpInput } from '../otp-input/OtpInput';

export function EmailVerificationForm() {
  return (
    <AuthForm
      title="Email verification"
      subtitle="Enter the verification code we sent to your email."
      actions={
        <>
          <Button type="submit">CONFIRM</Button>
          <Button variant="ghost">LATER</Button>
        </>
      }
    >
      <OtpInput />
    </AuthForm>
  );
}
