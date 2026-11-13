import { createTranslator } from 'next-intl';
import { describe, expect, it } from 'vitest';
import messages from '../../../../../messages/en.json';
import { userSkillSchema } from '@/features/skills/user-skills/lib/userSkill.schema';

const t = createTranslator({ locale: 'en', messages, namespace: 'validation' });
const schema = userSkillSchema(t);

const valid = { skillId: 's1', mastery: 'ADVANCED' };

const errorOf = (field: keyof typeof valid, value: string) =>
  schema
    .safeParse({ ...valid, [field]: value })
    .error?.issues.find((issue) => issue.path[0] === field)?.message;

describe('userSkillSchema', () => {
  it('accepts a skill with a mastery', () => {
    expect(schema.parse(valid)).toEqual(valid);
  });

  // the selects keep '' while nothing is chosen
  it('requires a skill', () => {
    expect(errorOf('skillId', '')).toBe('Skill is required');
  });

  it('requires a mastery', () => {
    expect(errorOf('mastery', '')).toBe('Skill mastery is required');
  });

  it('rejects a mastery the backend does not know', () => {
    expect(schema.safeParse({ ...valid, mastery: 'D1' }).success).toBe(false);
  });
});
