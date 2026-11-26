import { Dialog } from '@/shared/components/dialog/Dialog';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Button } from '@/shared/components/buttons';
import { useTranslations } from 'next-intl';
import { useErrorMessage } from '@/shared/lib/apollo/useErrorMessage';
import {
  parseError,
  reasonMessage,
  type ErrorCode,
  type ReasonMessages,
} from '@/shared/lib/apollo/graphql-errors';

type Props = {
  title: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  message: ReactNode;
  onConfirm: () => Promise<unknown>;
  confirmLabel?: string;
  cancelLabel?: string;
  // The page's own text for some error codes, e.g. { ENTITY_IN_USE: t('delete.inUse') };
  // other codes show errors.<code>
  errorMessages?: Partial<Record<ErrorCode, string>>;
  // A text per code and extensions.reason; wins over errorMessages
  // ({ OPERATION_NOT_ALLOWED: { SELF: '…', LAST_ADMIN: '…' } })
  reasonMessages?: ReasonMessages;
};
export const ConfirmDialog = ({
  title,
  message,
  onOpenChange,
  open,
  cancelLabel,
  confirmLabel,
  onConfirm,
  errorMessages,
  reasonMessages,
}: Props) => {
  const t = useTranslations('common.actions');

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string>();
  const errorMessage = useErrorMessage();

  const handleOpenChange = (next: boolean) => {
    if (!next) setError(undefined);

    onOpenChange(next);
  };

  const handleConfirm = async () => {
    setPending(true);
    setError(undefined);
    try {
      await onConfirm();
      handleOpenChange(false);
    } catch (err) {
      const appError = parseError(err);

      const byReason = reasonMessage(appError, reasonMessages);
      const byCode = appError.code && errorMessages?.[appError.code];

      setError(byReason ?? byCode ?? errorMessage(appError));
    } finally {
      setPending(false);
    }
  };

  const footer = (
    <>
      <Button variant={'secondary'} disabled={pending} onClick={() => handleOpenChange(false)}>
        {cancelLabel ?? t('cancel')}
      </Button>
      <Button variant={'primary'} loading={pending} onClick={handleConfirm}>
        {confirmLabel ?? t('confirm')}
      </Button>
    </>
  );

  return (
    <Dialog
      size="sm"
      title={title}
      open={open}
      onOpenChange={handleOpenChange}
      description={message}
      footer={footer}
      error={error}
      preventClose={pending}
    />
  );
};
