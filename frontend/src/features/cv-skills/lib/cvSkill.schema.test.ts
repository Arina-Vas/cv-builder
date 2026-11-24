import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { cvSkillSchema, cvSkillUpdateSchema } from '@/features/cv-skills/lib/cvSkill.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = cvSkillSchema(t);

describe('cvSkillSchema', () => {
  it('accepts a chosen skill', () => {
    expect(schema.parse({ skillId: 's1' })).toEqual({ skillId: 's1' });
  });

  // the select keeps '' while nothing is chosen
  it('requires a skill', () => {
    expect(schema.safeParse({ skillId: '' }).error?.issues[0]?.message).toBe('Skill is required');
  });
});

describe('cvSkillUpdateSchema', () => {
  const update = cvSkillUpdateSchema(t);

  it('accepts a mastery level', () => {
    expect(update.parse({ mastery: 'EXPERT' })).toEqual({ mastery: 'EXPERT' });
  });

  it('requires a mastery level', () => {
    expect(update.safeParse({ mastery: '' }).error?.issues[0]?.message).toBe(
      'Skill mastery is required',
    );
  });

  it('rejects an unknown level', () => {
    expect(update.safeParse({ mastery: 'GURU' }).success).toBe(false);
  });
});
