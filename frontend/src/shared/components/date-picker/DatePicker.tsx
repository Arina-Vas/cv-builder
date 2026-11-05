import { Popover } from 'radix-ui';
import 'react-datepicker/dist/react-datepicker.css';
import s from './DatePicker.module.css';
import { format } from 'date-fns';
import { DatePicker as ReactDatePicker } from 'react-datepicker';
import type { Ref } from 'react';
import { useId, useState } from 'react';
import { ChevronIcon } from '@/shared/components/icons/ChevronIcon';
import { CalendarIcon } from '@/shared/components/icons/CalendarIcon';
import { useTranslations } from 'next-intl';
import { Field, getErrorId } from '@/shared/components/field/Field';

type Props = {
  value: Date | null;
  onChange: (date: Date | null) => void;
  placeholder?: string;
  minDate?: Date;
  maxDate?: Date;
  excludeDates?: Date[];
  disabled?: boolean;
  id?: string;
  label: string;
  error?: string;
  ref?: Ref<HTMLButtonElement>;
  onOpenChange?: (open: boolean) => void;
};

type View = 'day' | 'month' | 'year';

export const DatePicker = ({
  value,
  onChange,
  placeholder,
  minDate,
  maxDate,
  excludeDates,
  disabled,
  id,
  label,
  error,
  onOpenChange,
  ref,
}: Props) => {
  const t = useTranslations('common.datePicker');
  const [open, setOpen] = useState(false);
  const [view, setView] = useState<View>('day');
  const [viewDate, setViewDate] = useState<Date>(value ?? new Date());

  const autoId = useId();
  const triggerId = id ?? autoId;

  const handleOpenChange = (next: boolean) => {
    setOpen(next);
    onOpenChange?.(next);
    if (next) {
      setView('day');
      setViewDate(value ?? new Date());
    }
  };

  const handleSelect = (date: Date | null) => {
    if (!date) return;
    if (view === 'day') {
      onChange(date);
      setOpen(false);
      onOpenChange?.(false);
      return;
    }

    if (view === 'year') {
      setViewDate(new Date(date.getFullYear(), viewDate.getMonth(), 1));
      setView('month');
      return;
    }
    setViewDate(new Date(date.getFullYear(), date.getMonth(), 1));
    setView('day');
  };

  return (
    <Field
      id={triggerId}
      label={label}
      error={error}
      disabled={disabled}
      filled={value !== null}
      active={open}
    >
      <Popover.Root open={open} onOpenChange={handleOpenChange}>
        <Popover.Trigger asChild disabled={disabled}>
          <button
            ref={ref}
            id={triggerId}
            type="button"
            className={s.trigger}
            data-invalid={error ? true : undefined}
            aria-describedby={error ? getErrorId(triggerId) : undefined}
          >
            <span>
              {value
                ? format(value, 'dd.MM.yyyy')
                : open
                  ? (placeholder ?? t('placeholder'))
                  : null}
            </span>
            <CalendarIcon className={s.icon} />
          </button>
        </Popover.Trigger>
        <Popover.Portal>
          <Popover.Content align="start" sideOffset={0} collisionPadding={16} className={s.content}>
            <ReactDatePicker
              inline
              key={view}
              selected={view === 'day' ? value : viewDate}
              openToDate={viewDate}
              onChange={handleSelect}
              onMonthChange={setViewDate}
              onYearChange={setViewDate}
              calendarStartDay={0}
              formatWeekDay={(dayName) => dayName.charAt(0)}
              showFullMonthYearPicker
              showMonthYearPicker={view === 'month'}
              showYearPicker={view === 'year'}
              yearItemNumber={12}
              minDate={minDate}
              maxDate={maxDate}
              excludeDates={excludeDates}
              renderCustomHeader={({
                date,
                decreaseMonth,
                increaseMonth,
                decreaseYear,
                increaseYear,
              }) => (
                <div className={s.header}>
                  <button
                    type="button"
                    className={`${s.headerLabel} ${s.monthLabel}`}
                    data-active={view === 'month'}
                    onClick={() => setView('month')}
                  >
                    {format(date, 'MMMM')}
                  </button>
                  <button
                    type="button"
                    className={`${s.headerLabel} ${s.yearLabel}`}
                    data-active={view === 'year'}
                    onClick={() => setView('year')}
                  >
                    {format(date, 'yyyy')}
                  </button>

                  <div className={s.nav}>
                    <button
                      type="button"
                      className={s.navButton}
                      aria-label={t('previous')}
                      onClick={view === 'day' ? decreaseMonth : decreaseYear}
                    >
                      <ChevronIcon direction="left" />
                    </button>
                    <button
                      type="button"
                      className={s.navButton}
                      aria-label={t('next')}
                      onClick={view === 'day' ? increaseMonth : increaseYear}
                    >
                      <ChevronIcon direction="right" />
                    </button>
                  </div>
                </div>
              )}
            />
          </Popover.Content>
        </Popover.Portal>
      </Popover.Root>
    </Field>
  );
};
