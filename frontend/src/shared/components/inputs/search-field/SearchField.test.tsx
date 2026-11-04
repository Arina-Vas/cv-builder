import { act, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { SearchField } from './SearchField';

// Testing Library awaits a zero timeout inside user-event; with a fully frozen clock it never fires
const setupUser = () => userEvent.setup({ advanceTimers: vi.advanceTimersByTime });

const getInput = () => screen.getByRole('searchbox', { name: 'Search' });
const queryClearButton = () => screen.queryByRole('button', { name: 'Clear search' });

describe('SearchField', () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('shows the initial value', () => {
    renderWithProviders(<SearchField value="React" onChange={vi.fn()} />);

    expect(getInput()).toHaveValue('React');
  });

  describe('debounce', () => {
    it('shows typed text at once but calls onChange only after the delay', async () => {
      const onChange = vi.fn();
      const user = setupUser();
      renderWithProviders(<SearchField value="" onChange={onChange} />);

      await user.type(getInput(), 'react');

      expect(getInput()).toHaveValue('react');
      expect(onChange).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(300));

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith('react');
    });

    it('restarts the delay on every keystroke', async () => {
      const onChange = vi.fn();
      const user = setupUser();
      renderWithProviders(<SearchField value="" onChange={onChange} />);

      await user.type(getInput(), 're');
      act(() => vi.advanceTimersByTime(200));
      await user.type(getInput(), 'act');
      act(() => vi.advanceTimersByTime(200));

      expect(onChange).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(100));

      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith('react');
    });

    it('uses a custom delay', async () => {
      const onChange = vi.fn();
      const user = setupUser();
      renderWithProviders(<SearchField value="" onChange={onChange} delay={1000} />);

      await user.type(getInput(), 'a');
      act(() => vi.advanceTimersByTime(900));
      expect(onChange).not.toHaveBeenCalled();

      act(() => vi.advanceTimersByTime(100));
      expect(onChange).toHaveBeenCalledWith('a');
    });

    it('does not call onChange after unmount', async () => {
      const onChange = vi.fn();
      const user = setupUser();
      const { unmount } = renderWithProviders(<SearchField value="" onChange={onChange} />);

      await user.type(getInput(), 'a');
      unmount();
      act(() => vi.advanceTimersByTime(300));

      expect(onChange).not.toHaveBeenCalled();
    });
  });

  describe('clear button', () => {
    it('is shown only when the field has text', async () => {
      const user = setupUser();
      renderWithProviders(<SearchField value="" onChange={vi.fn()} />);

      expect(queryClearButton()).not.toBeInTheDocument();

      await user.type(getInput(), 'a');

      expect(queryClearButton()).toBeInTheDocument();
    });

    it('clears the field at once, focuses it and drops the pending search', async () => {
      const onChange = vi.fn();
      const user = setupUser();
      renderWithProviders(<SearchField value="" onChange={onChange} />);

      await user.type(getInput(), 'abc');
      await user.click(queryClearButton()!);

      expect(getInput()).toHaveValue('');
      expect(getInput()).toHaveFocus();
      expect(queryClearButton()).not.toBeInTheDocument();
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith('');

      act(() => vi.advanceTimersByTime(300));

      expect(onChange).toHaveBeenCalledOnce();
    });
  });

  describe('Escape', () => {
    it('clears a non-empty field and does not let the key reach a parent (e.g. a modal)', async () => {
      const onChange = vi.fn();
      const onParentKeyDown = vi.fn();
      const user = setupUser();
      renderWithProviders(
        <div onKeyDown={onParentKeyDown}>
          <SearchField value="abc" onChange={onChange} />
        </div>,
      );

      await user.click(getInput());
      await user.keyboard('{Escape}');

      expect(getInput()).toHaveValue('');
      expect(onChange).toHaveBeenCalledOnce();
      expect(onChange).toHaveBeenCalledWith('');
      expect(onParentKeyDown).not.toHaveBeenCalled();
    });

    it('does nothing on an empty field and lets the key bubble up', async () => {
      const onChange = vi.fn();
      const onParentKeyDown = vi.fn();
      const user = setupUser();
      renderWithProviders(
        <div onKeyDown={onParentKeyDown}>
          <SearchField value="" onChange={onChange} />
        </div>,
      );

      await user.click(getInput());
      await user.keyboard('{Escape}');

      expect(onChange).not.toHaveBeenCalled();
      expect(onParentKeyDown).toHaveBeenCalledOnce();
    });
  });

  describe('value from outside', () => {
    it('shows a new value set by the parent (e.g. browser back/forward)', () => {
      const onChange = vi.fn();
      const { rerender } = renderWithProviders(<SearchField value="react" onChange={onChange} />);

      rerender(<SearchField value="angular" onChange={onChange} />);

      expect(getInput()).toHaveValue('angular');
      expect(onChange).not.toHaveBeenCalled();
    });

    it('keeps text typed after the last sent value when that value comes back', async () => {
      const onChange = vi.fn();
      const user = setupUser();
      const { rerender } = renderWithProviders(<SearchField value="" onChange={onChange} />);

      await user.type(getInput(), 're');
      act(() => vi.advanceTimersByTime(300));
      expect(onChange).toHaveBeenLastCalledWith('re');

      await user.type(getInput(), 'a');
      rerender(<SearchField value="re" onChange={onChange} />);

      expect(getInput()).toHaveValue('rea');
    });
  });
});
