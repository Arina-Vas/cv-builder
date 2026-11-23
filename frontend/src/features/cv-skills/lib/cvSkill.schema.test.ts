import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../messages/en.json';
import { cvSkillSchema } from '@/features/cv-skills/lib/cvSkill.schema';

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
