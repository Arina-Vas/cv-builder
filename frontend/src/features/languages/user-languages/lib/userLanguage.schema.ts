import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';
import type { Proficiency } from '@/gql/graphql';
import { PROFICIENCIES } from '@/features/languages/user-languages/lib/proficiency';

export const userLanguageSchema = (t: ValidationT) =>
  z.object({
    languageId: requiredString(t('userLanguage.languageId.required')),
    proficiency: requiredString(t('userLanguage.proficiency.required')).pipe(
      z.enum(PROFICIENCIES as [Proficiency, ...Proficiency[]]),
    ),
  });

export type UserLanguageFormValues = z.output<ReturnType<typeof userLanguageSchema>>;
