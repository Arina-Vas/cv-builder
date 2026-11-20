import { useTranslations } from 'next-intl';
import { type CvPreviewProject } from '@/features/cvs/lib/preview/cv-preview.types';
import { formatDate } from '@/shared/lib/date/format-date';

type Props = {
  project: CvPreviewProject;
};
export const CvProjectEntry = ({ project }: Props) => {
  const t = useTranslations('cvs.preview.document');

  return (
    <article>
      <div>
        <h3>{project.project.name}</h3>
        <p>{project.project.description}</p>
      </div>
      <dl>
        <dt>{t('project.roles')}</dt>
        <dd>{project.roles.map((r) => r.name).join(',')}</dd>
        <dt>{t('project.period')}</dt>
        <dd>
          {t('period', {
            start: formatDate(project.startDate),
            end: project.endDate ? formatDate(project.endDate) : t('present'),
          })}
        </dd>
        <dt>{t('project.responsibilities')}</dt>
        <dd>{project.responsibilities}</dd>
        <dt>{t('project.environment')}</dt>
        <dd>{project.project.technologies.map((t) => t.name).join(',')}</dd>
      </dl>
    </article>
  );
};
