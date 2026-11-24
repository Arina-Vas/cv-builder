'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/buttons';
import { CvPreviewDocument } from './document/CvPreviewDocument';
import { ErrorState } from '@/shared/components/error-state/ErrorState';
import { hasErrorCode } from '@/shared/lib/apollo/graphql-errors';
import { notFound } from 'next/navigation';
import { CvPreviewSkeleton } from './CvPreviewSkeleton';
import { useExportCvPdf } from '@/features/cv-pdf/lib/hooks/useExportCvPdf';
import { CV_PREVIEW } from '@/features/cvs/api/cvs.operations';
import { useQuery } from '@apollo/client/react';

type Props = {
  cvId: string;
};

export const CvPreview = ({ cvId }: Props) => {
  const t = useTranslations('cvs.preview');

  const { data, error, loading, refetch } = useQuery(CV_PREVIEW, {
    variables: { id: cvId },
    fetchPolicy: 'cache-and-network',
  });

  const { loading: downloading, exportPdf } = useExportCvPdf(cvId);

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

  return (
    <CvPreviewDocument
      data={data.cvPreview}
      actions={
        <Button variant="secondary" size="sm" loading={downloading} onClick={exportPdf}>
          {t('exportPdf')}
        </Button>
      }
    />
  );
};
