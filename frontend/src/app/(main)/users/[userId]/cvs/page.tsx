'use client';

import { Cvs } from '@/features/cvs/components/Cvs';
import { Suspense } from 'react';
import { useParams } from 'next/navigation';

export default function UserCvsPage() {
  const { userId } = useParams<{ userId: string }>();

  return (
    <Suspense>
      <Cvs userId={userId} />
    </Suspense>
  );
}
