const FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
  year: 'numeric',
};

/**
 * Figma shows "Sun Jan 14 2024": the locale's own words and order, but without commas.
 * formatToParts gives the pieces separately, so we drop the separators ("literal") and join with spaces.
 */
export const formatMemberSinceDate = (date: string, locale: string) =>
  new Intl.DateTimeFormat(locale, FORMAT)
    .formatToParts(new Date(date))
    .filter((part) => part.type !== 'literal')
    .map((part) => part.value)
    .join(' ');
