import type { ComponentProps, ReactNode } from 'react';

import styles from './AuthForm.module.css';

export interface AuthFormProps extends ComponentProps<'form'> {
  title: string;
  subtitle: string;
  actions: ReactNode;
}

export function AuthForm({ title, subtitle, actions, onSubmit, children, ...rest }: AuthFormProps) {
  const handleSubmit: AuthFormProps['onSubmit'] = (event) => {
    event.preventDefault();
    onSubmit?.(event);
  };

  return (
    <main className={styles.main}>
      <form {...rest} className={styles.form} noValidate onSubmit={handleSubmit}>
        <h1 className={styles.title}>{title}</h1>
        <p className={styles.subtitle}>{subtitle}</p>
        <div className={styles.fields}>{children}</div>
        <div className={styles.actions}>{actions}</div>
      </form>
    </main>
  );
}
