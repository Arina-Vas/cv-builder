import { useId } from 'react';
import { useTranslations } from 'next-intl';
import doc from '../CvPreviewDocument.module.css';
import s from './ProfessionalSkills.module.css';
import { type CvPreviewSkillGroupFieldsFragment } from '@/gql/graphql';

type Props = {
  skillGroups: CvPreviewSkillGroupFieldsFragment[];
};
export const ProfessionalSkills = ({ skillGroups }: Props) => {
  const t = useTranslations('cvs.preview.document');
  const titleId = useId();

  const groups = skillGroups.filter((group) => group.skills.length > 0);
  if (groups.length === 0) return null;

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId} className={doc.sectionTitle}>
        {t('sections.professionalSkills')}
      </h2>
      <table className={s.table}>
        <thead>
          <tr>
            {/* Figma shows one "SKILLS" title over category and skill; screen readers still get a
                name for each column */}
            <th scope="col" className={s.headCell}>
              <span aria-hidden="true">{t('skillsTable.skills')}</span>
              <span className={doc.visuallyHidden}>{t('skillsTable.category')}</span>
            </th>
            <th scope="col" className={s.headCell}>
              <span className={doc.visuallyHidden}>{t('skillsTable.skill')}</span>
            </th>
            <th scope="col" className={s.value}>
              {t('skillsTable.experience')}
            </th>
            <th scope="col" className={s.value}>
              {t('skillsTable.lastUsed')}
            </th>
          </tr>
        </thead>
        {groups.map((group) => (
          <tbody key={group.category.id}>
            {group.skills.map((item, index) => (
              <tr key={item.skill.id}>
                {index === 0 && (
                  <th scope="rowgroup" rowSpan={group.skills.length} className={s.category}>
                    {group.category.name}
                  </th>
                )}
                <td className={s.skill}>{item.skill.name}</td>
                <td className={s.value}>{item.experienceYears}</td>
                <td className={s.value}>{item.lastUsedYear}</td>
              </tr>
            ))}
          </tbody>
        ))}
      </table>
    </section>
  );
};
