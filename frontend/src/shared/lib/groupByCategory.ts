type Category = { id: string; name: string };

type WithCategory = { skill: { category: Category } };

export type CategoryGroup<T> = { category: Category; skills: T[] };

/** Groups skill assignments (UserSkill, CvSkill) by their skill's category, keeping the input
 *  order of categories and of skills inside each category; categories without skills never appear */
export const groupByCategory = <T extends WithCategory>(skills: T[]): CategoryGroup<T>[] => {
  const groups = new Map<string, CategoryGroup<T>>();

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
