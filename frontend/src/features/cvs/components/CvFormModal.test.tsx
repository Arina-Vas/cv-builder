import type { MockLink } from '@apollo/client/testing';
import { screen } from '@testing-library/react';
import { GraphQLError } from 'graphql';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { UPDATE_CV } from '../api/cvs.operations';
import { CvFormModal } from './CvFormModal';

// the CV of another user, as an Admin sees it on /cvs
const cv = {
  __typename: 'Cv' as const,
  id: 'c1',
  name: 'Frontend Developer',
  education: 'Applied Mathematics',
  description: 'React and TypeScript',
  user: { __typename: 'User' as const, id: 'owner', email: 'owner@example.com' },
};

const updateRequest = (name: string) => ({
  query: UPDATE_CV,
  variables: {
    input: {
      name,
      education: 'Applied Mathematics',
      description: 'React and TypeScript',
      id: 'c1',
      userId: 'owner',
    },
  },
});

const renderModal = (props: { cv?: typeof cv }, mocks: MockLink.MockedResponse[] = []) => {
  const onOpenChange = vi.fn();
  const view = renderWithProviders(
    <CvFormModal open onOpenChange={onOpenChange} userId="admin" {...props} />,
    { mocks },
  );
  return { ...view, onOpenChange };
};

describe('CvFormModal', () => {
  it('keeps Create disabled until Name, Education and Description are filled', async () => {
    const { user } = renderModal({});

    expect(screen.getByRole('dialog', { name: 'Create CV' })).toBeInTheDocument();
    const create = screen.getByRole('button', { name: 'Create' });
    expect(create).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), 'QA Engineer');
    await user.type(screen.getByLabelText('Education'), 'Radio Engineering');
    expect(create).toBeDisabled();

    await user.type(screen.getByLabelText('Description'), 'Writes tests');
    await expect.poll(() => create).toBeEnabled();
  });

  it('shows the spec messages for an empty and a too long name', async () => {
    const { user } = renderModal({});

    const name = screen.getByLabelText('Name');
    await user.click(name);
    await user.tab();
    expect(await screen.findByText('Name is required')).toBeInTheDocument();

    await user.click(name);
    await user.paste('a'.repeat(256));
    expect(await screen.findByText('Name must not exceed 255 characters')).toBeInTheDocument();
  });

  it('prefills Update CV and keeps Update disabled until something changes', async () => {
    const { user } = renderModal({ cv });

    expect(screen.getByRole('dialog', { name: 'Update CV' })).toBeInTheDocument();
    expect(screen.getByLabelText('Name')).toHaveValue('Frontend Developer');
    expect(screen.getByLabelText('Education')).toHaveValue('Applied Mathematics');
    expect(screen.getByLabelText('Description')).toHaveValue('React and TypeScript');

    const update = screen.getByRole('button', { name: 'Update' });
    expect(update).toBeDisabled();

    await user.type(screen.getByLabelText('Name'), ' v2');
    await expect.poll(() => update).toBeEnabled();
  });

  // userId is the CV owner from the row, not the userId prop (the admin on /cvs)
  it("updates the CV with its owner's userId and closes", async () => {
    const { user, onOpenChange } = renderModal({ cv }, [
      {
        request: updateRequest('Frontend Developer v2'),
        result: { data: { updateCv: { ...cv, name: 'Frontend Developer v2' } } },
      },
    ]);

    await user.type(screen.getByLabelText('Name'), ' v2');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    await expect.poll(() => onOpenChange).toHaveBeenCalledWith(false);
  });

  it('keeps the entered values and shows the error when the update fails', async () => {
    const { user, onOpenChange } = renderModal({ cv }, [
      {
        request: updateRequest('Frontend Developer v2'),
        result: {
          errors: [new GraphQLError('backend text', { extensions: { code: 'FORBIDDEN' } })],
        },
      },
    ]);

    await user.type(screen.getByLabelText('Name'), ' v2');
    await user.click(screen.getByRole('button', { name: 'Update' }));

    expect(await screen.findByRole('alert')).toHaveTextContent(
      "You don't have permission to do this",
    );
    expect(screen.getByLabelText('Name')).toHaveValue('Frontend Developer v2');
    expect(onOpenChange).not.toHaveBeenCalledWith(false);
  });
});
