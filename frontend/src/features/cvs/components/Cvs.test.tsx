import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { notFound } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { mockRouter } from '@/test/next-navigation';
import { meMock } from '@/test/me-mock';
import { CatchErrors } from '@/test/catch-errors';
import { CREATE_CV, CVS, DELETE_CV, USER_CVS } from '../api/cvs.operations';
import { Cvs } from './Cvs';

const ME_ID = 'me';

const owner = (id: string, email: string) => ({ __typename: 'User' as const, id, email });

const makeCv = (id: string, name: string, user = owner(ME_ID, 'me@example.test')) => ({
  __typename: 'Cv' as const,
  id,
  name,
  education: `${name} education`,
  description: `${name} description`,
  user,
});

const frontend = makeCv('c1', 'Frontend Developer');
const backend = makeCv('c2', 'Backend Developer', owner('u2', 'john@example.com'));

const variables = { search: '', sortBy: 'name', sortOrder: 'ASC', page: 1, pageSize: 10 };

const page = (items: ReturnType<typeof makeCv>[]) => ({
  __typename: 'CvPage' as const,
  items,
  page: 1,
  pageSize: 10,
  total: items.length,
});

const cvsMock = (items = [frontend, backend]): MockLink.MockedResponse => ({
  request: { query: CVS, variables },
  result: { data: { cvs: page(items) } },
});

const userCvsMock = (userId: string, items: ReturnType<typeof makeCv>[]) => ({
  request: { query: USER_CVS, variables: { ...variables, userId } },
  result: { data: { userCvs: page(items) } },
});

const gqlError = (code: string) => new GraphQLError('backend text', { extensions: { code } });

const renderCvs = (mocks: MockLink.MockedResponse[], userId?: string) =>
  renderWithProviders(
    <CatchErrors>
      <Cvs userId={userId} />
    </CatchErrors>,
    { mocks },
  );

async function openRowAction(
  user: ReturnType<typeof renderCvs>['user'],
  row: string,
  action: string,
) {
  await user.click(await screen.findByRole('button', { name: `Actions for ${row}` }));
  await user.click(screen.getByRole('menuitem', { name: action }));
}

