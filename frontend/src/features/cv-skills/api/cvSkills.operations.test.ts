import { describe, expect, it } from 'vitest';
import { NO_ERROR_TOAST } from '@/shared/lib/apollo/error-toast-link';
import {
  AVAILABLE_CV_SKILLS,
  CV_SKILL_MUTATION_OPTIONS,
  CV_SKILL_REFETCH_ERROR_CODES,
  CV_SKILL_REFETCH_QUERIES,
  CV_SKILLS,
} from './cvSkills.operations';

describe('cvSkills operations', () => {
  it('refetches the CV skills and the Add skill options, and waits for them', () => {
    expect(CV_SKILL_REFETCH_QUERIES).toEqual([CV_SKILLS, AVAILABLE_CV_SKILLS]);
    expect(CV_SKILL_MUTATION_OPTIONS.refetchQueries).toBe(CV_SKILL_REFETCH_QUERIES);
    expect(CV_SKILL_MUTATION_OPTIONS.awaitRefetchQueries).toBe(true);
  });

  it('shows the errors in the dialog, not in the global toast', () => {
    expect(CV_SKILL_MUTATION_OPTIONS.context).toBe(NO_ERROR_TOAST);
  });

  // stale lists: already in the CV, the owner no longer has the skill, the CV is gone
  it('reloads the lists after CONFLICT, BAD_USER_INPUT and NOT_FOUND, but not FORBIDDEN', () => {
    expect(CV_SKILL_REFETCH_ERROR_CODES).toEqual(['CONFLICT', 'BAD_USER_INPUT', 'NOT_FOUND']);
    expect(CV_SKILL_REFETCH_ERROR_CODES).not.toContain('FORBIDDEN');
  });
});
