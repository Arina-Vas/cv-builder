'use client';

import { type ReactNode, useId } from 'react';
import { useTranslations } from 'next-intl';
import { getFullName } from '@/features/users/lib/getFullName';
import { CvSummary } from './cv-summary/CvSummary';
import { CvProjectEntry } from './cv-project-entry/CvProjectEntry';
import { ProfessionalSkills } from './professional-skills/ProfessionalSkills';
import s from './CvPreviewDocument.module.css';
import { type CvPreviewFieldsFragment } from '@/gql/graphql';

type Props = {
  data: CvPreviewFieldsFragment;
  actions?: ReactNode;
};
export const CvPreviewDocument = ({ data, actions }: Props) => {
  const t = useTranslations('cvs.preview.document');
  const projectsTitleId = useId();

  return (
    <article className={s.document}>
      <header className={s.header}>
        <div>
          <h1 className={s.title}>{getFullName(data.user)}</h1>
          {data.user.position && <p className={s.subTitle}>{data.user.position.name}</p>}
        </div>
        {actions && <div className={s.actions}>{actions}</div>}
      </header>
      <div className={s.body}>
        <CvSummary
          name={data.name}
          domains={data.domains}
          languages={data.languages}
          description={data.description}
          education={data.education}
          skillGroups={data.skillGroups}
        />
        {data.projects.length > 0 && (
          <section aria-labelledby={projectsTitleId}>
            <h2 id={projectsTitleId} className={s.sectionTitle}>
              {t('sections.projects')}
            </h2>
            <div className={s.projects}>
              {data.projects.map((item) => (
                <CvProjectEntry key={item.id} project={item} />
              ))}
            </div>
          </section>
        )}
        <ProfessionalSkills skillGroups={data.skillGroups} />
      </div>
    </article>
  );
};
