import { Mastery } from '@/common/graphql/enums';
import { skillInclude } from '@/skills/skill.mapper';
import { cvSkillInclude, ownerHasSkill, toCvSkill, type CvSkillWithSkill } from './cv-skill.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row: CvSkillWithSkill = {
  id: 'cv-skill-1',
  cvId: 'cv-1',
  skillId: 'skill-1',
  mastery: Mastery.ADVANCED,
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

describe('cvSkillInclude', () => {
  it('loads the skill with its category', () => {
    expect(cvSkillInclude).toEqual({ skill: { include: skillInclude } });
  });
});

describe('ownerHasSkill', () => {
  it('keeps only CV skills the owner still has', () => {
    expect(ownerHasSkill('owner-1')).toEqual({
      skill: { users: { some: { userId: 'owner-1' } } },
    });
  });
});

describe('toCvSkill', () => {
  it('maps the CV skill with its own mastery and drops service fields', () => {
    expect(toCvSkill(row)).toEqual({
      id: 'cv-skill-1',
      mastery: Mastery.ADVANCED,
      skill: {
        id: 'skill-1',
        name: 'TypeScript',
        category: { id: 'category-1', name: 'Programming languages', type: 'Backend' },
      },
    });
  });
});
