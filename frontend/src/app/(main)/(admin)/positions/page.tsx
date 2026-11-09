import { Positions } from '@/features/positions/components/Positions';
import { Suspense } from 'react';

export default function PositionsPage() {
  return (
    <Suspense>
      <Positions />
    </Suspense>
  );
}
