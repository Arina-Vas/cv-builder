import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  AVAILABLE_CV_PROJECTS,
  CREATE_CV_PROJECT,
  CV_PROJECTS,
  PROJECT_ROLES,
  UPDATE_CV_PROJECT,
} from '../api/cvProjects.operations';
import { CvProjectFormModal } from './CvProjectFormModal';

const CV_ID = 'cv1';

const react = { __typename: 'Skill' as const, id: 't1', name: 'React' };
const node = { __typename: 'Skill' as const, id: 't2', name: 'Node.js' };
const developer = { __typename: 'ProjectRole' as const, id: 'r1', name: 'Developer' };
const lead = { __typename: 'ProjectRole' as const, id: 'r2', name: 'Team Lead' };

// the catalog project runs through 2024
const blog = {
  __typename: 'Project' as const,
  id: 'p1',
  name: 'Blog',
  domain: 'Blogging',
  description: 'A blogging website',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  technologies: [react, node],
};

// a finished catalog project, to switch to after a date is picked for Blog
const archive = {
  __typename: 'Project' as const,
  id: 'p2',
  name: 'Archive',
  domain: 'Legacy',
  description: 'A legacy system',
  startDate: '2020-01-01',
  endDate: '2021-12-31',
  technologies: [node],
};

const cvProject = {
  __typename: 'CvProject' as const,
  id: 'cp1',
  startDate: '2024-03-01',
  endDate: '2024-06-30',
  responsibilities: 'Code review',
  roles: [developer],
  project: blog,
};

const availableMock = (projects = [blog]): MockLink.MockedResponse => ({
  request: { query: AVAILABLE_CV_PROJECTS, variables: { cvId: CV_ID } },
  result: { data: { availableCvProjects: projects } },
});

const rolesMock: MockLink.MockedResponse = {
  request: { query: PROJECT_ROLES },
  result: { data: { projectRoles: [developer, lead] } },
};

const listMock: MockLink.MockedResponse = {
  request: {
    query: CV_PROJECTS,
    variables: { cvId: CV_ID, search: '', sortBy: 'name', sortOrder: 'ASC' },
  },
  result: { data: { cvProjects: { __typename: 'CvProjectList', items: [], total: 0 } } },
};

const createInput = {
  cvId: CV_ID,
  projectId: 'p1',
  startDate: '2024-01-10',
  endDate: null,
  roleIds: ['r1'],
  responsibilities: 'Code review',
};

type User = ReturnType<typeof renderWithProviders>['user'];

const chooseProject = async (user: User, name = 'Blog') => {
  const select = screen.getByRole('combobox', { name: 'Name' });
  await expect.poll(() => select).toBeEnabled();
  await user.click(select);
  await user.click(within(document.body).getByRole('option', { name }));
};

const chooseRole = async (user: User, name: string) => {
  const roles = screen.getByRole('combobox', { name: 'Roles' });
  await expect.poll(() => roles).toBeEnabled();
  await user.click(roles);
  await user.click(
    within(screen.getByRole('listbox', { name: 'Roles' })).getByRole('option', { name }),
  );
  // closes only the list, not the modal
  await user.keyboard('{Escape}');
};

// an empty Start Date opens on the project start month: January 2024 for Blog
const pickDay = async (user: User, field: string, day: RegExp) => {
  await user.click(screen.getByRole('button', { name: field }));
  await user.click(await screen.findByRole('gridcell', { name: day }));
};

const fillAddForm = async (user: User) => {
  await chooseProject(user);
  await pickDay(user, 'Start Date', /January 10th, 2024/);
  await chooseRole(user, 'Developer');
  await user.type(screen.getByLabelText('Responsibilities'), 'Code review');
};

