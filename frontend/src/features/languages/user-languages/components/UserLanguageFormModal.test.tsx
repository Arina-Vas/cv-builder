import type { MockLink } from '@apollo/client/testing';
import { screen, within } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import {
  AVAILABLE_USER_LANGUAGES,
  CREATE_USER_LANGUAGE,
  UPDATE_USER_LANGUAGE,
} from '../api/userLanguages.operations';
import { UserLanguageFormModal } from './UserLanguageFormModal';

const USER_ID = 'u1';

const english = { __typename: 'Language' as const, id: 'l1', name: 'English' };
const german = { __typename: 'Language' as const, id: 'l2', name: 'German' };

const userLanguage = {
  __typename: 'UserLanguage' as const,
  id: 'ul1',
  language: english,
  proficiency: 'B2' as const,
};

// languages the user does not have yet
const availableMock: MockLink.MockedResponse = {
  request: { query: AVAILABLE_USER_LANGUAGES, variables: { userId: USER_ID } },
  result: { data: { availableUserLanguages: [german] } },
};

const createRequest = {
  query: CREATE_USER_LANGUAGE,
  variables: { input: { userId: USER_ID, languageId: 'l2', proficiency: 'NATIVE' } },
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

describe('UserLanguageFormModal', () => {
  describe('add', () => {
    it('offers only the languages the user does not have, and every proficiency', async () => {
      const { user } = renderWithProviders(
        <UserLanguageFormModal open onOpenChange={vi.fn()} userId={USER_ID} />,
        { mocks: [availableMock] },
      );

      expect(screen.getByRole('dialog', { name: 'Add language' })).toBeInTheDocument();

      await user.click(screen.getByRole('combobox', { name: 'Language' }));
      await expect
        .poll(() =>
          within(document.body)
            .queryAllByRole('option')
            .map((o) => o.textContent),
        )
        .toEqual(['German']);
      await user.keyboard('{Escape}');

      await user.click(screen.getByRole('combobox', { name: 'Proficiency' }));
      expect(
        within(document.body)
          .getAllByRole('option')
          .map((o) => o.textContent),
      ).toEqual(['A1', 'A2', 'B1', 'B2', 'C1', 'C2', 'Native']);
    });

    it('adds the language for this user and closes', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <UserLanguageFormModal open onOpenChange={onOpenChange} userId={USER_ID} />,
        {
          mocks: [
            availableMock,
            {
              request: createRequest,
              result: {
                data: {
                  createUserLanguage: {
                    ...userLanguage,
                    id: 'ul2',
                    language: german,
                    proficiency: 'NATIVE',
                  },
                },
              },
            },
            // refetchQueries: the available list is open in the modal, so it is reloaded too
            { ...availableMock, result: { data: { availableUserLanguages: [] } } },
          ],
        },
      );

      const add = screen.getByRole('button', { name: 'Add' });
      expect(add).toBeDisabled();

      await choose(user, 'Language', 'German');
      await choose(user, 'Proficiency', 'Native');
      await user.click(add);

      await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
    });

    it('shows an already added language (CONFLICT) under Language', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <UserLanguageFormModal open onOpenChange={onOpenChange} userId={USER_ID} />,
        {
          mocks: [
            availableMock,
            {
              request: createRequest,
              result: {
                errors: [
                  new GraphQLError('Language is already assigned', {
                    extensions: { code: 'CONFLICT', field: 'languageId' },
                  }),
                ],
              },
            },
          ],
        },
      );

      await choose(user, 'Language', 'German');
      await choose(user, 'Proficiency', 'Native');
      await user.click(screen.getByRole('button', { name: 'Add' }));

      const language = screen.getByRole('combobox', { name: 'Language' });
      await expect.poll(() => language).toHaveAccessibleDescription('This value is already taken');
      expect(onOpenChange).not.toHaveBeenCalled();
    });
  });

  describe('update', () => {
    it('keeps the language fixed and sends only the new proficiency', async () => {
      const onOpenChange = vi.fn();
      const { user } = renderWithProviders(
        <UserLanguageFormModal
          open
          onOpenChange={onOpenChange}
          userId={USER_ID}
          userLanguage={userLanguage}
        />,
        {
          mocks: [
            {
              request: {
                query: UPDATE_USER_LANGUAGE,
                variables: { input: { id: 'ul1', userId: USER_ID, proficiency: 'C1' } },
              },
              result: { data: { updateUserLanguage: { ...userLanguage, proficiency: 'C1' } } },
            },
          ],
        },
      );

      expect(screen.getByRole('dialog', { name: 'Update language' })).toBeInTheDocument();
      const language = screen.getByRole('combobox', { name: 'Language' });
      expect(language).toBeDisabled();
      expect(language).toHaveTextContent('English');
      expect(screen.getByRole('combobox', { name: 'Proficiency' })).toHaveTextContent('B2');
      expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

      await choose(user, 'Proficiency', 'C1');
      await user.click(screen.getByRole('button', { name: 'Save' }));

      await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
    });
  });
});
