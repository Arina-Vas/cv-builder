import { useEffect, useRef, useState } from 'react';
import { DropdownMenu } from 'radix-ui';
import { IconButton } from '../../buttons';
import { MoreIcon } from '../../icons/MoreIcon';
import type { RowAction } from '../types';
import styles from './RowActionsMenu.module.css';

export interface RowActionsMenuProps<T> {
  row: T;
  actions: RowAction<T>[];
  label: string;
}

export function RowActionsMenu<T>({ row, actions, label }: RowActionsMenuProps<T>) {
  const [open, setOpen] = useState(false);
  const closedByScrollRef = useRef(false);

  useEffect(() => {
    if (!open) return;

    const handleScroll = () => {
      closedByScrollRef.current = true;
      setOpen(false);
    };

    window.addEventListener('scroll', handleScroll, { capture: true, passive: true });
    return () => window.removeEventListener('scroll', handleScroll, { capture: true });
  }, [open]);

  const handleCloseAutoFocus = (event: Event) => {
    if (closedByScrollRef.current) {
      event.preventDefault();
      closedByScrollRef.current = false;
    }
  };

  return (
    <DropdownMenu.Root modal={false} open={open} onOpenChange={setOpen}>
      <DropdownMenu.Trigger asChild>
        <IconButton aria-label={label}>
          <MoreIcon />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className={styles.content}
          align="end"
          alignOffset={5}
          sideOffset={0}
          onCloseAutoFocus={handleCloseAutoFocus}
        >
          {actions.map((action) => (
            <DropdownMenu.Item
              className={styles.item}
              key={action.label}
              onSelect={() => action.onSelect(row)}
            >
              {action.label}
            </DropdownMenu.Item>
          ))}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
