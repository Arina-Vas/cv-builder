import type { CvProjectFieldsFragment } from '@/gql/graphql';
import { Chip } from '@/shared/components/chip/Chip';
import { splitResponsibilities } from '@/features/cv-projects/lib/split-responsibilities';
import s from './CvProjectDetails.module.css';

type Props = {
  cvProject: CvProjectFieldsFragment;
};

export const CvProjectDetails = ({ cvProject }: Props) => {
  const responsibilities = splitResponsibilities(cvProject.responsibilities);

  return (
    <>
      <p className={s.description}>{cvProject.project.description}</p>
      {responsibilities.length > 0 && (
        <ul className={s.responsibilities}>
          {responsibilities.map((responsibility, index) => (
            <li key={index}>
              <Chip label={responsibility} variant="filled" />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
