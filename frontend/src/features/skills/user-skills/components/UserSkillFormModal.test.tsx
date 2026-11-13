import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  AVAILABLE_USER_SKILLS,
  CREATE_USER_SKILL,
  UPDATE_USER_SKILL,
} from '../api/userSkills.operations';
import { UserSkillFormModal } from './UserSkillFormModal';

const USER_ID = 'u1';

const frontend = { id: 'c1', name: 'Frontend' };

const react = { id: 's1', name: 'React' };
const vue = { id: 's2', name: 'Vue' };

const userSkill = {
  __typename: 'UserSkill' as const,
  id: 'us1',
  skill: { __typename: 'Skill' as const, ...react, category: frontend },
  mastery: 'ADVANCED' as const,
};

// skills the user does not have yet
const availableMock: MockLink.MockedResponse = {
  request: { query: AVAILABLE_USER_SKILLS, variables: { userId: USER_ID } },
  result: { data: { availableUserSkills: [vue] } },
};

const createRequest = {
  query: CREATE_USER_SKILL,
  variables: { input: { userId: USER_ID, skillId: 's2', mastery: 'EXPERT' } },
};

const choose = async (
  user: ReturnType<typeof renderWithProviders>['user'],
  label: string,
  option: string,
) => {
  const trigger = screen.getByRole('combobox', { name: label });
  await expect.poll(() => trigger).toBeEnabled();
  await user.click(trigger);
  await user.click(within(document.body).getByRole('option', { name: option }));
};

describe('UserSkillFormModal', () => {
  describe('add', () => {
    it('offers only the skills the user does not have, and every mastery level', async () => {
      const { user } = renderWithProviders(
        <UserSkillFormModal open onOpenChange={vi.fn()} userId={USER_ID} />,
        { mocks: [availableMock] },
      );

      expect(screen.getByRole('dialog', { name: 'Add skill' })).toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: 'Skill' }));
      await expect
        .poll(() =>
          within(document.body)
            .queryAllByRole('option')
            .map((o) => o.textContent),
        )
        .toEqual(['Vue']);
      await user.keyboard('{Escape}');

      await user.click(screen.getByRole('combobox', { name: 'Skill mastery' }));
      expect(
        within(document.body)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert']);
    });

    it('adds the skill for this user and closes', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <UserSkillFormModal open onOpenChange={onOpenChange} userId={USER_ID} />,
        {
          mocks: [
            availableMock,
            {
              request: createRequest,
              result: {
                data: {
                  createUserSkill: {
                    ...userSkill,
                    id: 'us2',
                    skill: { __typename: 'Skill', ...vue, category: frontend },
                    mastery: 'EXPERT',
                  },
                },
              },
            },
            // refetchQueries: the available list is open in the modal, so it is reloaded too
            { ...availableMock, result: { data: { availableUserSkills: [] } } },
          ],
        },
      );

      const add = screen.getByRole('button', { name: 'Add' });
      expect(add).toBeDisabled();

      await choose(user, 'Skill', 'Vue');
      await choose(user, 'Skill mastery', 'Expert');
      await user.click(add);

      await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows an already added skill (CONFLICT) under Skill', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <UserSkillFormModal open onOpenChange={onOpenChange} userId={USER_ID} />,
        {
          mocks: [
            availableMock,
            {
              request: createRequest,
              result: {
                errors: [
                  new GraphQLError('Skill is already assigned', {
                    extensions: { code: 'CONFLICT', field: 'skillId' },
                  }),
                ],
              },
            },
          ],
        },
      );

      await choose(user, 'Skill', 'Vue');
      await choose(user, 'Skill mastery', 'Expert');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      const skill = screen.getByRole('combobox', { name: 'Skill' });
      await expect.poll(() => skill).toHaveAccessibleDescription('This value is already taken');
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('keeps the skill fixed and sends only the new mastery', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <UserSkillFormModal
          open
          onOpenChange={onOpenChange}
          userId={USER_ID}
          userSkill={userSkill}
        />,
        {
          mocks: [
            {
              request: {
                query: UPDATE_USER_SKILL,
                variables: { input: { id: 'us1', userId: USER_ID, mastery: 'EXPERT' } },
              },
              result: { data: { updateUserSkill: { ...userSkill, mastery: 'EXPERT' } } },
            },
          ],
        },
      );

      expect(screen.getByRole('dialog', { name: 'Update skill' })).toBeInTheDocument();
      const skill = screen.getByRole('combobox', { name: 'Skill' });
      expect(skill).toBeDisabled();
      expect(skill).toHaveTextContent('React');
      expect(screen.getByRole('combobox', { name: 'Skill mastery' })).toHaveTextContent('Advanced');
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

      await choose(user, 'Skill mastery', 'Expert');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
