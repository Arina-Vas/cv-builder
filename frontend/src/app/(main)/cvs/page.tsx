import { Cvs } from '@/features/cvs/components/Cvs';
import { Suspense } from 'react';

export default function CvsPage() {
  return (
    <Suspense>
      <Cvs />
    </Suspense>
  );
}
