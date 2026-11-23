'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/buttons';
import { cvPreviewFixture } from '@/features/cvs/lib/preview/cv-preview.fixtures';
import { CvPreviewDocument } from './document/CvPreviewDocument';

type Props = {
  cvId: string;
};

export const CvPreview = ({ cvId }: Props) => {
  const t = useTranslations('cvs.preview');

  const data = { cvPreview: { ...cvPreviewFixture, id: cvId } };

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
