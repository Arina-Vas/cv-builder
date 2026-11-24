import { useTranslations } from 'next-intl';
import { useMemo } from 'react';
import type { Mastery } from '@/gql/graphql';
import { MASTERY_LEVEL } from '@/features/skills/user-skills/lib/mastery';
import { LevelItem } from '@/shared/components/level-item/LevelItem';
import { groupByCategory } from '@/shared/lib/groupByCategory';
import s from './SkillGroups.module.css';

type SkillItem = {
  id: string;
  mastery: Mastery;
  skill: { name: string; category: { id: string; name: string } };
};

type Props<T extends SkillItem> = {
  skills: T[];
  idPrefix: string;
  canEdit: boolean;
  selectedIds?: ReadonlySet<string>;
  onItemClick: (item: T) => void;
};

export const SkillGroups = <T extends SkillItem>({
  skills,
  idPrefix,
  canEdit,
  selectedIds,
  onItemClick,
}: Props<T>) => {
  const t = useTranslations('userSkill.masteryLevel');

  const groups = useMemo(() => groupByCategory(skills), [skills]);

  return groups.map((group) => {
    const headingId = `${idPrefix}-${group.category.id}`;

    return (
      <section key={group.category.id} aria-labelledby={headingId}>
        <h2 id={headingId} className={s.title}>
          {group.category.name}
        </h2>
        <ul className={s.list}>
          {group.skills.map((item) => (
            <li key={item.id}>
              <LevelItem
                name={item.skill.name}
                level={MASTERY_LEVEL[item.mastery]}
                levelLabel={t(item.mastery)}
                canEdit={canEdit}
                onClick={() => onItemClick(item)}
                selected={selectedIds?.has(item.id)}
              />
            </li>
          ))}
        </ul>
      </section>
    );
  });
};
