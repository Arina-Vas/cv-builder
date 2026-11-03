import { ResetPasswordForm } from '@/features/auth/components/reset-password-form/ResetPasswordForm';

export default async function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token } = await searchParams;

  return <ResetPasswordForm token={typeof token === 'string' ? token : ''} />;
}
