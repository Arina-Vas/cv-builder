import { Suspense } from 'react';
import { Users } from '@/features/users/components/Users';

export default function UsersPage() {
  return (
    <Suspense>
      <Users />
    </Suspense>
  );
}
