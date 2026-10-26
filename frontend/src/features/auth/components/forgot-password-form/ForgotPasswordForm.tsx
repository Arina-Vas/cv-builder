'use client';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { AuthForm } from '../auth-form/AuthForm';

export function ForgotPasswordForm() {
  return (
    <AuthForm
      title="Forgot password"
      subtitle="We will send you an email with further instructions"
      actions={
        <>
          <Button type="submit">RESET PASSWORD</Button>
          <Button variant="ghost">CANCEL</Button>
        </>
      }
    >
      <Input label="Email" type="email" name="email" autoComplete="email" />
    </AuthForm>
  );
}
