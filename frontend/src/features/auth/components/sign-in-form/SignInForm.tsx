'use client';

import { Button } from '@/shared/components/buttons';
import { Input } from '@/shared/components/inputs';
import { AuthForm } from '../auth-form/AuthForm';

export function SignInForm() {
  return (
    <AuthForm
      title="Welcome back"
      subtitle="Hello again! Sign in to continue"
      actions={
        <>
          <Button type="submit">SIGN IN</Button>
          <Button variant="ghost">FORGOT PASSWORD</Button>
        </>
      }
    >
      <Input label="Email" type="email" name="email" autoComplete="email" />
      <Input label="Password" type="password" name="password" autoComplete="current-password" />
    </AuthForm>
  );
}
