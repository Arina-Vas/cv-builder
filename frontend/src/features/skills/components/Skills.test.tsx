import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DELETE_SKILL, SKILL_CATEGORIES, SKILLS } from '../api/skills.operations';
import { Skills } from './Skills';

const frontend = {
  __typename: 'SkillCategory' as const,
  id: 'c1',
  name: 'Frontend',
  type: 'Programming',
};
const testing = { __typename: 'SkillCategory' as const, id: 'c2', name: 'Testing', type: 'QA' };

const skills = [
  { __typename: 'Skill' as const, id: 's1', name: 'React', category: frontend },
  { __typename: 'Skill' as const, id: 's2', name: 'Cypress', category: testing },
];

const listMock = (items = skills): MockLink.MockedResponse => ({
  request: {
    query: SKILLS,
    variables: { page: 1, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' },
  },
  result: {
    data: {
      skills: { __typename: 'SkillPage', items, page: 1, pageSize: 10, total: items.length },
    },
  },
});

const categoriesMock: MockLink.MockedResponse = {
  request: { query: SKILL_CATEGORIES },
  result: { data: { skillCategories: [frontend, testing] } },
};

const deleteRequest = { query: DELETE_SKILL, variables: { id: 's1' } };

const renderPage = (mocks: MockLink.MockedResponse[] = [listMock()]) =>
  renderWithProviders(<Skills />, { mocks });

async function openRowAction(user: ReturnType<typeof renderPage>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: 'Actions for React' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

describe('Skills', () => {
  it('shows name, type and category of each skill', async () => {
    renderPage();

    const row = (await screen.findByText('React')).closest('tr')!;
    expect(within(row).getByText('Programming')).toBeInTheDocument();
    expect(within(row).getByText('Frontend')).toBeInTheDocument();
    expect(screen.getByText('Cypress')).toBeInTheDocument();
  });

  it('sorts by name only', async () => {
    renderPage();
    await screen.findByText('React');

    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Type' })).not.toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Category' })).not.toBeInTheDocument();
  });

  it('opens the create modal', async () => {
    const { user } = renderPage([listMock(), categoriesMock]);

    await user.click(screen.getByRole('button', { name: 'Create skill' }));

    const dialog = screen.getByRole('dialog', { name: 'Create skill' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('');
  });

  it('opens the edit modal with the row data', async () => {
    const { user } = renderPage([listMock(), categoriesMock]);

    await openRowAction(user, 'Edit');

    const dialog = screen.getByRole('dialog', { name: 'Edit skill' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('React');
  });

  describe('delete', () => {
    it('asks to confirm with the skill name in bold', async () => {
      const { user } = renderPage();

      await openRowAction(user, 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Delete skill' });
      expect(dialog).toHaveTextContent('Are you sure you want to delete skill React?');
      expect(within(dialog).getByText('React').tagName).toBe('STRONG');
    });

    it('deletes the skill, closes the dialog and refreshes the list', async () => {
      const { user } = renderPage([
        listMock(),
        { request: deleteRequest, result: { data: { deleteSkill: 's1' } } },
        // refetchQueries: the list without the deleted row
        listMock(skills.slice(1)),
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('React')).not.toBeInTheDocument();
      expect(screen.getByText('Cypress')).toBeInTheDocument();
    });

    it('shows ENTITY_IN_USE in the dialog and keeps it open', async () => {
      const { user } = renderPage([
        listMock(),
        {
          request: deleteRequest,
          result: {
            errors: [new GraphQLError('In use', { extensions: { code: 'ENTITY_IN_USE' } })],
          },
        },
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      const dialog = screen.getByRole('dialog', { name: 'Delete skill' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "This item is in use and can't be deleted",
      );
      expect(screen.getByText('Cypress')).toBeInTheDocument();
    });
  });
});
