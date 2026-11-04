import type { useTranslations } from 'next-intl';

export type ValidationT = ReturnType<typeof useTranslations<'validation'>>;
