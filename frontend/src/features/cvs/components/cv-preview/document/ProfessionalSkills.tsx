import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { type CvPreviewSkillGroup } from '@/features/cvs/lib/preview/cv-preview.types';
import s from './CvPreviewDocument.module.css';

type Props = {
  skillGroups: CvPreviewSkillGroup[];
};
export const ProfessionalSkills = ({ skillGroups }: Props) => {
  const t = useTranslations('cvs.preview.document');
  const titleId = useId();

  const groups = skillGroups.filter((group) => group.skills.length > 0);
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className={s.sectionTitle}>
        {t('sections.professionalSkills')}
      </h2>
      <table className={s.skillsTable}>
        <thead>
          <tr>
            <th scope="col">{t('skillsTable.category')}</th>
            <th scope="col">{t('skillsTable.skill')}</th>
            <th scope="col" className={s.skillValue}>
              {t('skillsTable.experience')}
            </th>
            <th scope="col" className={s.skillValue}>
              {t('skillsTable.lastUsed')}
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.category.id}>
            {group.skills.map((item, index) => (
              <tr key={item.skill.id}>
                {index === 0 && (
                  <th scope="rowgroup" rowSpan={group.skills.length} className={s.skillCategory}>
                    {group.category.name}
                  </th>
                )}
                <td className={s.skillName}>{item.skill.name}</td>
                <td className={s.skillValue}>{item.experienceYears}</td>
                <td className={s.skillValue}>{item.lastUsedYear}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  );
};
