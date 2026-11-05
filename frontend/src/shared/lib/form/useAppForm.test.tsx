import { act, render, renderHook, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { Mode } from 'react-hook-form';
import { describe, expect, it, vi } from 'vitest';
import { z } from 'zod';
import { requiredDate, requiredString } from './schemas';
import { useAppForm } from './useAppForm';

const schema = z.object({
  name: requiredString('Name is required'),
  startDate: requiredDate('Start Date is required'),
});

const emptyValues = { name: '', startDate: null };

function renderForm(props: Partial<Parameters<typeof useAppForm>[0]> = {}) {
  return renderHook(() => {
    const form = useAppForm({ schema, defaultValues: emptyValues, ...props });
    // formState is a proxy: reading a key during render subscribes to it, as a component would
    void form.formState.errors;
    void form.formState.isValid;
    return form;
  });
}

// a real input, so the validation mode (blur / change) is exercised as in a form
function NameField({ mode }: { mode?: Mode }) {
  const form = useAppForm({
    schema: z.object({ name: requiredString('Name is required') }),
    defaultValues: { name: '' },
    mode, // undefined in the default tests: must keep onTouched, not fall back to onSubmit
  });

  return (
    <>
      <input aria-label="Name" {...form.register('name')} />
      <p role="alert">{form.formState.errors.name?.message}</p>
    </>
  );
}

describe('useAppForm', () => {
  it('shows an error only after the field loses focus (mode onTouched)', async () => {
    const user = userEvent.setup();
    render(<NameField />);
    const input = screen.getByRole('textbox', { name: 'Name' });

    await user.type(input, 'a');
    await user.clear(input);
    expect(screen.getByRole('alert')).toHaveTextContent('');

    await user.tab();
    // the zod resolver is async, so the error appears after the blur handler resolves
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Name is required'));
  });

  it('re-validates on every change once the error is shown (reValidateMode onChange)', async () => {
    const user = userEvent.setup();
    render(<NameField />);
    const input = screen.getByRole('textbox', { name: 'Name' });

    await user.click(input);
    await user.tab();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Name is required'));

    await user.type(input, 'a');
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent(''));
  });

  it('lets the caller override the validation mode', async () => {
    const user = userEvent.setup();
    render(<NameField mode="onChange" />);
    const input = screen.getByRole('textbox', { name: 'Name' });

    await user.type(input, 'a');
    await user.clear(input);

    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Name is required'));
  });

  it('computes isValid from the schema', async () => {
    const { result } = renderForm();

    expect(result.current.formState.isValid).toBe(false);

    await act(async () => {
      result.current.setValue('name', 'Engineering', { shouldValidate: true });
      result.current.setValue('startDate', new Date(2024, 0, 15), { shouldValidate: true });
    });

    await waitFor(() => expect(result.current.formState.isValid).toBe(true));
  });

  it('passes the schema output to handleSubmit', async () => {
    const date = new Date(2024, 0, 15);
    const onValid = vi.fn();
    const { result } = renderForm({ defaultValues: { name: '  Engineering  ', startDate: date } });

    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).toHaveBeenCalledWith({ name: 'Engineering', startDate: date }, undefined);
  });

  it('does not submit invalid values and reports every field', async () => {
    const onValid = vi.fn();
    const { result } = renderForm();

    await act(async () => {
      await result.current.handleSubmit(onValid)();
    });

    expect(onValid).not.toHaveBeenCalled();
    expect(result.current.formState.errors.name?.message).toBe('Name is required');
    expect(result.current.formState.errors.startDate?.message).toBe('Start Date is required');
  });
});
