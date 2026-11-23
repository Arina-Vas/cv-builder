import { format, parseISO } from 'date-fns';

/**
 * Display formats used in the app:
 * - `MM/dd/yyyy` — default: tables, date picker (Figma);
 * - `MM.yyyy` — CV preview project period ("08.2023 – Till now").
 */
type DateFormat = 'MM/dd/yyyy' | 'MM.yyyy';

/**
 * Formats a date for display. A `Date`-scalar string (`yyyy-MM-dd`) is parsed as local midnight, so the
 * calendar day never shifts. Display only: the API always gets `format(date, 'yyyy-MM-dd')`.
 */
export const formatDate = (date: string | Date, dateFormat: DateFormat = 'MM/dd/yyyy') => {
  return format(typeof date === 'string' ? parseISO(date) : date, dateFormat);
};
