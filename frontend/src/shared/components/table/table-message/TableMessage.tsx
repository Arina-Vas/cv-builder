import styles from './TableMessage.module.css';

export interface TableMessageProps {
  message: string;
  onRetry?: () => void;
}

export function TableMessage(_props: TableMessageProps) {
  return <div className={styles.message} />;
}
