import { Mastery } from '@/common/graphql/enums';
import { toUserSkill, type UserSkillWithSkill } from './user-skill.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row: UserSkillWithSkill = {
  id: 'user-skill-1',
  userId: 'user-1',
  skillId: 'skill-1',
  mastery: Mastery.INTERMEDIATE,
  skill: {
    id: 'skill-1',
    name: 'TypeScript',
    categoryId: 'category-1',
    category: {
      id: 'category-1',
      name: 'Programming languages',
      type: 'Backend',
      createdAt,
      updatedAt: createdAt,
    },
    createdAt,
    updatedAt: createdAt,
  },
  createdAt,
  updatedAt: createdAt,
};

describe('toUserSkill', () => {
  it('maps the assignment with its skill and category and drops service fields', () => {
    expect(toUserSkill(row)).toEqual({
      id: 'user-skill-1',
      mastery: Mastery.INTERMEDIATE,
      skill: {
        id: 'skill-1',
        name: 'TypeScript',
        category: { id: 'category-1', name: 'Programming languages', type: 'Backend' },
      },
    });
  });
});
