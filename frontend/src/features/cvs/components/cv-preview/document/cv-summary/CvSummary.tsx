import { useId } from 'react';
import { useTranslations } from 'next-intl';
import s from './CvSummary.module.css';
import {
  type CvPreviewFieldsFragment,
  type CvPreviewSkillGroupFieldsFragment,
} from '@/gql/graphql';

type Props = {
  education: string;
  languages: CvPreviewFieldsFragment['languages'];
  domains: string[];
  name: string;
  description: string;
  skillGroups: CvPreviewSkillGroupFieldsFragment[];
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

  const educationText = education.trim();
  const descriptionText = description.trim();
  const groups = skillGroups.filter((group) => group.skills.length > 0);

  return (
    <section aria-labelledby={titleId} className={s.wrapper}>
      <dl className={s.details}>
        {educationText && (
          <>
            <dt className={s.title}>{t('sections.education')}</dt>
            <dd className={s.value}>{educationText}</dd>
          </>
        )}
        {languages.length > 0 && (
          <>
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
          </>
        )}
        {domains.length > 0 && (
          <>
            <dt className={s.title}>{t('sections.domains')}</dt>
            <dd className={s.value}>{domains.join(', ')}</dd>
          </>
        )}
      </dl>
      <div className={s.description}>
        <h2 id={titleId} className={s.title}>
          {name}
        </h2>
        {descriptionText && <p className={s.text}>{descriptionText}</p>}
        {groups.length > 0 && (
          <dl className={s.categories}>
            {groups.map((group) => (
              <div key={group.category.id} className={s.group}>
                <dt className={s.title}>{group.category.name}</dt>
                <dd className={s.value}>
                  {group.skills.map((item) => item.skill.name).join(', ')}.
                </dd>
              </div>
            ))}
          </dl>
        )}
      </div>
    </section>
  );
};
