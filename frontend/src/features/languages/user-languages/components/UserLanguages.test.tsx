import type { MockLink } from '@apollo/client/testing';
import { screen, waitFor, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { notFound } from 'next/navigation';
import { describe, expect, it, vi } from 'vitest';
import { closedGate } from '@/test/action-gate';
import { CatchErrors } from '@/test/catch-errors';
import { renderWithProviders } from '@/test/render';
import {
  DELETE_USER_LANGUAGES,
  UPDATE_USER_LANGUAGE,
  USER_LANGUAGES,
} from '../api/userLanguages.operations';
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
  renderWithProviders(
    <CatchErrors>
      <UserLanguages userId={USER_ID} canEdit={canEdit} emptyMessage={EMPTY} />
    </CatchErrors>,
    { mocks },
  );

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

    it('opens the 404 page instead of Retry when the user does not exist', async () => {
      // React logs the error caught by the boundary; keep the test output clean
      vi.spyOn(console, 'error').mockImplementation(() => {});

      renderList({
        mocks: [
          {
            request: { query: USER_LANGUAGES, variables: { userId: USER_ID } },
            result: {
              errors: [new GraphQLError('User not found', { extensions: { code: 'NOT_FOUND' } })],
            },
          },
        ],
      });

      await vi.waitFor(() => expect(notFound).toHaveBeenCalled());
      expect(screen.queryByRole('button', { name: 'Retry' })).not.toBeInTheDocument();
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

  describe('update', () => {
    it('reloads the list when the language was already removed (NOT_FOUND) and keeps the error', async () => {
      const { user } = renderList({
        mocks: [
          listMock(),
          {
            request: {
              query: UPDATE_USER_LANGUAGE,
              variables: { input: { id: 'ul1', userId: USER_ID, proficiency: 'C1' } },
            },
            result: {
              errors: [new GraphQLError('Not found', { extensions: { code: 'NOT_FOUND' } })],
            },
          },
          // useRefetchOnError: English is gone
          listMock([russian, german]),
        ],
      });

      await user.click(await screen.findByRole('button', { name: /English/ }));
      const dialog = screen.getByRole('dialog', { name: 'Update language' });
      await user.click(within(dialog).getByRole('combobox', { name: 'Proficiency' }));
      await user.click(within(document.body).getByRole('option', { name: 'C1' }));
      await user.click(within(dialog).getByRole('button', { name: 'Update' }));

      // the list row (its meter) is gone; the open dialog hides the page from the a11y tree
      await waitFor(() =>
        expect(screen.queryByRole('meter', { name: 'English', hidden: true })).toBeNull(),
      );
      expect(screen.getByRole('meter', { name: 'Russian', hidden: true })).toBeInTheDocument();
      expect(within(dialog).getByRole('alert')).toHaveTextContent('This item no longer exists');
    });
  });

  describe('remove', () => {
    it('selects languages instead of opening Update, and counts them', async () => {
      const { user } = renderList();

      await user.click(await screen.findByRole('button', { name: 'Remove languages' }));
      const remove = screen.getByRole('button', { name: 'Remove 0' });
      expect(remove).toBeDisabled();

      const english = screen.getByRole('button', { name: /English/ });
      await user.click(english);
      await user.click(screen.getByRole('button', { name: /Russian/ }));

      expect(english).toHaveAttribute('aria-pressed', 'true');
      expect(screen.getByRole('button', { name: /German/ })).toHaveAttribute(
        'aria-pressed',
        'false',
      );
      expect(screen.getByRole('button', { name: 'Remove 2' })).toBeEnabled();
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
      await user.click(screen.getByRole('button', { name: 'Remove 2' }));

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

  describe('with a closed action gate (unverified email)', () => {
    it('locks Add, Remove and opening Update; the clicks are stopped', async () => {
      const { blocked, Wrapper } = closedGate();
      const { user } = renderWithProviders(
        <Wrapper>
          <UserLanguages userId={USER_ID} canEdit emptyMessage={EMPTY} />
        </Wrapper>,
        { mocks: [listMock()] },
      );

      const add = await screen.findByRole('button', { name: 'Add language' });
      const remove = screen.getByRole('button', { name: 'Remove languages' });
      const english = screen.getByRole('button', { name: /English/ });

      for (const button of [add, remove, english]) {
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
          <UserLanguages userId={USER_ID} canEdit emptyMessage={EMPTY} />
        </Wrapper>,
        {
          mocks: [
            {
              request: { query: USER_LANGUAGES, variables: { userId: USER_ID } },
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
