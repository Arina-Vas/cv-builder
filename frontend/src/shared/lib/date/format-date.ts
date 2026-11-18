import { format, parseISO } from 'date-fns';

const DATE_FORMAT = 'MM/dd/yyyy';

export const formatDate = (date: string | Date) => {
  return format(typeof date === 'string' ? parseISO(date) : date, DATE_FORMAT);
};
