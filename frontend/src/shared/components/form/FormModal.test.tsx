import { CombinedGraphQLErrors } from '@apollo/client/errors';
import { screen, waitFor } from '@testing-library/react';
import { useState, type ComponentProps } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { Input } from '@/shared/components/inputs';
import { requiredString, useAppForm } from '@/shared/lib/form';
import { renderWithProviders } from '@/test/render';
import { FormModal } from './FormModal';

// Logic and states of FormModal; the stories (Shared/FormModal) cover what needs a real browser:
// layout widths, translated errors on blur, the full flows with every field.

const schema = z.object({ name: requiredString('Name is required') });

type Values = z.input<typeof schema>;
type Output = z.output<typeof schema>;
type ModalProps = Partial<Omit<ComponentProps<typeof FormModal<Values, Output>>, 'form' | 'open'>>;

function Harness({
  initialOpen = true,
  onOpenChange,
  ...props
}: ModalProps & { initialOpen?: boolean }) {
  const form = useAppForm({ schema, defaultValues: { name: '' } });
  const [open, setOpen] = useState(initialOpen);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)}>
        Open
      </button>
      <FormModal<Values, Output>
        form={form}
        open={open}
        title="Create department"
        values={{ name: '' }}
        onSubmit={() => Promise.resolve()}
        {...props}
        onOpenChange={(next) => {
          setOpen(next);
          onOpenChange?.(next);
        }}
      >
        <Input
          label="Department"
          {...form.register('name')}
          error={form.formState.errors.name?.message}
        />
      </FormModal>
    </>
  );
}

function renderModal(props: ModalProps & { initialOpen?: boolean } = {}) {
  const onOpenChange = vi.fn();
  const result = renderWithProviders(<Harness onOpenChange={onOpenChange} {...props} />);
  return { ...result, onOpenChange };
}

const getDialog = () => screen.queryByRole('dialog', { name: 'Create department' });
const getInput = () => screen.getByRole('textbox', { name: 'Department' });

const graphQLError = (code: string, extensions: Record<string, unknown> = {}) =>
  new CombinedGraphQLErrors({
    errors: [{ message: 'backend text', extensions: { code, ...extensions } }],
  });

// what the backend sends for a duplicate: conflict('<input field>', ...)
const conflictError = (field: string) => graphQLError('CONFLICT', { field });

const CONFLICT_TEXT = 'This value is already taken';

// a promise the test settles by hand, to look at the modal while the request runs
function deferred() {
  let resolve!: () => void;
  let reject!: (error: unknown) => void;
  const promise = new Promise<void>((res, rej) => {
    resolve = res;
    reject = rej;
  });
  return { promise, resolve, reject };
}