describe('Cvs', () => {
  describe('CVs page', () => {
    it('shows Name, Education and the owner email, with the description under the row', async () => {
      renderCvs([meMock({ id: ME_ID }), cvsMock()]);

      expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer education')).toBeInTheDocument();
      expect(screen.getByText('Frontend Developer description')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
      expect(screen.getByRole('columnheader', { name: /Employee/ })).toBeInTheDocument();
    });

    it('sorts by Name only', async () => {
      renderCvs([meMock({ id: ME_ID }), cvsMock()]);

      await screen.findByText('Frontend Developer');

      expect(
        within(screen.getByRole('columnheader', { name: /Name/ })).getByRole('button'),
      ).toBeInTheDocument();
      expect(
        within(screen.getByRole('columnheader', { name: /Education/ })).queryByRole('button'),
      ).not.toBeInTheDocument();
    });

    it('tells an employee without CVs that they have none yet', async () => {
      renderCvs([meMock({ id: ME_ID, role: 'EMPLOYEE' }), cvsMock([])]);

      expect(await screen.findByText('You have no CVs yet')).toBeInTheDocument();
    });

    it('shows "No CVs found" to an admin', async () => {
      renderCvs([meMock({ id: ME_ID, role: 'ADMIN' }), cvsMock([])]);

      expect(await screen.findByText('No CVs found')).toBeInTheDocument();
    });

    it('shows the error with Retry that repeats the request', async () => {
      const { user } = renderCvs([
        meMock({ id: ME_ID }),
        { request: { query: CVS, variables }, error: new Error('Network down') },
        cvsMock(),
      ]);

      await user.click(await screen.findByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('Frontend Developer')).toBeInTheDocument();
    });

    it('opens CV Details from View', async () => {
      const { user } = renderCvs([meMock({ id: ME_ID }), cvsMock()]);

      await openRowAction(user, 'Frontend Developer', 'View');

      expect(mockRouter.push).toHaveBeenCalledWith('/cvs/c1/details');
    });

    it('opens Update CV with the row values from Edit', async () => {
      const { user } = renderCvs([meMock({ id: ME_ID }), cvsMock()]);

      await openRowAction(user, 'Backend Developer', 'Edit');

      const dialog = screen.getByRole('dialog', { name: 'Update CV' });
      expect(within(dialog).getByLabelText('Name')).toHaveValue('Backend Developer');
      expect(within(dialog).getByLabelText('Education')).toHaveValue('Backend Developer education');
    });

    it('creates the CV for the current user', async () => {
      const created = makeCv('c3', 'QA Engineer');
      const { user } = renderCvs([
        meMock({ id: ME_ID }),
        cvsMock(),
        {
          request: {
            query: CREATE_CV,
            variables: {
              input: {
                userId: ME_ID,
                name: 'QA Engineer',
                education: 'QA Engineer education',
                description: 'QA Engineer description',
              },
            },
          },
          result: { data: { createCv: created } },
        },
        // refetchQueries: the list with the new CV
        cvsMock([backend, frontend, created]),
      ]);

      await user.click(await screen.findByRole('button', { name: 'Create CV' }));
      const dialog = screen.getByRole('dialog', { name: 'Create CV' });
      await user.type(within(dialog).getByLabelText('Name'), 'QA Engineer');
      await user.type(within(dialog).getByLabelText('Education'), 'QA Engineer education');
      await user.type(within(dialog).getByLabelText('Description'), 'QA Engineer description');
      await user.click(within(dialog).getByRole('button', { name: 'Create' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByText('QA Engineer')).toBeInTheDocument();
    });

    it('asks to confirm with the CV name in bold', async () => {
      const { user } = renderCvs([meMock({ id: ME_ID }), cvsMock()]);

      await openRowAction(user, 'Frontend Developer', 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Delete CV' });
      expect(dialog).toHaveTextContent('Are you sure you want to delete CV Frontend Developer?');
      expect(within(dialog).getByText('Frontend Developer').tagName).toBe('STRONG');
    });

    // an Admin on /cvs deletes someone else's CV: userId must be the owner, not the admin
    it("deletes another user's CV with the owner's userId and refreshes the list", async () => {
      const { user } = renderCvs([
        meMock({ id: ME_ID, role: 'ADMIN' }),
        cvsMock(),
        {
          request: { query: DELETE_CV, variables: { id: 'c2', userId: 'u2' } },
          result: { data: { deleteCv: 'c2' } },
        },
        cvsMock([frontend]),
      ]);

      await openRowAction(user, 'Backend Developer', 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('Backend Developer')).not.toBeInTheDocument();
    });

    it('removes the row when the CV to delete is already gone (NOT_FOUND)', async () => {
      const { user } = renderCvs([
        meMock({ id: ME_ID }),
        cvsMock(),
        {
          request: { query: DELETE_CV, variables: { id: 'c2', userId: 'u2' } },
          result: { errors: [gqlError('NOT_FOUND')] },
        },
        // useRefetchOnError: the list without the missing CV
        cvsMock([frontend]),
      ]);

      await openRowAction(user, 'Backend Developer', 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      const dialog = screen.getByRole('dialog', { name: 'Delete CV' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        'This item no longer exists',
      );
      await waitFor(() => expect(screen.queryByText('john@example.com')).not.toBeInTheDocument());
    });
  });

  describe('User CVs tab', () => {
    const employee = owner('u2', 'john@example.com');
    const johnCv = makeCv('c2', 'Backend Developer', employee);

    it('loads only the CVs of the selected user', async () => {
      renderCvs([meMock({ id: ME_ID }), userCvsMock('u2', [johnCv])], 'u2');

      expect(await screen.findByText('Backend Developer')).toBeInTheDocument();
      expect(screen.getByText('john@example.com')).toBeInTheDocument();
    });

    it('creates the CV for the selected user, not for the admin', async () => {
      const created = makeCv('c3', 'QA Engineer', employee);
      const { user } = renderCvs(
        [
          meMock({ id: ME_ID }),
          userCvsMock('u2', [johnCv]),
          {
            request: {
              query: CREATE_CV,
              variables: {
                input: { userId: 'u2', name: 'QA Engineer', education: 'QA', description: 'QA' },
              },
            },
            result: { data: { createCv: created } },
          },
          userCvsMock('u2', [johnCv, created]),
        ],
        'u2',
      );

      await user.click(await screen.findByRole('button', { name: 'Create CV' }));
      const dialog = screen.getByRole('dialog', { name: 'Create CV' });
      await user.type(within(dialog).getByLabelText('Name'), 'QA Engineer');
      await user.type(within(dialog).getByLabelText('Education'), 'QA');
      await user.type(within(dialog).getByLabelText('Description'), 'QA');
      await user.click(within(dialog).getByRole('button', { name: 'Create' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.getByText('QA Engineer')).toBeInTheDocument();
    });

    it('opens the 404 page when the user does not exist', async () => {
      // React logs the error caught by the boundary; keep the test output clean
      vi.spyOn(console, 'error').mockImplementation(() => {});

      renderCvs(
        [
          meMock({ id: ME_ID }),
          {
            request: { query: USER_CVS, variables: { ...variables, userId: 'missing' } },
            result: { errors: [gqlError('NOT_FOUND')] },
          },
        ],
        'missing',
      );

      await vi.waitFor(() => expect(notFound).toHaveBeenCalled());
    });
  });
});
