import { Dialog as RadixDialog } from 'radix-ui';
import { type ReactNode, useRef } from 'react';
import s from './Dialog.module.css';
import { CrossIcon } from '@/shared/components/icons/CrossIcon';
import { IconButton } from '@/shared/components/buttons';
import { useTranslations } from 'next-intl';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children?: ReactNode;
  footer?: ReactNode;
  description?: ReactNode;
  title: string;
  preventClose?: boolean;
  className?: string;
  size?: 'sm' | 'md';
  error?: string;
};
export const Dialog = ({
  children,
  title,
  description,
  footer,
  onOpenChange,
  open,
  preventClose = false,
  className,
  size = 'sm',
  error,
}: Props) => {
  const t = useTranslations('common.actions');

  const block = (e: Event) => {
    if (preventClose) e.preventDefault();
  };

  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <RadixDialog.Root
      open={open}
      onOpenChange={(next) => {
        if (next || !preventClose) onOpenChange(next);
      }}
    >
      <RadixDialog.Portal>
        <RadixDialog.Overlay className={s.overlay} />
        <RadixDialog.Content
          {...(!description && { 'aria-describedby': undefined })}
          data-size={size}
          className={[s.content, className].filter(Boolean).join(' ')}
          onEscapeKeyDown={block}
          onInteractOutside={block}
          onOpenAutoFocus={() => {
            returnFocusRef.current = document.activeElement as HTMLElement;
          }}
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            returnFocusRef.current?.focus();
            returnFocusRef.current = null;
          }}
        >
          <div className={s.header}>
            <RadixDialog.Title className={s.title}>{title}</RadixDialog.Title>
            <RadixDialog.Close asChild>
              <IconButton aria-label={t('close')} disabled={preventClose}>
                <CrossIcon />
              </IconButton>
            </RadixDialog.Close>
          </div>
          {description && (
            <RadixDialog.Description className={s.description}>
              {description}
            </RadixDialog.Description>
          )}
          {children && <div className={s.body}>{children}</div>}
          {error && (
            <p role="alert" className={s.error}>
              {error}
            </p>
          )}
          {footer && <div className={s.footer}>{footer}</div>}
        </RadixDialog.Content>
      </RadixDialog.Portal>
    </RadixDialog.Root>
  );
};
