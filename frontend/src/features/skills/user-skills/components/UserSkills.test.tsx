import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { closedGate } from '@/test/action-gate';
import { renderWithProviders } from '@/test/render';
import { DELETE_USER_SKILLS, USER_SKILLS } from '../api/userSkills.operations';
import { UserSkills } from './UserSkills';

const USER_ID = 'u1';
const EMPTY = 'No skills added yet';

const frontend = { id: 'c1', name: 'Frontend' };
const backend = { id: 'c2', name: 'Backend' };

const userSkill = (
  id: string,
  name: string,
  mastery: 'ADVANCED' | 'EXPERT' | 'BEGINNER',
  category: { id: string; name: string },
) => ({
  __typename: 'UserSkill' as const,
  id,
  skill: { __typename: 'Skill' as const, id: `skill-${id}`, name, category },
  mastery,
});

const react = userSkill('us1', 'React', 'ADVANCED', frontend);
const css = userSkill('us2', 'CSS', 'BEGINNER', frontend);
const nest = userSkill('us3', 'NestJS', 'EXPERT', backend);

const listMock = (items = [react, css, nest]): MockLink.MockedResponse => ({
  request: { query: USER_SKILLS, variables: { userId: USER_ID } },
  result: { data: { userSkills: items } },
});

const renderList = ({
  canEdit = true,
  mocks = [listMock()],
}: { canEdit?: boolean; mocks?: MockLink.MockedResponse[] } = {}) =>
  renderWithProviders(<UserSkills userId={USER_ID} canEdit={canEdit} emptyMessage={EMPTY} />, {
    mocks,
  });

async function openRowAction(user: ReturnType<typeof renderList>['user'], name: RegExp) {
  await user.click(await screen.findByRole('button', { name }));
}

