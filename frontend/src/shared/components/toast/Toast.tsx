import { Toast as RadixToast } from 'radix-ui';
import s from './Toast.module.css';
import { CrossIcon } from '@/shared/components/icons/CrossIcon';
import { IconButton } from '@/shared/components/buttons';
import { type ToastType, TITLES } from './Toast.types';

interface Props {
  description: string;
  type: ToastType;
  title?: string;
}

export const Toast = ({ description, type, title }: Props) => {
  return (
    <RadixToast.Root className={s.root} data-type={type}>
      <RadixToast.Title className={s.title}>{title || TITLES[type]}</RadixToast.Title>
      <RadixToast.Description className={s.description}>{description}</RadixToast.Description>
      <RadixToast.Close asChild>
        <IconButton className={s.close} aria-label="Close">
          <CrossIcon />
        </IconButton>
      </RadixToast.Close>
    </RadixToast.Root>
  );
};
