import { EmailVerificationForm } from '@/features/auth/components/email-verification-form/EmailVerificationForm';

export default async function VerificationPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string | string[] }>;
}) {
  const { sent } = await searchParams;

  return <EmailVerificationForm codeJustSent={sent === '1'} />;
}
