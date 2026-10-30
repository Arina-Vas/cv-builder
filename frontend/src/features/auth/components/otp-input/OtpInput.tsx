import {
  useId,
  useRef,
  type ClipboardEvent,
  type FocusEvent,
  type FormEvent,
  type KeyboardEvent,
  type MouseEvent,
} from 'react';
import { useTranslations } from 'next-intl';

import styles from './OtpInput.module.css';

export interface OtpInputProps {
  value: string;
  onChange: (value: string) => void;
  length?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
}

const onlyDigits = (text: string) => text.replace(/\D/g, '');

export function OtpInput({ value, onChange, length = 6, label, error, disabled }: OtpInputProps) {
  const t = useTranslations('auth.verifyEmail');
  const errorId = useId();
  const cells = useRef<(HTMLInputElement | null)[]>([]);

  const focusCell = (index: number) => {
    cells.current[Math.max(0, Math.min(index, length - 1))]?.focus();
  };

  const fill = (index: number, digits: string) => {
    const start = Math.min(index, value.length);
    const next = (value.slice(0, start) + digits + value.slice(start + digits.length)).slice(
      0,
      length,
    );
    onChange(next);
    focusCell(start + digits.length);
  };

  const selectCell = (event: FocusEvent<HTMLInputElement> | MouseEvent<HTMLInputElement>) => {
    event.currentTarget.select();
  };

  const handleInput = (index: number) => (event: FormEvent<HTMLInputElement>) => {
    const digits = onlyDigits(event.currentTarget.value);
    if (digits) fill(index, digits);
  };

  const handleKeyDown = (index: number) => (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Backspace') {
      event.preventDefault();
      const target = value[index] ? index : index - 1;
      if (target < 0) return;
      onChange(value.slice(0, target) + value.slice(target + 1));
      focusCell(target);
    } else if (event.key === 'ArrowLeft') {
      focusCell(index - 1);
    } else if (event.key === 'ArrowRight') {
      focusCell(index + 1);
    }
  };

  const handlePaste = (index: number) => (event: ClipboardEvent<HTMLInputElement>) => {
    event.preventDefault();
    const digits = onlyDigits(event.clipboardData.getData('text'));
    if (digits) fill(index, digits);
  };

  return (
    <div>
      <div
        className={styles.root}
        role="group"
        aria-label={label ?? t('codeLabel')}
        aria-describedby={error ? errorId : undefined}
        data-error={error ? true : undefined}
      >
        {Array.from({ length }, (_, index) => (
          <input
            key={index}
            ref={(element) => {
              cells.current[index] = element;
            }}
            className={styles.cell}
            type="text"
            inputMode="numeric"
            autoComplete={index === 0 ? 'one-time-code' : 'off'}
            value={value[index] ?? ''}
            disabled={disabled}
            aria-invalid={error ? true : undefined}
            aria-label={t('digit', { index: index + 1, length })}
            onChange={handleInput(index)}
            onKeyDown={handleKeyDown(index)}
            onPaste={handlePaste(index)}
            onFocus={selectCell}
            onClick={selectCell}
          />
        ))}
      </div>
      {error && (
        <p id={errorId} className={styles.error} role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
