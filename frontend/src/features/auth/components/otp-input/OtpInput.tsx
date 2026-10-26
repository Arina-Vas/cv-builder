import styles from './OtpInput.module.css';

export interface OtpInputProps {
  length?: number;
  label?: string;
}

export function OtpInput({ length = 6, label = 'Verification code' }: OtpInputProps) {
  return (
    <div className={styles.root} role="group" aria-label={label}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          className={styles.cell}
          type="text"
          inputMode="numeric"
          autoComplete={index === 0 ? 'one-time-code' : 'off'}
          maxLength={1}
          aria-label={`Digit ${index + 1} of ${length}`}
        />
      ))}
    </div>
  );
}
