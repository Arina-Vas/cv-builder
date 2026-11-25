import { useTranslations } from 'next-intl';
import { splitResponsibilities } from '@/features/cv-projects/lib/split-responsibilities';
import { formatDate } from '@/shared/lib/date/format-date';
import s from './CvProjectEntry.module.css';
import { type CvProjectFieldsFragment } from '@/gql/graphql';

/** The item's own ".", ";" or "," at the end, replaced by the list punctuation */
const TRAILING_PUNCTUATION = /[.;,]+$/;

type Props = {
  project: CvProjectFieldsFragment;
};
export const CvProjectEntry = ({ project }: Props) => {
  const t = useTranslations('cvs.preview.document');
  const responsibilities = splitResponsibilities(project.responsibilities);
  const description = project.project.description.trim();

  return (
    <article className={s.entry}>
      <div className={s.aside}>
        <h3 className={s.name}>{project.project.name}</h3>
        {description && <p className={s.description}>{description}</p>}
      </div>
      <dl className={s.details}>
        {project.roles.length > 0 && (
          <>
            <dt className={s.label}>{t('project.roles')}</dt>
            <dd className={s.value}>{project.roles.map((r) => r.name).join(', ')}</dd>
          </>
        )}
        {project.startDate && (
          <>
            <dt className={s.label}>{t('project.period')}</dt>
            <dd className={s.value}>
              {t('period', {
                start: formatDate(project.startDate, 'MM.yyyy'),
                end: project.endDate ? formatDate(project.endDate, 'MM.yyyy') : t('present'),
              })}
            </dd>
          </>
        )}
        {responsibilities.length > 0 && (
          <>
            <dt className={s.label}>{t('project.responsibilities')}</dt>
            <dd className={s.value}>
              <ul className={s.list}>
                {responsibilities.map((item, index) => (
                  <li key={index}>
                    {item.replace(TRAILING_PUNCTUATION, '')}
                    {index === responsibilities.length - 1 ? '.' : ';'}
                  </li>
                ))}
              </ul>
            </dd>
          </>
        )}
        {project.project.technologies.length > 0 && (
          <>
            <dt className={s.label}>{t('project.environment')}</dt>
            <dd className={s.value}>
              {project.project.technologies.map((t) => t.name).join(', ')}.
            </dd>
          </>
        )}
      </dl>
    </article>
  );
};
