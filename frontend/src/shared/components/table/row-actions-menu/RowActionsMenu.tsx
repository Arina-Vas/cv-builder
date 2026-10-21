import { DropdownMenu } from 'radix-ui';
import { IconButton } from '../../buttons';
import { MoreVertIcon } from '../../icons/MoreVertIcon';
import type { RowAction } from '../types';
import styles from './RowActionsMenu.module.css';

export interface RowActionsMenuProps<T> {
  row: T;
  actions: RowAction<T>[];
  label: string;
}

export function RowActionsMenu<T>({ row, actions, label }: RowActionsMenuProps<T>) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <IconButton aria-label={label}>
          <MoreVertIcon />
        </IconButton>
      </DropdownMenu.Trigger>

      <DropdownMenu.Portal>
        <DropdownMenu.Content className={styles.content} align="end" sideOffset={5}>
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
