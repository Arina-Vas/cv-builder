import { format } from 'date-fns';
import type { CvProjectFieldsFragment } from '@/gql/graphql';

type CvProjectDates = Pick<CvProjectFieldsFragment, 'endDate'> & {
  project: Pick<CvProjectFieldsFragment['project'], 'endDate'>;
};

export const effectiveEndDate = (cvProject: CvProjectDates, now = new Date()): string | null => {
  if (cvProject.endDate) return cvProject.endDate;

  const today = format(now, 'yyyy-MM-dd');

  return cvProject.project.endDate < today ? cvProject.project.endDate : null;
};
