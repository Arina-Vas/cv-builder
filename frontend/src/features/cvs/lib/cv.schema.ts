import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

const NAME_MAX = 255; // same as the backend (MAX_CV_NAME_LENGTH)
const DESCRIPTION_MAX = 2000; // same as the backend (DESCRIPTION_MAX)

export const cvSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('cv.name.required')).max(NAME_MAX, {
      error: t('cv.name.maxLength', { max: NAME_MAX }),
    }),
    education: requiredString(t('cv.education.required')).max(NAME_MAX, {
      error: t('cv.education.maxLength', { max: NAME_MAX }),
    }),
    description: requiredString(t('cv.description.required')).max(DESCRIPTION_MAX, {
      error: t('cv.description.maxLength', { max: DESCRIPTION_MAX }),
    }),
  });

export type CvFormValues = z.output<ReturnType<typeof cvSchema>>;
