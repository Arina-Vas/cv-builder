import type { ComponentProps, ReactNode } from 'react';

import styles from './AuthForm.module.css';

export interface AuthFormProps extends ComponentProps<'form'> {
  title: string;
  subtitle: string;
  actions: ReactNode;
  // width of the submit button: wide 220 (default), regular 160 (Email Verification), narrow 120 (Reset Password)
  submitWidth?: 'wide' | 'regular' | 'narrow';
}

export function AuthForm({
  title,
  subtitle,
  actions,
  submitWidth = 'wide',
  onSubmit,
  children,
  ...rest
}: AuthFormProps) {
  const handleSubmit: AuthFormProps['onSubmit'] = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <main className={styles.main}>
      <form
        {...rest}
        className={styles.form}
        data-submit={submitWidth}
        noValidate
        onSubmit={handleSubmit}
      >
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.fields}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </form>
    </main>
  );
}
