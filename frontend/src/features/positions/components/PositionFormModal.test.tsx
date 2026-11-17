import { screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { CREATE_POSITION, UPDATE_POSITION } from '../api/positions.operations';
import { PositionFormModal } from './PositionFormModal';

const position = { __typename: 'Position' as const, id: '1', name: 'Software Engineer' };

describe('PositionFormModal', () => {
  it('creates a position and closes', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<PositionFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        {
          request: { query: CREATE_POSITION, variables: { input: { name: 'QA Engineer' } } },
          result: { data: { createPosition: { ...position, id: '2', name: 'QA Engineer' } } },
        },
      ],
    });

    expect(screen.getByRole('dialog', { name: 'Create position' })).toBeInTheDocument();

    await user.type(screen.getByLabelText('Position'), '  QA Engineer ');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the position validation message', async () => {
    const { user } = renderWithProviders(<PositionFormModal open onOpenChange={vi.fn()} />);

    await user.click(screen.getByLabelText('Position'));
    await user.tab();

    expect(screen.getByText('Position name is required')).toBeInTheDocument();
  });

  it('edits the position: prefilled, saves only after a change', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(
      <PositionFormModal open onOpenChange={onOpenChange} position={position} />,
      {
        mocks: [
          {
            request: {
              query: UPDATE_POSITION,
              variables: { input: { id: '1', name: 'Senior Engineer' } },
            },
            result: { data: { updatePosition: { ...position, name: 'Senior Engineer' } } },
          },
        ],
      },
    );

    const input = screen.getByLabelText('Position');
    expect(screen.getByRole('dialog', { name: 'Edit position' })).toBeInTheDocument();
    expect(input).toHaveValue('Software Engineer');
    expect(screen.getByRole('button', { name: 'Update' })).toBeEnabled();

    await user.clear(input);
    await user.type(input, 'Senior Engineer');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('shows the spec text for a duplicate name under the field and stays open', async () => {
    const onOpenChange = vi.fn();
    const { user } = renderWithProviders(<PositionFormModal open onOpenChange={onOpenChange} />, {
      mocks: [
        {
          request: { query: CREATE_POSITION, variables: { input: { name: 'QA Engineer' } } },
          result: {
            errors: [
              new GraphQLError('backend text', { extensions: { code: 'CONFLICT', field: 'name' } }),
            ],
          },
        },
      ],
    });

    await user.type(screen.getByLabelText('Position'), 'QA Engineer');
    await user.click(screen.getByRole('button', { name: 'Create' }));

    const name = screen.getByLabelText('Position');
    await expect.poll(() => name).toHaveAttribute('aria-invalid', 'true');
    expect(name).toHaveAccessibleDescription('Position already exists');
    expect(onOpenChange).not.toHaveBeenCalled();
  });
});
