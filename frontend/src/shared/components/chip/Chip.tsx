import type { ComponentProps } from 'react';
import s from './Chip.module.css';
import { CloseIcon } from '@/shared/components/icons/CloseIcon';

export interface ChipProps extends Omit<ComponentProps<'span'>, 'children'> {
  label: string;
  onRemove?: () => void;
  disabled?: boolean;
}

export function Chip({ label, onRemove, disabled = false, className, ...rest }: ChipProps) {
  const classes = [s.chip, className].filter(Boolean).join(' ');

  return (
    <span {...rest} className={classes} title={label} data-disabled={disabled || undefined}>
      <span className={s.label}>{label}</span>
      {onRemove && (
        <button
          type="button"
          className={s.remove}
          aria-label={`Remove ${label}`}
          onMouseDown={(e) => e.preventDefault()}
          disabled={disabled}
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <CloseIcon />
        </button>
      )}
    </span>
  );
}
