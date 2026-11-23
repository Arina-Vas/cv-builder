import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type {
  CvPreviewData,
  CvPreviewSkillGroup,
} from '@/features/cvs/lib/preview/cv-preview.types';
import s from './CvSummary.module.css';

type Props = {
  education: string;
  languages: CvPreviewData['languages'];
  domains: string[];
  name: string;
  description: string;
  skillGroups: CvPreviewSkillGroup[];
};

export const CvSummary = ({
  education,
  languages,
  domains,
  name,
  description,
  skillGroups,
}: Props) => {
  const t = useTranslations('cvs.preview.document');
  const tProficiency = useTranslations('userLanguage.proficiencyLevel');
  const titleId = useId();

  return (
    <section aria-labelledby={titleId} className={s.wrapper}>
      <dl className={s.details}>
        <dt className={s.title}>{t('sections.education')}</dt>
        <dd className={s.value}>{education}</dd>
        <dt className={s.title}>{t('sections.languages')}</dt>
        <dd className={s.value}>
          {languages
            .map((l) =>
              t('languageLevel', {
                language: l.language.name,
                level: tProficiency(l.proficiency),
              }),
            )
            .join(', ')}
        </dd>
        <dt className={s.title}>{t('sections.domains')}</dt>
        <dd className={s.value}>{domains.join(', ')}</dd>
      </dl>
      <div className={s.description}>
        <h2 id={titleId} className={s.title}>
          {name}
        </h2>
        <p className={s.text}>{description}</p>
        <dl className={s.categories}>
          {skillGroups.map((group) => (
            <div key={group.category.id} className={s.group}>
              <dt className={s.title}>{group.category.name}</dt>
              <dd className={s.value}>{group.skills.map((item) => item.skill.name).join(', ')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
