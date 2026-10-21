import { useId, useState, type ComponentProps } from 'react';

import { IconButton } from '../../buttons';
import { EyeIcon } from '../../icons/EyeIcon';
import { EyeOffIcon } from '../../icons/EyeOffIcon';
import { Field, getErrorId } from '@/shared/components/field/Field';
import styles from './Input.module.css';

export interface InputProps extends ComponentProps<'input'> {
  label: string;
  error?: string;
}

export function Input({ label, error, id, type, disabled, className, ...rest }: InputProps) {
  const autoId = useId();
  const inputId = id ?? autoId;

  const isPassword = type === 'password';
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const inputType = isPassword && isPasswordVisible ? 'text' : type;

  const inputClasses = [styles.input, isPassword && styles.withToggle].filter(Boolean).join(' ');

  return (
    <Field id={inputId} label={label} error={error} disabled={disabled} className={className}>
      <input
        {...rest}
        id={inputId}
        type={inputType}
        disabled={disabled}
        placeholder=" "
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? getErrorId(inputId) : undefined}
        className={inputClasses}
      />
      {isPassword && (
        <IconButton
          aria-label={isPasswordVisible ? 'Hide password' : 'Show password'}
          aria-controls={inputId}
          disabled={disabled}
          onClick={() => setIsPasswordVisible((visible) => !visible)}
          className={styles.toggle}
        >
          {isPasswordVisible ? <EyeOffIcon /> : <EyeIcon />}
        </IconButton>
      )}
    </Field>
  );
}
