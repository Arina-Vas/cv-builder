import { screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CREATE_LANGUAGE, UPDATE_LANGUAGE } from '../api/languages.operations';
import { LanguageFormModal } from './LanguageFormModal';

const language = {
  __typename: 'Language' as const,
  id: '1',
  name: 'German',
  iso: 'DE',
  nativeName: 'Deutsch',
};

const created = { name: 'Portuguese', iso: 'PT-BR', nativeName: 'Português' };
const createRequest = { query: CREATE_LANGUAGE, variables: { input: created } };

async function fillCreateForm(user: ReturnType<typeof renderWithProviders>['user']) {
  await user.type(screen.getByLabelText('Name'), created.name);
  await user.type(screen.getByLabelText('ISO'), 'pt-br');
  await user.type(screen.getByLabelText('Native name'), created.nativeName);
  await user.click(screen.getByRole('button', { name: 'Create' }));
}

describe('LanguageFormModal', () => {
  it('creates a language with the ISO code in upper case and closes', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<LanguageFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        {
          request: createRequest,
          result: { data: { createLanguage: { ...language, ...created } } },
        },
      ],
    });

    expect(screen.getByRole('dialog', { name: 'Create language' })).toBeInTheDocument();

    await fillCreateForm(user);

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows a duplicate ISO code under the ISO field, not under Name', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<LanguageFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        {
          request: createRequest,
          result: {
            errors: [
              new GraphQLError('ISO code already exists', {
                extensions: { code: 'CONFLICT', field: 'iso' },
              }),
            ],
          },
        },
      ],
    });

    await fillCreateForm(user);

    const iso = screen.getByLabelText('ISO');
    await expect.poll(() => iso).toHaveAttribute('aria-invalid', 'true');
    expect(iso).toHaveAccessibleDescription('This value is already taken');
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
    expect(onOpenChange).not.toHaveBeenCalled();
  });

  it('edits the language: prefilled, saves only after a change', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <LanguageFormModal open onOpenChange={onOpenChange} language={language} />,
      {
        mocks: [
          {
            request: {
              query: UPDATE_LANGUAGE,
              variables: {
                input: { id: '1', name: 'German', iso: 'DE', nativeName: 'Deutsch (DE)' },
              },
            },
            result: { data: { updateLanguage: { ...language, nativeName: 'Deutsch (DE)' } } },
          },
        ],
      },
    );

    expect(screen.getByRole('dialog', { name: 'Edit language' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('German');
    expect(screen.getByLabelText('ISO')).toHaveValue('DE');
    expect(screen.getByLabelText('Native name')).toHaveValue('Deutsch');
    expect(screen.getByRole('button', { name: 'Save' })).toBeDisabled();

    await user.type(screen.getByLabelText('Native name'), ' (DE)');
    await user.click(screen.getByRole('button', { name: 'Save' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });
});
