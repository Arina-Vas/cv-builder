import s from './LevelItem.module.css';
import { LevelBar } from '@/shared/components/level-bar/LevelBar';
import { useId } from 'react';
import { useActionGate } from '@/shared/lib/action-gate/ActionGate';
import type { LevelType } from '@/shared/components/level-bar/LevelBar.types';

type Props = {
  name: string;
  level: LevelType;
  levelLabel: string;
  canEdit: boolean;
  onClick?: () => void;
  selected?: boolean;
};
export const LevelItem = ({ name, levelLabel, level, canEdit, onClick, selected }: Props) => {
  const nameId = useId();
  const { locked, guard } = useActionGate();
  const gated = selected === undefined;

  const content = (
    <>
      <LevelBar level={level} label={levelLabel} aria-labelledby={nameId} />
      <span id={nameId}>{name}</span>
    </>
  );

  return canEdit ? (
    <button
      type="button"
      className={s.item}
      aria-pressed={selected}
      aria-disabled={(gated && locked) || undefined}
      onClick={onClick && (gated ? guard(onClick) : onClick)}
    >
      {content}
    </button>
  ) : (
    <div className={s.item}>{content}</div>
  );
};
