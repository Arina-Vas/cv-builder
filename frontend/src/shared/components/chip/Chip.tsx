import type { ComponentProps } from 'react';
import s from './Chip.module.css';
import { CloseIcon } from '@/shared/components/icons/CloseIcon';
import { IconButton } from '@/shared/components/buttons';
import { useTranslations } from 'next-intl';

export interface ChipProps extends Omit<ComponentProps<'span'>, 'children'> {
  label: string;
  onRemove?: () => void;
  disabled?: boolean;
}

export function Chip({ label, onRemove, disabled = false, className, ...rest }: ChipProps) {
  const t = useTranslations('common.chip');
  const classes = [s.chip, className].filter(Boolean).join(' ');

  return (
    <span
      {...rest}
      className={classes}
      title={label}
      data-disabled={disabled || undefined}
      data-removable={onRemove ? true : undefined}
    >
      <span className={s.label}>{label}</span>
      {onRemove && (
        <IconButton
          type="button"
          className={s.remove}
          aria-label={t('remove', { label })}
          onMouseDown={(e) => e.preventDefault()}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <CloseIcon />
        </IconButton>
      )}
    </span>
  );
}
