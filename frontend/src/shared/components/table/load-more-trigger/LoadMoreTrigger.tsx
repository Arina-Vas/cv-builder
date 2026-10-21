import styles from './LoadMoreTrigger.module.css';

export interface LoadMoreTriggerProps {
  hasMore: boolean;
  isLoading: boolean;
  error?: string;
  onLoadMore: () => void;
}

export function LoadMoreTrigger(_props: LoadMoreTriggerProps) {
  return <div className={styles.trigger} />;
}
