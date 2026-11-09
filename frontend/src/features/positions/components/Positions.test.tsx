import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DELETE_POSITION, POSITIONS } from '../api/positions.operations';
import { Positions } from './Positions';

const positions = [
  { __typename: 'Position' as const, id: '1', name: 'Software Engineer' },
  { __typename: 'Position' as const, id: '2', name: 'QA Engineer' },
];

const listMock = (items = positions): MockLink.MockedResponse => ({
  request: {
    query: POSITIONS,
    variables: { page: 1, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' },
  },
  result: {
    data: {
      positions: {
        __typename: 'PositionPage',
        items,
        page: 1,
        pageSize: 10,
        total: items.length,
      },
    },
  },
});

const deleteRequest = { query: DELETE_POSITION, variables: { id: '1' } };

const renderPage = (mocks: MockLink.MockedResponse[] = [listMock()]) =>
  renderWithProviders(<Positions />, { mocks });

async function openRowAction(user: ReturnType<typeof renderPage>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: 'Actions for Software Engineer' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

describe('Positions', () => {
  it('shows the positions from the API', async () => {
    renderPage();

    expect(await screen.findByText('Software Engineer')).toBeInTheDocument();
    expect(screen.getByText('QA Engineer')).toBeInTheDocument();
  });

  it('opens the create modal', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Create position' }));

    const dialog = screen.getByRole('dialog', { name: 'Create position' });
    expect(within(dialog).getByLabelText('Position')).toHaveValue('');
  });

  it('opens the edit modal with the row data', async () => {
    const { user } = renderPage();

    await openRowAction(user, 'Edit');

    const dialog = screen.getByRole('dialog', { name: 'Edit position' });
    expect(within(dialog).getByLabelText('Position')).toHaveValue('Software Engineer');
  });

  describe('delete', () => {
    it('asks to confirm with the position name in bold', async () => {
      const { user } = renderPage();

      await openRowAction(user, 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Delete position' });
      expect(dialog).toHaveTextContent(
        'Are you sure you want to delete position Software Engineer?',
      );
      expect(within(dialog).getByText('Software Engineer').tagName).toBe('STRONG');
    });

    it('deletes the position, closes the dialog and refreshes the list', async () => {
      const { user } = renderPage([
        listMock(),
        { request: deleteRequest, result: { data: { deletePosition: '1' } } },
        // refetchQueries: the list without the deleted row
        listMock(positions.slice(1)),
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('Software Engineer')).not.toBeInTheDocument();
      expect(screen.getByText('QA Engineer')).toBeInTheDocument();
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

      const dialog = screen.getByRole('dialog', { name: 'Delete position' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "This item is in use and can't be deleted",
      );
      expect(screen.getByText('QA Engineer')).toBeInTheDocument();
    });
  });
});
