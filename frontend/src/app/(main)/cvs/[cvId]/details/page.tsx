'use client';

import { Suspense } from 'react';
import { CvDetails } from '@/features/cvs/components/cv-details/CvDetails';
import { useParams } from 'next/navigation';

export default function CvDetailsPage() {
  const { cvId } = useParams<{ cvId: string }>();
  return (
    <Suspense>
      <CvDetails cvId={cvId} />
    </Suspense>
  );
}
