import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DELETE_LANGUAGE, LANGUAGES } from '../api/languages.operations';
import { Languages } from './Languages';

const languages = [
  { __typename: 'Language' as const, id: '1', name: 'German', iso: 'DE', nativeName: 'Deutsch' },
  { __typename: 'Language' as const, id: '2', name: 'Polish', iso: 'PL', nativeName: 'Polski' },
];

const listMock = (items = languages): MockLink.MockedResponse => ({
  request: {
    query: LANGUAGES,
    variables: { page: 1, pageSize: 10, search: '', sortBy: 'name', sortOrder: 'ASC' },
  },
  result: {
    data: {
      languages: {
        __typename: 'LanguagePage',
        items,
        page: 1,
        pageSize: 10,
        total: items.length,
      },
    },
  },
});

const deleteRequest = { query: DELETE_LANGUAGE, variables: { id: '1' } };

const renderPage = (mocks: MockLink.MockedResponse[] = [listMock()]) =>
  renderWithProviders(<Languages />, { mocks });

async function openRowAction(user: ReturnType<typeof renderPage>['user'], name: string) {
  await user.click(await screen.findByRole('button', { name: 'Actions for German' }));
  await user.click(screen.getByRole('menuitem', { name }));
}

describe('Languages', () => {
  it('shows name, ISO and native name of each language', async () => {
    renderPage();

    const row = (await screen.findByText('German')).closest('tr')!;
    expect(within(row).getByText('DE')).toBeInTheDocument();
    expect(within(row).getByText('Deutsch')).toBeInTheDocument();
    expect(screen.getByText('Polish')).toBeInTheDocument();
  });

  it('sorts by name and ISO, not by native name', async () => {
    renderPage();
    await screen.findByText('German');

    expect(screen.getByRole('button', { name: 'Name' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'ISO' })).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Native name' })).not.toBeInTheDocument();
  });

  it('opens the create modal', async () => {
    const { user } = renderPage();

    await user.click(screen.getByRole('button', { name: 'Create language' }));

    const dialog = screen.getByRole('dialog', { name: 'Create language' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('');
  });

  it('opens the edit modal with the row data', async () => {
    const { user } = renderPage();

    await openRowAction(user, 'Edit');

    const dialog = screen.getByRole('dialog', { name: 'Edit language' });
    expect(within(dialog).getByLabelText('Name')).toHaveValue('German');
    expect(within(dialog).getByLabelText('ISO')).toHaveValue('DE');
    expect(within(dialog).getByLabelText('Native name')).toHaveValue('Deutsch');
  });

  describe('delete', () => {
    it('asks to confirm with the language name in bold', async () => {
      const { user } = renderPage();

      await openRowAction(user, 'Delete');

      const dialog = screen.getByRole('dialog', { name: 'Delete language' });
      expect(dialog).toHaveTextContent('Are you sure you want to delete language German?');
      expect(within(dialog).getByText('German').tagName).toBe('STRONG');
    });

    it('deletes the language, closes the dialog and refreshes the list', async () => {
      const { user } = renderPage([
        listMock(),
        { request: deleteRequest, result: { data: { deleteLanguage: '1' } } },
        // refetchQueries: the list without the deleted row
        listMock(languages.slice(1)),
      ]);

      await openRowAction(user, 'Delete');
      await user.click(screen.getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('German')).not.toBeInTheDocument();
      expect(screen.getByText('Polish')).toBeInTheDocument();
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

      const dialog = screen.getByRole('dialog', { name: 'Delete language' });
      expect(await within(dialog).findByRole('alert')).toHaveTextContent(
        "This item is in use and can't be deleted",
      );
      expect(screen.getByText('Polish')).toBeInTheDocument();
    });
  });
});
