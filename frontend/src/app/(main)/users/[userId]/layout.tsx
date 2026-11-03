import type { ReactNode } from 'react';

import { UserDetailsTabs } from '@/features/users/components/user-details-tabs/UserDetailsTabs';

interface UserDetailsLayoutProps {
  children: ReactNode;
  params: Promise<{ userId: string }>;
}

export default async function UserDetailsLayout({ children, params }: UserDetailsLayoutProps) {
  const { userId } = await params;

  return <UserDetailsTabs userId={userId}>{children}</UserDetailsTabs>;
}
