import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { DELETE_USER_LANGUAGES, USER_LANGUAGES } from '../api/userLanguages.operations';
import { UserLanguages } from './UserLanguages';

const USER_ID = 'u1';
const EMPTY = 'No languages added yet';

const userLanguage = (id: string, name: string, proficiency: 'B2' | 'NATIVE' | 'A1') => ({
  __typename: 'UserLanguage' as const,
  id,
  language: { __typename: 'Language' as const, id: `l-${id}`, name },
  proficiency,
});

const english = userLanguage('ul1', 'English', 'B2');
const russian = userLanguage('ul2', 'Russian', 'NATIVE');
const german = userLanguage('ul3', 'German', 'A1');

const listMock = (items = [english, russian, german]): MockLink.MockedResponse => ({
  request: { query: USER_LANGUAGES, variables: { userId: USER_ID } },
  result: { data: { userLanguages: items } },
});

const renderList = ({
  canEdit = true,
  mocks = [listMock()],
}: { canEdit?: boolean; mocks?: MockLink.MockedResponse[] } = {}) =>
  renderWithProviders(<UserLanguages userId={USER_ID} canEdit={canEdit} emptyMessage={EMPTY} />, {
    mocks,
  });

describe('UserLanguages', () => {
  describe('states', () => {
    it('shows placeholders while loading, then the languages with their levels', async () => {
      renderList();

      expect(screen.getByRole('list', { name: 'Loading languages' })).toHaveAttribute(
        'aria-busy',
        'true',
      );

      expect(await screen.findByText('English')).toBeInTheDocument();
      // the bar is named by the language and says its proficiency
      expect(screen.getByRole('meter', { name: 'Russian' })).toHaveAttribute(
        'aria-valuetext',
        'Native',
      );
    });

    it('shows the empty message, and Add is still there', async () => {
      renderList({ mocks: [listMock([])] });

      expect(await screen.findByText(EMPTY)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: 'Add language' })).toBeEnabled();
      expect(screen.getByRole('button', { name: 'Remove languages' })).toBeDisabled();
    });

    it('shows a load error with Retry, and Retry loads the list', async () => {
      const { user } = renderList({
        mocks: [
          {
            request: { query: USER_LANGUAGES, variables: { userId: USER_ID } },
            error: new Error('down'),
          },
          listMock(),
        ],
      });

      expect(await screen.findByRole('alert')).toHaveTextContent('Failed to load languages');

      await user.click(screen.getByRole('button', { name: 'Retry' }));

      expect(await screen.findByText('English')).toBeInTheDocument();
    });
  });

  describe('read-only (another user, not Admin)', () => {
    it('has no actions and the languages are not clickable', async () => {
      renderList({ canEdit: false });

      await screen.findByText('English');
      expect(screen.queryByRole('button')).not.toBeInTheDocument();
    });
  });

  describe('owner or Admin', () => {
    it('opens Add language', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: 'Add language' }));

      expect(screen.getByRole('dialog', { name: 'Add language' })).toBeInTheDocument();
    });

    it('opens Update language for the clicked language', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: /English/ }));

      const dialog = screen.getByRole('dialog', { name: 'Update language' });
      expect(within(dialog).getByRole('combobox', { name: 'Language' })).toHaveTextContent(
        'English',
      );
    });
  });

  describe('remove', () => {
    it('selects languages instead of opening Update, and counts them', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: 'Remove languages' }));
      const remove = screen.getByRole('button', { name: 'Remove (0)' });
      expect(remove).toBeDisabled();

      const english = screen.getByRole('button', { name: /English/ });
      await user.click(english);
      await user.click(screen.getByRole('button', { name: /Russian/ }));

      expect(english).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /German/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(screen.getByRole('button', { name: 'Remove (2)' })).toBeEnabled();
      expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    });

    it('Cancel leaves selection mode without removing anything', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: 'Remove languages' }));
      await user.click(screen.getByRole('button', { name: /English/ }));
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(screen.getByRole('button', { name: 'Remove languages' })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /English/ })).not.toHaveAttribute('aria-pressed');
    });

    it('removes the selected assignments after confirmation and refreshes the list', async () => {
      const { user } = renderList({
        mocks: [
          listMock(),
          {
            // the UserLanguage ids, not the language ids
            request: {
              query: DELETE_USER_LANGUAGES,
              variables: { ids: ['ul1', 'ul2'], userId: USER_ID },
            },
            result: { data: { deleteUserLanguages: ['ul1', 'ul2'] } },
          },
          // refetchQueries: the list without the removed languages
          listMock([german]),
        ],
      });

      await user.click(await screen.findByRole('button', { name: 'Remove languages' }));
      await user.click(screen.getByRole('button', { name: /English/ }));
      await user.click(screen.getByRole('button', { name: /Russian/ }));
      await user.click(screen.getByRole('button', { name: 'Remove (2)' }));

      const dialog = screen.getByRole('dialog', { name: 'Remove languages' });
      expect(dialog).toHaveTextContent('Are you sure you want to remove 2 languages?');
      await user.click(within(dialog).getByRole('button', { name: 'Confirm' }));

      await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
      expect(screen.queryByText('English')).not.toBeInTheDocument();
      expect(screen.getByText('German')).toBeInTheDocument();
      // selection mode is over
      expect(screen.getByRole('button', { name: 'Remove languages' })).toBeInTheDocument();
    });
  });
});
