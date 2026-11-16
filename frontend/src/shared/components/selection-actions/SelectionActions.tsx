import { Button } from '@/shared/components/buttons';
import { PlusIcon } from '@/shared/components/icons/PlusIcon';
import { TrashIcon } from '@/shared/components/icons/TrashIcon';
import s from './SelectionActions.module.css';

type Props = {
  canEdit: boolean;
  selecting: boolean;
  selectedCount: number;
  canRemove: boolean;
  addLabel: string;
  removeLabel: string;
  confirmRemoveLabel: string;
  cancelLabel: string;
  onAdd: () => void;
  onStartRemove: () => void;
  onCancel: () => void;
  onRemove: () => void;
};

export const SelectionActions = ({
  canEdit,
  selecting,
  selectedCount,
  canRemove,
  addLabel,
  removeLabel,
  confirmRemoveLabel,
  cancelLabel,
  onAdd,
  onStartRemove,
  onCancel,
  onRemove,
}: Props) => {
  if (!canEdit) return null;

  return (
    <div className={s.actions}>
      {!selecting && (
        <>
          <Button size={'sm'} gated onClick={onAdd} variant={'ghost'}>
            <PlusIcon />
            {addLabel}
          </Button>
          <Button variant={'text'} size={'sm'} gated disabled={!canRemove} onClick={onStartRemove}>
            <TrashIcon />
            {removeLabel}
          </Button>
        </>
      )}

      {selecting && (
        <>
          <Button size={'sm'} onClick={onCancel} variant={'secondary'}>
            {cancelLabel}
          </Button>
          <Button disabled={selectedCount === 0} size={'sm'} gated onClick={onRemove}>
            {confirmRemoveLabel} <span className={s.badge}>{selectedCount}</span>
          </Button>
        </>
      )}
    </div>
  );
};
