import { Button } from '@/shared/components/buttons';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { SearchField } from '@/shared/components/inputs';
import s from './TableToolbar.module.css';

export type TableToolbarProps = {
  search: string;
  onSearch: (search: string) => void;
  /** The "+ CREATE …" button on the right; leave out for a list without creating */
  action?: {
    label: string;
    onClick: () => void;
    ungated?: boolean;
  };
};

export const TableToolbar = ({ search, onSearch, action }: TableToolbarProps) => {
  return (
    <div className={s.toolbar}>
      <SearchField value={search} onChange={onSearch} />
      {action && (
        <Button variant="text" size="sm" gated={!action.ungated} onClick={action.onClick}>
          <span className={s.withIcon}>
            <PlusIcon />
            {action.label}
          </span>
        </Button>
      )}
    </div>
  );
};
