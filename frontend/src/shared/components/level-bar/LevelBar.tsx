import s from './LevelBar.module.css';
import { type LevelType, LEVEL_MAX, LEVEL_MIN } from './LevelBar.types';
import type { ComponentProps } from 'react';

type Props = {
  level: LevelType;
  label?: string;
} & ComponentProps<'div'>;

export const LevelBar = ({ level, label, className, ...rest }: Props) => {
  return (
    <div
      {...rest}
      className={[s.root, className].filter(Boolean).join(' ')}
      role="meter"
      data-level={level}
      aria-valuemin={LEVEL_MIN}
      aria-valuemax={LEVEL_MAX}
      aria-valuenow={level}
      aria-valuetext={label}
    >
      <div className={s.fill} style={{ width: `${(level / LEVEL_MAX) * 100}%` }} />
    </div>
  );
};
