'use client';

import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { type CvPreviewData } from '@/features/cvs/lib/preview/cv-preview.types';
import s from './CvPreviewDocument.module.css';
import { getFullName } from '@/features/users/lib/getFullName';
import { CvSummary } from '@/features/cvs/components/cv-preview/document/CvSummary';
import { CvProjectEntry } from '@/features/cvs/components/cv-preview/document/CvProjectEntry';
import { ProfessionalSkills } from '@/features/cvs/components/cv-preview/document/ProfessionalSkills';

type Props = {
  data: CvPreviewData;
};
export const CvPreviewDocument = ({ data }: Props) => {
  const t = useTranslations('cvs.preview.document');
  const projectsTitleId = useId();

  return (
    <article className={s.document}>
      <header>
        <h1>{getFullName(data.user)}</h1>
        <p>{data.user.position?.name.toUpperCase()}</p>
      </header>
      <CvSummary
        name={data.name}
        domains={data.domains}
        languages={data.languages}
        description={data.description}
        education={data.education}
        skillGroups={data.skillGroups}
      />
      <section aria-labelledby={projectsTitleId}>
        <h2 id={projectsTitleId}>{t('sections.projects')}</h2>
        {data.projects.map((item) => (
          <CvProjectEntry key={item.id} project={item} />
        ))}
      </section>
      <ProfessionalSkills skillGroups={data.skillGroups} />
    </article>
  );
};
