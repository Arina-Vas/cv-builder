import { requiredString, type ValidationT } from '@/shared/lib/form';
import { z } from 'zod';

const NAME_MAX = 100; // same as the backend (MAX_NAME_LENGTH)
const ISO_MAX = 5; // same as the backend (MAX_ISO_LENGTH)

export const languageSchema = (t: ValidationT) =>
  z.object({
    name: requiredString(t('language.name.required')).max(NAME_MAX, {
      error: t('language.name.maxLength', { max: NAME_MAX }),
    }),
    nativeName: requiredString(t('language.nativeName.required')).max(NAME_MAX, {
      error: t('language.nativeName.maxLength', { max: NAME_MAX }),
    }),
    iso: requiredString(t('language.iso.required'))
      .toUpperCase()
      .max(ISO_MAX, {
        error: t('language.iso.maxLength', { max: ISO_MAX }),
      })
      .regex(/^[A-Z]{2,3}(-[A-Z]{2})?$/, { error: t('language.iso.format') }),
  });

export type LanguageFormValues = z.output<ReturnType<typeof languageSchema>>;
