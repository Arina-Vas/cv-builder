import { useId } from 'react';
import { useTranslations } from 'next-intl';
import type {
  CvPreviewData,
  CvPreviewSkillGroup,
} from '@/features/cvs/lib/preview/cv-preview.types';

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
    <section aria-labelledby={titleId}>
      <dl>
        <dt>{t('sections.education')}</dt>
        <dd>{education}</dd>
        <dt>{t('sections.languages')}</dt>
        <dd>
          {languages
            .map((l) =>
              t('languageLevel', {
                language: l.language.name,
                level: tProficiency(l.proficiency),
              }),
            )
            .join(',')}
        </dd>
        <dt>{t('sections.domains')}</dt>
        <dd>{domains.join(',')}</dd>
      </dl>
      <div>
        <h2 id={titleId}>{name}</h2>
        <p>{description}</p>
        <dl>
          {skillGroups.map((group) => (
            <div key={group.category.id}>
              <dt>{group.category.name}</dt>
              <dd>{group.skills.map((item) => item.skill.name).join(',')}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
};
