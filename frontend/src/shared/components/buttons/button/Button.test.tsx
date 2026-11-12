import { screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { closedGate } from '@/test/action-gate';
import { renderWithProviders } from '@/test/render';
import { Button } from './Button';

describe('Button', () => {
  it('renders its label and defaults to type="button"', () => {
    renderWithProviders(<Button>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toHaveAttribute('type', 'button');
    expect(button).toBeEnabled();
  });

  it('calls onClick when clicked', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(<Button onClick={onClick}>Save</Button>);

    await user.click(screen.getByRole('button', { name: 'Save' }));

    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('is disabled and busy while loading, so a second submit is impossible', async () => {
    const onClick = vi.fn();
    const { user } = renderWithProviders(
      <Button loading onClick={onClick}>
        Save
      </Button>,
    );

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-busy', 'true');

    await user.click(button);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('respects the disabled prop', () => {
    renderWithProviders(<Button disabled>Save</Button>);

    const button = screen.getByRole('button', { name: 'Save' });
    expect(button).toBeDisabled();
    expect(button).not.toHaveAttribute('aria-busy');
  });

  it('passes type="submit" through', () => {
    renderWithProviders(<Button type="submit">Send</Button>);

    expect(screen.getByRole('button', { name: 'Send' })).toHaveAttribute('type', 'submit');
  });

  describe('gated', () => {
    it('works as usual without an action gate provider', async () => {
      const onClick = vi.fn();
      const { user } = renderWithProviders(
        <Button gated onClick={onClick}>
          Save
        </Button>,
      );

      const button = screen.getByRole('button', { name: 'Save' });
      expect(button).not.toHaveAttribute('aria-disabled');
      await user.click(button);
      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('is locked by a closed gate: aria-disabled, the click is stopped', async () => {
      const onClick = vi.fn();
      const { blocked, Wrapper } = closedGate();
      const { user } = renderWithProviders(
        <Wrapper>
          <Button gated onClick={onClick}>
            Save
          </Button>
        </Wrapper>,
      );

      const button = screen.getByRole('button', { name: 'Save' });
      expect(button).toHaveAttribute('aria-disabled', 'true');
      expect(button).toBeEnabled();

      await user.click(button);
      expect(blocked).toHaveBeenCalledTimes(1);
      expect(onClick).not.toHaveBeenCalled();
    });

    it('does not submit its form when locked (click or Enter in a field)', async () => {
      const onSubmit = vi.fn((event: React.FormEvent) => event.preventDefault());
      const { Wrapper } = closedGate();
      const { user } = renderWithProviders(
        <Wrapper>
          <form onSubmit={onSubmit}>
            <input aria-label="Name" />
            <Button type="submit" gated>
              Save
            </Button>
          </form>
        </Wrapper>,
      );

      await user.click(screen.getByRole('button', { name: 'Save' }));
      await user.type(screen.getByRole('textbox', { name: 'Name' }), 'x{Enter}');

      expect(onSubmit).not.toHaveBeenCalled();
    });

    it('is not locked without `gated` even under a closed gate', async () => {
      const onClick = vi.fn();
      const { blocked, Wrapper } = closedGate();
      const { user } = renderWithProviders(
        <Wrapper>
          <Button onClick={onClick}>Cancel</Button>
        </Wrapper>,
      );

      await user.click(screen.getByRole('button', { name: 'Cancel' }));
      expect(onClick).toHaveBeenCalledTimes(1);
      expect(blocked).not.toHaveBeenCalled();
    });
  });
});
