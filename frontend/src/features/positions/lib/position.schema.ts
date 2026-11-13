import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

const NAME_MAX = 100; // same as the backend (MAX_NAME_LENGTH)

export const positionSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('position.required')).max(NAME_MAX, {
      error: t('position.maxLength', { max: NAME_MAX }),
    }),
  });

export type PositionFormValues = z.output<ReturnType<typeof positionSchema>>;
