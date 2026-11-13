import { describe, expect, it } from 'vitest';
import { groupByCategory } from '@/features/skills/user-skills/lib/groupByCategory';
import type { UserSkillFieldsFragment } from '@/gql/graphql';

const frontend = { id: 'c1', name: 'Frontend' };
const backend = { id: 'c2', name: 'Backend' };

const userSkill = (
  id: string,
  skillName: string,
  category: { id: string; name: string },
): UserSkillFieldsFragment => ({
  id,
  mastery: 'ADVANCED',
  skill: { id: `skill-${id}`, name: skillName, category },
});

describe('groupByCategory', () => {
  it('returns no groups for an empty list', () => {
    expect(groupByCategory([])).toEqual([]);
  });

  it('puts several skills of the same category into one group', () => {
    const react = userSkill('1', 'React', frontend);
    const css = userSkill('2', 'CSS', frontend);

    const groups = groupByCategory([react, css]);

    expect(groups).toEqual([{ category: frontend, skills: [react, css] }]);
  });

  it('creates one group per category, in the order the category first appears', () => {
    const react = userSkill('1', 'React', frontend);
    const nest = userSkill('2', 'NestJS', backend);

    const groups = groupByCategory([react, nest]);

    expect(groups.map((g) => g.category)).toEqual([frontend, backend]);
  });

  it('groups skills of the same category even when they are not adjacent', () => {
    const react = userSkill('1', 'React', frontend);
    const nest = userSkill('2', 'NestJS', backend);
    const css = userSkill('3', 'CSS', frontend);

    const groups = groupByCategory([react, nest, css]);

    // one Frontend group holding both React and CSS, not two separate ones
    expect(groups).toEqual([
      { category: frontend, skills: [react, css] },
      { category: backend, skills: [nest] },
    ]);
  });

  it('keeps each skill in full, category included', () => {
    const react = userSkill('1', 'React', frontend);

    const groups = groupByCategory([react]);

    expect(groups[0]?.skills[0]).toBe(react);
  });
});
