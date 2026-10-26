'use client';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { AuthForm } from '../auth-form/AuthForm';

export function SignUpForm() {
  return (
    <AuthForm
      title="Sign up now"
      subtitle="Welcome! Sign up to continue"
      actions={
        <>
          <Button type="submit">CREATE ACCOUNT</Button>
          <Button variant="ghost">I HAVE AN ACCOUNT</Button>
        </>
      }
    >
      <Input label="Email" type="email" name="email" autoComplete="email" />
      <Input label="Password" type="password" name="password" autoComplete="new-password" />
      <Input
        label="Confirm Password"
        type="password"
        name="confirmPassword"
        autoComplete="new-password"
      />
    </AuthForm>
  );
}
