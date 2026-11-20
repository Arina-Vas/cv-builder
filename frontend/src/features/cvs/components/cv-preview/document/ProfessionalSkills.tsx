import { useId } from 'react';
import { useTranslations } from 'next-intl';
import { type CvPreviewSkillGroup } from '@/features/cvs/lib/preview/cv-preview.types';

type Props = {
  skillGroups: CvPreviewSkillGroup[];
};
export const ProfessionalSkills = ({ skillGroups }: Props) => {
  const t = useTranslations('cvs.preview.document');
  const titleId = useId();

  return (
    <section aria-labelledby={titleId}>
      <h2 id={titleId}>{t('sections.professionalSkills')}</h2>
      {skillGroups.map((item) => (
        <div key={item.category.id}>
          <h3>{item.category.name}</h3>
          <ul>
            {item.skills.map((skill) => (
              <li key={skill.skill.id}>{skill.skill.name}</li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
};
