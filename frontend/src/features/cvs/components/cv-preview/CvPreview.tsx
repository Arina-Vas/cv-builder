'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/buttons';
import { cvPreviewFixture } from '@/features/cvs/lib/preview/cv-preview.fixtures';
import { CvPreviewDocument } from './document/CvPreviewDocument';
import { ErrorState } from '@/shared/components/error-state/ErrorState';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import { notFound } from 'next/navigation';
import { CvPreviewSkeleton } from './CvPreviewSkeleton';

type Props = {
  cvId: string;
};

export const CvPreview = ({ cvId }: Props) => {
  const t = useTranslations('cvs.preview');

  const { data, error, loading, refetch } = {
    data: { cvPreview: { ...cvPreviewFixture, id: cvId } },
    error: undefined as unknown,
    loading: false,
    refetch: async () => {},
  };

  if (error) {
    if (hasErrorCode(error, 'NOT_FOUND')) notFound();
    if (hasErrorCode(error, 'FORBIDDEN'))
      return <ErrorState inline title={t('forbidden.title')} message={t('forbidden.message')} />;
    return (
      <ErrorState
        inline
        title={t('loadErrorTitle')}
        message={t('loadError')}
        action={{ label: t('retry'), onClick: () => void refetch(), loading }}
      />
    );
  }

  if (!data) return <CvPreviewSkeleton />;

  // TODO(B7): empty state
  // if (isPreviewEmpty(data.cvPreview)) return <CvPreviewEmpty />;

  return (
    <CvPreviewDocument
      data={data.cvPreview}
      actions={
        <Button variant="secondary" size="sm" disabled>
          {t('exportPdf')}
        </Button>
      }
    />
  );
};
