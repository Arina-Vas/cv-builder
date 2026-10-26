'use client';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { AuthForm } from '../auth-form/AuthForm';

export function ResetPasswordForm() {
  return (
    <AuthForm
      title="Reset password"
      subtitle="Here you should write a new password and confirm it"
      actions={
        <>
          <Button type="submit">SUBMIT</Button>
          <Button variant="ghost">GO TO SIGN IN</Button>
        </>
      }
    >
      <Input label="New password" type="password" name="password" autoComplete="new-password" />
      <Input
        label="Confirm password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
