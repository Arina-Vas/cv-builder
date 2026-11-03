import { toSkill, type SkillWithCategory } from './skill.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row: SkillWithCategory = {
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
};

describe('toSkill', () => {
  it('maps the skill with its category and drops service fields', () => {
    expect(toSkill(row)).toEqual({
      id: 'skill-1',
      name: 'TypeScript',
      category: { id: 'category-1', name: 'Programming languages', type: 'Backend' },
    });
  });
});
