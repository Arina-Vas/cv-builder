'use client';

import { useId } from 'react';
import { Button } from '@/shared/components/buttons';
import { ErrorMonitorIcon } from '@/shared/components/icons/ErrorMonitorIcon';
import s from './ErrorState.module.css';

interface ErrorStateAction {
  label: string;
  onClick: () => void;
  loading?: boolean;
}

interface ErrorStateProps {
  title: string;
  message: string;
  action?: ErrorStateAction;
}

export function ErrorState({ title, message, action }: ErrorStateProps) {
  const titleId = useId();

  return (
    <section className={s.root} aria-labelledby={titleId}>
      <div className={s.content}>
        <ErrorMonitorIcon className={s.illustration} />
        <h1 id={titleId} className={s.title}>
          {title}
        </h1>
        <p className={s.message}>{message}</p>
        {action && (
          <Button className={s.action} onClick={action.onClick} loading={action.loading}>
            {action.label}
          </Button>
        )}
      </div>
    </section>
  );
}
