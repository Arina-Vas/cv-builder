import { useEffect, useRef, useState } from 'react';
import { DropdownMenu } from 'radix-ui';
import { IconButton } from '../../buttons';
import { MoreIcon } from '../../icons/MoreIcon';
import { useActionGate } from '@/shared/lib/action-gate/ActionGate';
import type { RowAction } from '../types';
import styles from './RowActionsMenu.module.css';

export interface RowActionsMenuProps<T> {
  row: T;
  actions: RowAction<T>[];
  label: string;
}

export function RowActionsMenu<T>({ row, actions, label }: RowActionsMenuProps<T>) {
  const { locked, guard } = useActionGate();
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
          {actions.map((action) => {
            const gated = !action.ungated;
            const select = () => action.onSelect(row);

            return (
              <DropdownMenu.Item
                className={styles.item}
                key={action.label}
                // not Radix `disabled`: it skips the item, and the user never learns why
                aria-disabled={(gated && locked) || undefined}
                onSelect={gated ? guard(select) : select}
              >
                {action.label}
              </DropdownMenu.Item>
            );
          })}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