describe('CvProjectFormModal', () => {
  beforeEach(() => {
    // only Date: user-event and Apollo still need the real timers
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date(2024, 2, 15));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('add', () => {
    it('keeps Add and the dates disabled until a project is chosen', async () => {
      renderWithProviders(<CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />, {
        mocks: [availableMock(), rolesMock],
      });

      expect(screen.getByRole('dialog', { name: 'Add project' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Start Date' })).toBeDisabled();
      expect(screen.getByRole('button', { name: 'End Date' })).toBeDisabled();
    });

    it('fills Domain, Description and Environment from the chosen catalog project', async () => {
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />,
        { mocks: [availableMock(), rolesMock] },
      );

      await chooseProject(user);

      expect(screen.getByLabelText('Domain')).toHaveValue('Blogging');
      expect(screen.getByLabelText('Description')).toHaveValue('A blogging website');
      expect(screen.getByText('React')).toBeInTheDocument();
      expect(screen.getByText('Node.js')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Start Date' })).toBeEnabled();
    });

    it('opens the Start Date on the project start month, days before it disabled', async () => {
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />,
        { mocks: [availableMock(), rolesMock] },
      );

      await chooseProject(user);
      await user.click(screen.getByRole('button', { name: 'Start Date' }));

      // today is March 2024, the project starts in January 2024
      expect(
        await screen.findByRole('rowgroup', { name: 'Month January, 2024' }),
      ).toBeInTheDocument();
      // the last day of December shown in the first week is before the project starts
      expect(screen.getByRole('gridcell', { name: /December 31st, 2023/ })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('opens the End Date of a finished project on its end month, days after it disabled', async () => {
      // the project ended 2024-12-31: today's month is fully disabled
      vi.setSystemTime(new Date(2025, 4, 15));
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />,
        { mocks: [availableMock(), rolesMock] },
      );

      await chooseProject(user);
      await user.click(screen.getByRole('button', { name: 'End Date' }));

      expect(
        await screen.findByRole('rowgroup', { name: 'Month December, 2024' }),
      ).toBeInTheDocument();
      expect(screen.getByRole('gridcell', { name: /January 1st, 2025/ })).toHaveAttribute(
        'aria-disabled',
        'true',
      );
    });

    it('does not show "Start date is required" right after a project is chosen', async () => {
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />,
        { mocks: [availableMock(), rolesMock] },
      );

      await chooseProject(user);

      expect(screen.getByRole('button', { name: 'Start Date' })).toBeEnabled();
      expect(screen.queryByText('Start date is required')).not.toBeInTheDocument();
    });

    it('shows "Start date is required" once the Start Date is touched', async () => {
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />,
        { mocks: [availableMock(), rolesMock] },
      );

      await chooseProject(user);
      // opened and closed without picking a day
      await user.click(screen.getByRole('button', { name: 'Start Date' }));
      await screen.findByRole('rowgroup', { name: 'Month January, 2024' });
      await user.keyboard('{Escape}');

      expect(await screen.findByText('Start date is required')).toBeInTheDocument();
    });

    it('checks a picked date again when another project is chosen', async () => {
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />,
        { mocks: [availableMock([blog, archive]), rolesMock] },
      );

      await chooseProject(user);
      await pickDay(user, 'Start Date', /January 10th, 2024/);
      // Archive ended in 2021, so January 2024 is outside it
      await chooseProject(user, 'Archive');

      expect(
        await screen.findByText('Start date must be within project duration'),
      ).toBeInTheDocument();
      // the End Date is still empty: nothing to check there
      expect(screen.queryByText(/End date/)).not.toBeInTheDocument();
    });

    it('requires at least one role', async () => {
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={vi.fn()} cvId={CV_ID} />,
        { mocks: [availableMock(), rolesMock] },
      );

      await chooseProject(user);
      await pickDay(user, 'Start Date', /January 10th, 2024/);
      await chooseRole(user, 'Developer');
      // remove the only role again
      await user.click(screen.getByRole('button', { name: 'Remove Developer' }));
      // the form shows errors once the field is touched; ⊗ keeps the focus in the field, so leave it
      await user.tab();

      expect(await screen.findByText('At least one role must be selected')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add' })).toBeDisabled();
    });

    it('adds the project: dates as YYYY-MM-DD, no end date means null, roles as ids', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={onOpenChange} cvId={CV_ID} />,
        {
          mocks: [
            availableMock(),
            rolesMock,
            {
              request: { query: CREATE_CV_PROJECT, variables: { input: createInput } },
              result: {
                data: {
                  createCvProject: {
                    ...cvProject,
                    startDate: '2024-01-10',
                    endDate: null,
                  },
                },
              },
            },
            listMock,
          ],
        },
      );

      await fillAddForm(user);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows "already added" (CONFLICT), keeps the modal open and the values', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <CvProjectFormModal open onOpenChange={onOpenChange} cvId={CV_ID} />,
        {
          mocks: [
            availableMock(),
            rolesMock,
            {
              request: { query: CREATE_CV_PROJECT, variables: { input: createInput } },
              result: {
                errors: [new GraphQLError('backend text', { extensions: { code: 'CONFLICT' } })],
              },
            },
            // useRefetchOnError: the options again, now without the project already in the CV
            availableMock([]),
          ],
        },
      );

      await fillAddForm(user);
      await user.click(screen.getByRole('button', { name: 'Add' }));

      const dialog = screen.getByRole('dialog', { name: 'Add project' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'Project is already added to the CV',
      );
      expect(onOpenChange).not.toHaveBeenCalledWith(false);
      expect(screen.getByLabelText('Responsibilities')).toHaveValue('Code review');
    });
  });

  describe('update', () => {
    const renderUpdate = (mocks: MockLink.MockedResponse[] = [rolesMock]) => {
      const onOpenChange = vi.fn();
      return {
        onOpenChange,
        ...renderWithProviders(
          <CvProjectFormModal
            open
            onOpenChange={onOpenChange}
            cvId={CV_ID}
            cvProject={cvProject}
          />,
          { mocks },
        ),
      };
    };

    it('prefills every field; the project cannot be changed and Update waits for a change', async () => {
      renderUpdate();

      expect(screen.getByRole('dialog', { name: 'Update project' })).toBeInTheDocument();
      expect(screen.getByRole('combobox', { name: 'Name' })).toBeDisabled();
      expect(screen.getByRole('combobox', { name: 'Name' })).toHaveTextContent('Blog');
      expect(screen.getByLabelText('Domain')).toHaveValue('Blogging');
      expect(screen.getByRole('button', { name: 'Start Date' })).toHaveTextContent('03/01/2024');
      expect(screen.getByRole('button', { name: 'End Date' })).toHaveTextContent('06/30/2024');
      expect(screen.getByLabelText('Responsibilities')).toHaveValue('Code review');
      // the role chip appears once the roles are loaded
      expect(await screen.findByText('Developer')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Update' })).toBeDisabled();
    });

    it('clears the end date with ✕ and saves it as null ("Present")', async () => {
      const { user, onOpenChange } = renderUpdate([
        rolesMock,
        {
          request: {
            query: UPDATE_CV_PROJECT,
            variables: {
              input: {
                id: 'cp1',
                cvId: CV_ID,
                startDate: '2024-03-01',
                endDate: null,
                roleIds: ['r1'],
                responsibilities: 'Code review',
              },
            },
          },
          result: { data: { updateCvProject: { ...cvProject, endDate: null } } },
        },
        listMock,
      ]);

      await screen.findByText('Developer');
      await user.click(screen.getByRole('button', { name: 'Clear date' }));

      expect(screen.getByRole('button', { name: 'End Date' })).not.toHaveTextContent('06/30/2024');
      expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled();

      await user.click(screen.getByRole('button', { name: 'Update' }));

      await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
    });

    it('offers ✕ only for the end date: the start date is required', async () => {
      renderUpdate();

      expect(screen.getAllByRole('button', { name: 'Clear date' })).toHaveLength(1);
    });

    it('does not load the available projects: the project is fixed', async () => {
      // no AVAILABLE_CV_PROJECTS mock: a request would fail the Name select with an error
      renderUpdate();

      await screen.findByText('Developer');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
