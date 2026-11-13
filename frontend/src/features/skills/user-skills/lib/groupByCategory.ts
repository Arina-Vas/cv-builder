import type { UserSkillFieldsFragment } from '@/gql/graphql';

export type GroupedSkills = {
  category: { id: string; name: string };
  skills: UserSkillFieldsFragment[];
}[];

export const groupByCategory = (skills: UserSkillFieldsFragment[]): GroupedSkills => {
  const groups = new Map<
    string,
    { category: { id: string; name: string }; skills: UserSkillFieldsFragment[] }
  >();

  for (const item of skills) {
    const category = item.skill.category;
    const group = groups.get(category.id);
    if (group) {
      group.skills.push(item);
    } else {
      groups.set(category.id, { category, skills: [item] });
    }
  }

  return [...groups.values()];
};
