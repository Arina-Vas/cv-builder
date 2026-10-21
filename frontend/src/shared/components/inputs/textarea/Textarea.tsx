import { useId, type ComponentProps } from 'react';
import { Field, getErrorId } from '../field/Field';
import styles from './Textarea.module.css';

export interface TextareaProps extends ComponentProps<'textarea'> {
  label: string;
  error?: string;
}

export function Textarea({ label, error, id, disabled, className, ...rest }: TextareaProps) {
  const autoId = useId();
  const textareaId = id ?? autoId;

  return (
    <Field id={textareaId} label={label} error={error} disabled={disabled} className={className}>
      <textarea
        {...rest}
        id={textareaId}
        disabled={disabled}
        placeholder=" "
        aria-invalid={error ? true : undefined}
        aria-describedby={error ? getErrorId(textareaId) : undefined}
        className={styles.textarea}
      />
    </Field>
  );
}
