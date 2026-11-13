import { type ProjectFieldsFragment } from '@/gql/graphql';
import { Chip } from '@/shared/components/chip/Chip';
import s from './ProjectDetails.module.css';

type Props = {
  project: ProjectFieldsFragment;
};
export const ProjectDetails = ({ project }: Props) => {
  return (
    <>
      <p className={s.description}>{project.description}</p>
      {project.technologies.length > 0 && (
        <ul className={s.technologies}>
          {project.technologies.map((technology) => (
            <li key={technology.id}>
              <Chip label={technology.name} />
            </li>
          ))}
        </ul>
      )}
    </>
  );
};
