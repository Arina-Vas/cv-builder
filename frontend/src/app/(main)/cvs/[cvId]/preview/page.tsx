'use client';

import { Suspense } from 'react';
import { useParams } from 'next/navigation';
import { CvPreview } from '@/features/cvs/components/cv-preview/CvPreview';

export default function CvPreviewPage() {
  const { cvId } = useParams<{ cvId: string }>();
  return (
    <Suspense>
      <CvPreview cvId={cvId} />
    </Suspense>
  );
}
