import { Toast as RadixToast } from 'radix-ui';
import s from './Toast.module.css';
import { CrossIcon } from '@/shared/components/icons/CrossIcon';
import { IconButton } from '@/shared/components/buttons';
import { type ToastType } from './Toast.types';
import type { ComponentProps } from 'react';
import { useTranslations } from 'next-intl';

type Props = {
  description: string;
  type: ToastType;
  title?: string;
} & Pick<ComponentProps<typeof RadixToast.Root>, 'open' | 'onOpenChange' | 'duration'>;

export const Toast = ({ description, type, title, open, onOpenChange, duration }: Props) => {
  const t = useTranslations('common.toast');

  return (
    <RadixToast.Root
      className={s.root}
      data-type={type}
      open={open}
      onOpenChange={onOpenChange}
      duration={duration}
      type={type === 'error' ? 'foreground' : 'background'}
    >
      <RadixToast.Title className={s.title}>{title || t(`types.${type}`)}</RadixToast.Title>
      <RadixToast.Description className={s.description}>{description}</RadixToast.Description>
      <RadixToast.Close asChild>
        <IconButton className={s.close} aria-label={t('close')}>
          <CrossIcon />
        </IconButton>
      </RadixToast.Close>
    </RadixToast.Root>
  );
};
