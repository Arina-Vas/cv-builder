'use client';

import { NoInternetPage } from '@/features/system-pages/components/no-internet-page/NoInternetPage';

export default function ErrorPage({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <NoInternetPage onRetry={reset} />;
}
