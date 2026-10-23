import { Button } from '../../buttons';
import styles from './TableMessage.module.css';

export type TableMessageVariant = 'empty' | 'error';

export interface TableMessageProps {
  message: string;
  columnCount: number;
  variant?: TableMessageVariant;
  onRetry?: () => void;
}

export function TableMessage({
  message,
  columnCount,
  variant = 'empty',
  onRetry,
}: TableMessageProps) {
  const isError = variant === 'error';

  return (
    <tbody>
      <tr className={styles.row}>
        <td colSpan={columnCount} className={styles.cell}>
          <div className={styles.content} role={isError ? 'alert' : undefined}>
            <p className={styles.text}>{message}</p>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                RETRY
              </Button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
