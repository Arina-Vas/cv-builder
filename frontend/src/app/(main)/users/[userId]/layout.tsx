import type { ReactNode } from 'react';

import { UserDetailsTabs } from '@/features/users/components/user-details-tabs/UserDetailsTabs';
import { isUuid } from '@/shared/lib/isUuid';
import { notFound } from 'next/navigation';

interface UserDetailsLayoutProps {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function UserDetailsLayout({ children, params }: UserDetailsLayoutProps) {
  const { userId } = await params;
  if (!isUuid(userId)) notFound();
  return <UserDetailsTabs userId={userId}>{children}</UserDetailsTabs>;
}
