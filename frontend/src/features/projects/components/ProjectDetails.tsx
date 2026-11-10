import { type ProjectFieldsFragment } from '@/gql/graphql';
import { Chip } from '@/shared/components/chip/Chip';

type Props = {
  project: ProjectFieldsFragment;
};
export const ProjectDetails = ({ project }: Props) => {
  return (
    <div>
      <p>{project.description}</p>
      <ul>
        {project.technologies.map((technology) => (
          <li key={technology.id}>
            <Chip label={technology.name} />
          </li>
        ))}
      </ul>
    </div>
  );
};
