import { useTranslations } from 'next-intl';
import { type CvPreviewProject } from '@/features/cvs/lib/preview/cv-preview.types';
import { splitResponsibilities } from '@/features/cv-projects/lib/split-responsibilities';
import { formatDate } from '@/shared/lib/date/format-date';
import s from './CvProjectEntry.module.css';

type Props = {
  project: CvPreviewProject;
};
export const CvProjectEntry = ({ project }: Props) => {
  const t = useTranslations('cvs.preview.document');
  const responsibilities = splitResponsibilities(project.responsibilities);

  return (
    <article className={s.entry}>
      <div className={s.aside}>
        <h3 className={s.name}>{project.project.name}</h3>
        <p className={s.description}>{project.project.description}</p>
      </div>
      <dl className={s.details}>
        <dt className={s.label}>{t('project.roles')}</dt>
        <dd className={s.value}>{project.roles.map((r) => r.name).join(', ')}</dd>
        <dt className={s.label}>{t('project.period')}</dt>
        <dd className={s.value}>
          {t('period', {
            start: formatDate(project.startDate, 'MM.yyyy'),
            end: project.endDate ? formatDate(project.endDate, 'MM.yyyy') : t('present'),
          })}
        </dd>
        <dt className={s.label}>{t('project.responsibilities')}</dt>
        <dd className={s.value}>
          <ul className={s.list}>
            {responsibilities.map((item, index) => (
              <li key={index}>{item}</li>
            ))}
          </ul>
        </dd>
        <dt className={s.label}>{t('project.environment')}</dt>
        <dd className={s.value}>{project.project.technologies.map((t) => t.name).join(', ')}</dd>
      </dl>
    </article>
  );
};
