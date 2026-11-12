import type { ComponentProps, MouseEvent } from 'react';
import { useActionGate } from '@/shared/lib/action-gate/ActionGate';

import styles from './Button.module.css';

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'text';
export type ButtonSize = 'md' | 'sm';

export interface ButtonProps extends ComponentProps<'button'> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  gated?: boolean;
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  type = 'button',
  disabled,
  gated = false,
  onClick,
  className,
  children,
  ...rest
}: ButtonProps) {
  const gate = useActionGate();
  const locked = gated && gate.locked;

  const handleClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (!gated) return onClick?.(event);
    if (locked) event.preventDefault();
    gate.guard(() => onClick?.(event))();
  };

  const classes = [
    styles.button,
    styles[variant],
    styles[size],
    loading && styles.loading,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button
      {...rest}
      type={type}
      className={classes}
      onClick={handleClick}
      disabled={disabled || loading}
      aria-disabled={rest['aria-disabled'] ?? (locked || undefined)}
      aria-busy={loading || undefined}
    >
      <span className={styles.label}>{children}</span>
      {loading && <span className={styles.spinner} aria-hidden="true" />}
    </button>
  );
}
