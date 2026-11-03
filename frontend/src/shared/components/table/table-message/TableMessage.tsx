import { Button } from '../../buttons';
import styles from './TableMessage.module.css';
import { useTranslations } from 'next-intl';

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
  const t = useTranslations('common.table');
  const isError = variant === 'error';

  return (
    <tbody>
      <tr className={styles.row}>
        <td colSpan={columnCount} className={styles.cell}>
          <div className={styles.content} role={isError ? 'alert' : undefined}>
            <p className={styles.text}>{message}</p>
            {onRetry && (
              <Button variant="secondary" size="sm" onClick={onRetry}>
                {t('retry')}
              </Button>
            )}
          </div>
        </td>
      </tr>
    </tbody>
  );
}