describe('UserSkills', () => {
  describe('states', () => {
    it('shows placeholders while loading, then the skills with their levels', async () => {
      renderList();

      expect(screen.getByRole('list', { name: 'Loading skills' })).toHaveAttribute(
        'aria-busy',
        'true',
      );

      expect(await screen.findByText('React')).toBeInTheDocument();
      // the bar is named by the skill and says its mastery
      expect(screen.getByRole('meter', { name: 'NestJS' })).toHaveAttribute(
        'aria-valuetext',
        'Expert',
      );
    });

    it('shows the empty message, and Add is still there', async () => {
      renderList({ mocks: [listMock([])] });

      expect(await screen.findByText(EMPTY)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add skill' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Remove skills' })).toBeDisabled();
    });

    it('shows a load error with Retry, and Retry loads the list', async () => {
      const { user } = renderList({
        mocks: [
          {
            request: { query: USER_SKILLS, variables: { userId: USER_ID } },
            error: new Error('down'),
          },
          listMock(),
        ],
      });

      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load skills');

      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('React')).toBeInTheDocument();
    });
  });

  describe('grouping by category', () => {
    it('shows each category as its own named section, with only its own skills', async () => {
      renderList();
      await screen.findByText('React');

      const frontendSection = screen.getByRole('region', { name: 'Frontend' });
      expect(within(frontendSection).getByText('React')).toBeInTheDocument();
      expect(within(frontendSection).getByText('CSS')).toBeInTheDocument();
      expect(within(frontendSection).queryByText('NestJS')).not.toBeInTheDocument();

      const backendSection = screen.getByRole('region', { name: 'Backend' });
      expect(within(backendSection).getByText('NestJS')).toBeInTheDocument();
    });

    it('does not show a section for a category with no skills', async () => {
      renderList({ mocks: [listMock([react])] });

      await screen.findByText('React');

      expect(screen.getByRole('region', { name: 'Frontend' })).toBeInTheDocument();
      expect(screen.queryByRole('region', { name: 'Backend' })).not.toBeInTheDocument();
    });
  });

  describe('read-only (another user, not Admin)', () => {
    it('has no actions and the skills are not clickable', async () => {
      renderList({ canEdit: false });

      await screen.findByText('React');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('owner or Admin', () => {
    it('opens Add skill', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: 'Add skill' }));

      expect(screen.getByRole('dialog', { name: 'Add skill' })).toBeInTheDocument();
    });

    it('opens Update skill for the clicked skill', async () => {
      const { user } = renderList();

      await openRowAction(user, /React/);

      const dialog = screen.getByRole('dialog', { name: 'Update skill' });
      expect(within(dialog).getByRole('combobox', { name: 'Skill' })).toHaveTextContent('React');
    });
  });

  describe('remove', () => {
    it('selects skills instead of opening Update, and counts them', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: 'Remove skills' }));
      const remove = screen.getByRole('button', { name: 'Remove (0)' });
      expect(remove).toBeDisabled();

      const reactButton = screen.getByRole('button', { name: /React/ });
      await user.click(reactButton);
      await user.click(screen.getByRole('button', { name: /NestJS/ }));

      expect(reactButton).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /CSS/ })).toHaveAttribute('aria-pressed', 'false');
      expect(screen.getByRole('button', { name: 'Remove (2)' })).toBeEnabled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Cancel leaves selection mode without removing anything', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: 'Remove skills' }));
      await user.click(screen.getByRole('button', { name: /React/ }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('button', { name: 'Remove skills' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /React/ })).not.toHaveAttribute('aria-pressed');
    });

    it('removes the selected assignments after confirmation and refreshes the list', async () => {
      const { user } = renderList({
        mocks: [
          listMock(),
          {
            // the UserSkill ids, not the skill ids
            request: {
              query: DELETE_USER_SKILLS,
              variables: { ids: ['us1', 'us3'], userId: USER_ID },
            },
            result: { data: { deleteUserSkills: ['us1', 'us3'] } },
          },
          // refetchQueries: the list without the removed skills
          listMock([css]),
        ],
      });

      await user.click(await screen.findByRole('button', { name: 'Remove skills' }));
      await user.click(screen.getByRole('button', { name: /React/ }));
      await user.click(screen.getByRole('button', { name: /NestJS/ }));
      await user.click(screen.getByRole('button', { name: 'Remove (2)' }));

      const dialog = screen.getByRole('dialog', { name: 'Remove skills' });
      expect(dialog).toHaveTextContent('Are you sure you want to remove 2 skills?');
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('React')).not.toBeInTheDocument();
      expect(screen.getByText('CSS')).toBeInTheDocument();
      // selection mode is over
      expect(screen.getByRole('button', { name: 'Remove skills' })).toBeInTheDocument();
    });
  });

  describe('with a closed action gate (unverified email)', () => {
    it('locks Add, Remove and opening Update; the clicks are stopped', async () => {
      const { blocked, Wrapper } = closedGate();
      const { user } = renderWithProviders(
        <Wrapper>
          <UserSkills userId={USER_ID} canEdit emptyMessage={EMPTY} />
        </Wrapper>,
        { mocks: [listMock()] },
      );

      const add = await screen.findByRole('button', { name: 'Add skill' });
      const remove = screen.getByRole('button', { name: 'Remove skills' });
      const react = screen.getByRole('button', { name: /React/ });

      for (const button of [add, remove, react]) {
        expect(button).toHaveAttribute('aria-disabled', 'true');
        await user.click(button);
      }

      expect(blocked).toHaveBeenCalledTimes(3);
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
      // still not in selection mode
      expect(screen.queryByRole('button', { name: /Remove \(/ })).not.toBeInTheDocument();
    });

    it('leaves Retry alone: reloading changes nothing', async () => {
      const { Wrapper } = closedGate();
      renderWithProviders(
        <Wrapper>
          <UserSkills userId={USER_ID} canEdit emptyMessage={EMPTY} />
        </Wrapper>,
        {
          mocks: [
            {
              request: { query: USER_SKILLS, variables: { userId: USER_ID } },
              error: new Error('down'),
            },
          ],
        },
      );

      await screen.findByRole('alert');
      expect(screen.getByRole('button', { name: 'Retry' })).not.toHaveAttribute('aria-disabled');
    });
  });
});
