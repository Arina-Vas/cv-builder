import type { ReactNode } from 'react';
import styles from './Field.module.css';

export interface FieldProps {
  id: string;
  label: string;
  error?: string;
  disabled?: boolean;
  className?: string;
  children: ReactNode;
}

export const getErrorId = (id: string) => `${id}-error`;

export function Field({ id, label, error, disabled = false, className, children }: FieldProps) {
  const classes = [styles.root, className].filter(Boolean).join(' ');

  return (
    <div
      className={classes}
      data-error={error ? true : undefined}
      data-disabled={disabled ? true : undefined}
    >
      <div className={styles.control}>
        {children}

        <label htmlFor={id} className={styles.label}>
          {label}
        </label>
        <span aria-hidden className={styles.outline} />
      </div>

      {error && (
        <p id={getErrorId(id)} className={styles.helper} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
