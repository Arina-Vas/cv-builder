'use client';

import { useTranslations } from 'next-intl';
import { Button } from '@/shared/components/buttons';
import { cvPreviewFixture } from '@/features/cvs/lib/preview/cv-preview.fixtures';
import { CvPreviewDocument } from './document/CvPreviewDocument';
import s from './CvPreview.module.css';

type Props = {
  cvId: string;
};

export const CvPreview = ({ cvId }: Props) => {
  const t = useTranslations('cvs.preview');

  const data = { cvPreview: { ...cvPreviewFixture, id: cvId } };

  return (
    <div className={s.page}>
      <div className={s.toolbar}>
        <Button variant="secondary" disabled>
          {t('exportPdf')}
        </Button>
      </div>

      <CvPreviewDocument data={data.cvPreview} />
    </div>
  );
};
