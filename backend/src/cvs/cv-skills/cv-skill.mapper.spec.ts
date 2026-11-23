import { Mastery } from '@/common/graphql/enums';
import { skillInclude } from '@/skills/skill.mapper';
import { cvSkillInclude, ownerHasSkill, toCvSkill, type CvSkillWithSkill } from './cv-skill.mapper';

const createdAt = new Date('2026-01-01T00:00:00.000Z');

const row = (users: CvSkillWithSkill['skill']['users']): CvSkillWithSkill => ({
  id: 'cv-skill-1',
  cvId: 'cv-1',
  skillId: 'skill-1',
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
    users,
    createdAt,
    updatedAt: createdAt,
  },
  createdAt,
  updatedAt: createdAt,
});

describe('cvSkillInclude', () => {
  it("loads the skill with its category and only the CV owner's mastery", () => {
    expect(cvSkillInclude('owner-1')).toEqual({
      skill: {
        include: {
          ...skillInclude,
          users: { where: { userId: 'owner-1' }, select: { mastery: true } },
        },
      },
    });
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
  it("maps the CV skill with the owner's mastery and drops service fields", () => {
    expect(toCvSkill(row([{ mastery: Mastery.ADVANCED }]))).toEqual({
      id: 'cv-skill-1',
      mastery: Mastery.ADVANCED,
      skill: {
        id: 'skill-1',
        name: 'TypeScript',
        category: { id: 'category-1', name: 'Programming languages', type: 'Backend' },
      },
    });
  });

  it('fails instead of inventing a mastery when the owner no longer has the skill', () => {
    expect(() => toCvSkill(row([]))).toThrow(
      'CvSkill cv-skill-1: CV owner has no UserSkill for skill skill-1',
    );
  });
});