describe('FormModal', () => {
  describe('frame', () => {
    it('is a small dialog by default and a wide one with size="md"', () => {
      const { unmount } = renderModal();
      expect(getDialog()).toHaveAttribute('data-size', 'sm');
      unmount();

      renderModal({ size: 'md' });
      expect(getDialog()).toHaveAttribute('data-size', 'md');
    });

    it('labels the submit button by mode, or with submitLabel', () => {
      const { unmount } = renderModal();
      expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
      unmount();

      const second = renderModal({ mode: 'update' });
      expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument();
      second.unmount();

      renderModal({ submitLabel: 'Add' });
      expect(screen.getByRole('button', { name: 'Add' })).toBeInTheDocument();
    });

    it('has Cancel from common.actions, which closes the dialog', async () => {
      const { user, onOpenChange } = renderModal();

      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      expect(onOpenChange).toHaveBeenCalledWith(false);
      expect(getDialog()).not.toBeInTheDocument();
    });

    it('puts the layout class on the form and links the submit button to it', () => {
      renderModal({ className: 'custom-layout' });

      const form = getDialog()!.querySelector('form')!;
      expect(form).toHaveClass('custom-layout');
      expect(form).toHaveAttribute('novalidate');
      expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('form', form.id);
      expect(screen.getByRole('button', { name: 'Create' })).toHaveAttribute('type', 'submit');
    });
  });

  describe('values', () => {
    it('fills the form with values when it opens', () => {
      renderModal({ values: { name: 'Engineering' } });

      expect(getInput()).toHaveValue('Engineering');
    });

    it('resets to the new values on every opening, dropping the previous input', async () => {
      const { user, rerender, onOpenChange } = renderModal({ values: { name: 'Engineering' } });

      await user.type(getInput(), ' Team');
      await user.click(screen.getByRole('button', { name: 'Cancel' }));

      rerender(<Harness onOpenChange={onOpenChange} values={{ name: 'Marketing' }} />);
      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(getInput()).toHaveValue('Marketing');
    });
  });

  describe('submit button', () => {
    it('is disabled while the form is invalid', async () => {
      const { user } = renderModal();
      const create = screen.getByRole('button', { name: 'Create' });

      await waitFor(() => expect(create).toBeDisabled());

      await user.type(getInput(), 'QA');
      await waitFor(() => expect(create).toBeEnabled());
    });

    it('with requireDirty, is disabled until something changes', async () => {
      const { user } = renderModal({
        mode: 'update',
        requireDirty: true,
        values: { name: 'Engineering' },
      });
      const save = screen.getByRole('button', { name: 'Save' });

      await waitFor(() => expect(save).toBeDisabled());

      await user.type(getInput(), ' Team');
      await waitFor(() => expect(save).toBeEnabled());
    });
  });

  describe('submitting', () => {
    it('passes the schema output to onSubmit and closes after success', async () => {
      const onSubmit = vi.fn(() => Promise.resolve());
      const { user, onOpenChange } = renderModal({ onSubmit });

      await user.type(getInput(), '  QA  ');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(onSubmit).toHaveBeenCalledWith({ name: 'QA' });
      await waitFor(() => expect(getDialog()).not.toBeInTheDocument());
      expect(onOpenChange).toHaveBeenCalledWith(false);
    });

    it('submits on Enter in a field', async () => {
      const onSubmit = vi.fn(() => Promise.resolve());
      const { user } = renderModal({ onSubmit, values: { name: 'QA' } });

      await user.type(getInput(), '{Enter}');

      expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    it('while the request runs: spinner, Cancel disabled, Esc does not close', async () => {
      const request = deferred();
      const { user, onOpenChange } = renderModal({
        onSubmit: () => request.promise,
        values: { name: 'QA' },
      });
      const create = screen.getByRole('button', { name: 'Create' });

      await user.click(create);

      await waitFor(() => expect(create).toHaveAttribute('aria-busy', 'true'));
      expect(create).toBeDisabled();
      expect(screen.getByRole('button', { name: 'Cancel' })).toBeDisabled();

      await user.keyboard('{Escape}');
      expect(getDialog()).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();

      request.resolve();
      await waitFor(() => expect(getDialog()).not.toBeInTheDocument());
    });
  });

  describe('request error', () => {
    it('shows the text for the error code, keeps the dialog open and the input', async () => {
      const { user, onOpenChange } = renderModal({
        onSubmit: () => Promise.reject(graphQLError('FORBIDDEN')),
        values: { name: 'Engineering' },
      });

      await user.type(getInput(), ' Team');
      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        "You don't have permission to do this",
      );
      expect(screen.queryByText('backend text')).not.toBeInTheDocument();
      expect(getDialog()).toBeInTheDocument();
      expect(getInput()).toHaveValue('Engineering Team');
      expect(onOpenChange).not.toHaveBeenCalled();
      expect(screen.getByRole('button', { name: 'Create' })).toBeEnabled();
    });

    it('shows the generic text for a network error', async () => {
      const { user } = renderModal({
        onSubmit: () => Promise.reject(new Error('Failed to fetch')),
        values: { name: 'QA' },
      });

      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(
        'Something went wrong. Please try again later',
      );
    });

    it('clears the error when the dialog closes and on a new attempt', async () => {
      const onSubmit = vi
        .fn<() => Promise<unknown>>()
        .mockRejectedValueOnce(graphQLError('FORBIDDEN'))
        .mockReturnValue(new Promise(() => {}));
      const { user } = renderModal({ onSubmit, values: { name: 'QA' } });

      await user.click(screen.getByRole('button', { name: 'Create' }));
      await screen.findByRole('alert');

      // a new attempt removes the old error at once
      await user.click(screen.getByRole('button', { name: 'Create' }));
      await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument());
    });

    it('ignores a field the form does not have and shows the error above the buttons', async () => {
      const { user } = renderModal({
        onSubmit: () => Promise.reject(conflictError('email')),
        values: { name: 'QA' },
      });

      await user.click(screen.getByRole('button', { name: 'Create' }));

      expect(await screen.findByRole('alert')).toHaveTextContent(CONFLICT_TEXT);
      expect(getInput()).not.toHaveAttribute('aria-invalid', 'true');
    });

    it('does not show the old error after closing and opening again', async () => {
      const { user } = renderModal({
        onSubmit: () => Promise.reject(graphQLError('FORBIDDEN')),
        values: { name: 'QA' },
      });

      await user.click(screen.getByRole('button', { name: 'Create' }));
      await screen.findByRole('alert');

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(getDialog()).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });

  // the request passed the schema, the backend rejected a field: CONFLICT (duplicate name)
  describe('server error on a field', () => {
    it('shows the text for the code under the field, not above the buttons', async () => {
      const { user, onOpenChange } = renderModal({
        onSubmit: () => Promise.reject(conflictError('name')),
        values: { name: 'Engineering' },
      });

      await user.click(screen.getByRole('button', { name: 'Create' }));

      // the only alert is the field's helper text
      expect(await screen.findByRole('alert')).toHaveTextContent(CONFLICT_TEXT);
      expect(screen.getAllByRole('alert')).toHaveLength(1);
      expect(screen.queryByText('backend text')).not.toBeInTheDocument();
      expect(getInput()).toHaveAttribute('aria-invalid', 'true');
      expect(getInput()).toHaveFocus();
      expect(getInput()).toHaveValue('Engineering');
      expect(getDialog()).toBeInTheDocument();
      expect(onOpenChange).not.toHaveBeenCalled();
    });

    it('disables submit until the field changes, then clears the error', async () => {
      const { user } = renderModal({
        onSubmit: () => Promise.reject(conflictError('name')),
        values: { name: 'Engineering' },
      });
      const create = screen.getByRole('button', { name: 'Create' });

      await user.click(create);
      await screen.findByText(CONFLICT_TEXT);
      await waitFor(() => expect(create).toBeDisabled());

      await user.type(getInput(), ' Team');

      await waitFor(() => expect(screen.queryByText(CONFLICT_TEXT)).not.toBeInTheDocument());
      expect(getInput()).not.toHaveAttribute('aria-invalid', 'true');
      await waitFor(() => expect(create).toBeEnabled());
    });

    it('does not show the field error after closing and opening again', async () => {
      const { user } = renderModal({
        onSubmit: () => Promise.reject(conflictError('name')),
        values: { name: 'Engineering' },
      });

      await user.click(screen.getByRole('button', { name: 'Create' }));
      await screen.findByText(CONFLICT_TEXT);

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      await user.click(screen.getByRole('button', { name: 'Open' }));

      expect(getInput()).toHaveValue('Engineering');
      expect(getInput()).not.toHaveAttribute('aria-invalid', 'true');
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
  });
});
