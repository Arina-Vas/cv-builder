import { useLocale, useTranslations } from 'next-intl';
import { formatMemberSinceDate } from '../lib/formatMemberSinceDate';

/** (createdAt) => "A member since Sun Jan 14 2024", in the app language */
export const useFormatMemberSince = () => {
  const t = useTranslations('users.profile');
  const locale = useLocale();

  return (createdAt: string) =>
    t('memberSince', { date: formatMemberSinceDate(createdAt, locale) });
};
