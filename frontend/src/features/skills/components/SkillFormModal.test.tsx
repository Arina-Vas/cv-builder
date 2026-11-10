import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CREATE_SKILL, SKILL_CATEGORIES, UPDATE_SKILL } from '../api/skills.operations';
import { SkillFormModal } from './SkillFormModal';

const frontend = {
  __typename: 'SkillCategory' as const,
  id: 'c1',
  name: 'Frontend',
  type: 'Programming',
};
const testing = { __typename: 'SkillCategory' as const, id: 'c2', name: 'Testing', type: 'QA' };

const skill = { __typename: 'Skill' as const, id: 's1', name: 'React', category: frontend };

const categoriesMock: MockLink.MockedResponse = {
  request: { query: SKILL_CATEGORIES },
  result: { data: { skillCategories: [frontend, testing] } },
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

describe('SkillFormModal', () => {
  it('creates a skill with the chosen category and closes', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<SkillFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        categoriesMock,
        {
          request: {
            query: CREATE_SKILL,
            variables: { input: { name: 'Cypress', categoryId: 'c2' } },
          },
          result: {
            data: { createSkill: { ...skill, id: 's2', name: 'Cypress', category: testing } },
          },
        },
      ],
    });

    expect(screen.getByRole('dialog', { name: 'Create skill' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Name'), ' Cypress ');
    await choose(user, 'Category', 'Testing');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('offers the categories from the API and keeps Category disabled while they load', async () => {
    const { user } = renderWithProviders(<SkillFormModal open onOpenChange={vi.fn()} />, {
      mocks: [categoriesMock],
    });

    const trigger = screen.getByRole('combobox', { name: 'Category' });
    expect(trigger).toBeDisabled();

    await expect.poll(() => trigger).toBeEnabled();
    await user.click(trigger);

    const options = within(document.body).getAllByRole('option');
    expect(options.map((option) => option.textContent)).toEqual(['Frontend', 'Testing']);
  });

  it('shows why the categories are missing when they fail to load', async () => {
    renderWithProviders(<SkillFormModal open onOpenChange={vi.fn()} />, {
      mocks: [{ request: { query: SKILL_CATEGORIES }, error: new Error('Network down') }],
    });

    const trigger = screen.getByRole('combobox', { name: 'Category' });
    await expect.poll(() => trigger).toHaveAttribute('aria-invalid', 'true');
  });

  it('shows a duplicate name under the Name field', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<SkillFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        categoriesMock,
        {
          request: {
            query: CREATE_SKILL,
            variables: { input: { name: 'React', categoryId: 'c1' } },
          },
          result: {
            errors: [
              new GraphQLError('Skill already exists', {
                extensions: { code: 'CONFLICT', field: 'name' },
              }),
            ],
          },
        },
      ],
    });

    await user.type(screen.getByLabelText('Name'), 'React');
    await choose(user, 'Category', 'Frontend');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const name = screen.getByLabelText('Name');
    await expect.poll(() => name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('This value is already taken');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('edits the skill: prefilled with its category, sends the new category', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <SkillFormModal open onOpenChange={onOpenChange} skill={skill} />,
      {
        mocks: [
          categoriesMock,
          {
            request: {
              query: UPDATE_SKILL,
              variables: { input: { id: 's1', name: 'React', categoryId: 'c2' } },
            },
            result: { data: { updateSkill: { ...skill, category: testing } } },
          },
        ],
      },
    );

    expect(screen.getByRole('dialog', { name: 'Edit skill' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('React');
    const trigger = screen.getByRole('combobox', { name: 'Category' });
    await expect.poll(() => trigger).toHaveTextContent('Frontend');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await choose(user, 'Category', 'Testing');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });
});
