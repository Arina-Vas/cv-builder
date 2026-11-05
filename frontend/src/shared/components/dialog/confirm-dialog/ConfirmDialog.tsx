import { Dialog } from '@/shared/components/dialog/Dialog';
import type { ReactNode } from 'react';
import { Button } from '@/shared/components/buttons';
import { useTranslations } from 'next-intl';

type Props = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: ReactNode;
  onConfirm: () => void;
  confirmLabel?: string;
  cancelLabel?: string;
  loading?: boolean;
  error?: string;
};
export const ConfirmDialog = ({
  title,
  message,
  onOpenChange,
  open,
  cancelLabel,
  confirmLabel,
  onConfirm,
  loading,
  error,
}: Props) => {
  const t = useTranslations('common.actions');
  const footer = (
    <>
      <Button variant={'secondary'} disabled={loading} onClick={() => onOpenChange(false)}>
        {cancelLabel ?? t('cancel')}
      </Button>
      <Button variant={'primary'} loading={loading} onClick={onConfirm}>
        {confirmLabel ?? t('confirm')}
      </Button>
    </>
  );

  return (
    <Dialog
      size="sm"
      title={title}
      open={open}
      onOpenChange={onOpenChange}
      description={message}
      footer={footer}
      error={error}
      preventClose={loading}
    />
  );
};
