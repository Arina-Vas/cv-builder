import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { TECHNOLOGIES, UPDATE_PROJECT } from '../api/projects.operations';
import { ProjectFormModal } from './ProjectFormModal';

const react = { __typename: 'Skill' as const, id: 't1', name: 'React' };
const nest = { __typename: 'Skill' as const, id: 't2', name: 'NestJS' };

const project = {
  __typename: 'Project' as const,
  id: 'p1',
  name: 'Blog',
  domain: 'Blogging',
  description: 'A blogging website',
  startDate: '2024-03-01',
  endDate: '2024-12-31',
  technologies: [react],
};

const technologiesMock: MockLink.MockedResponse = {
  request: { query: TECHNOLOGIES },
  result: { data: { technologies: [react, nest] } },
};

describe('ProjectFormModal', () => {
  it('keeps Create disabled until the required fields are filled', () => {
    renderWithProviders(<ProjectFormModal open onOpenChange={vi.fn()} />, {
      mocks: [technologiesMock],
    });

    expect(screen.getByRole('dialog', { name: 'Create project' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Create' })).toBeDisabled();
  });

  it('offers the technologies from the API and keeps Environment disabled while they load', async () => {
    const { user } = renderWithProviders(<ProjectFormModal open onOpenChange={vi.fn()} />, {
      mocks: [technologiesMock],
    });

    const environment = screen.getByRole('combobox', { name: 'Environment' });
    expect(environment).toBeDisabled();

    await expect.poll(() => environment).toBeEnabled();
    await user.click(environment);

    const options = within(screen.getByRole('listbox', { name: 'Environment' })).getAllByRole(
      'option',
    );
    expect(options.map((option) => option.textContent)).toEqual(['React', 'NestJS']);
  });

  it('edits the project: every field prefilled, dates sent as YYYY-MM-DD, technologies as ids', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <ProjectFormModal open onOpenChange={onOpenChange} project={project} />,
      {
        mocks: [
          technologiesMock,
          {
            request: {
              query: UPDATE_PROJECT,
              variables: {
                input: {
                  id: 'p1',
                  name: 'Blog v2',
                  domain: 'Blogging',
                  description: 'A blogging website',
                  startDate: '2024-03-01',
                  endDate: '2024-12-31',
                  technologyIds: ['t1'],
                },
              },
            },
            result: { data: { updateProject: { ...project, name: 'Blog v2' } } },
          },
        ],
      },
    );

    expect(screen.getByRole('dialog', { name: 'Edit project' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Blog');
    expect(screen.getByLabelText('Domain')).toHaveValue('Blogging');
    expect(screen.getByLabelText('Description')).toHaveValue('A blogging website');
    expect(screen.getByLabelText('Start Date')).toHaveTextContent('01.03.2024');
    expect(screen.getByLabelText('End Date')).toHaveTextContent('31.12.2024');
    // the chip of the preselected technology appears once the options are loaded
    expect(await screen.findByText('React')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), ' v2');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });
});
