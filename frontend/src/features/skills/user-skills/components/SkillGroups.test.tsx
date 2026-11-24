import { screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/render';
import { SkillGroups } from './SkillGroups';

const frontend = { id: 'c1', name: 'Frontend' };
const backend = { id: 'c2', name: 'Backend' };

const item = (
  id: string,
  name: string,
  mastery: 'BEGINNER' | 'EXPERT',
  category: { id: string; name: string },
) => ({ id, mastery, skill: { name, category } });

const react = item('a1', 'React', 'EXPERT', frontend);
const css = item('a2', 'CSS', 'BEGINNER', frontend);
const nest = item('a3', 'NestJS', 'EXPERT', backend);

type Props = Partial<Parameters<typeof SkillGroups<typeof react>>[0]>;

const renderGroups = (props: Props = {}) =>
  renderWithProviders(
    <SkillGroups
      skills={[react, css, nest]}
      idPrefix="test-category"
      canEdit
      onItemClick={vi.fn()}
      {...props}
    />,
  );

describe('SkillGroups', () => {
  it('shows one named section per category, in input order, with only its own skills', () => {
    const { container } = renderGroups();

    // container, not getAllByRole('region'): the toast viewport is a region too
    const sections = [...container.querySelectorAll('section')];
    expect(sections.map((section) => section.getAttribute('aria-labelledby'))).toEqual([
      'test-category-c1',
      'test-category-c2',
    ]);

    const frontendSection = screen.getByRole('region', { name: 'Frontend' });
    expect(within(frontendSection).getByText('React')).toBeInTheDocument();
    expect(within(frontendSection).getByText('CSS')).toBeInTheDocument();
    expect(within(frontendSection).queryByText('NestJS')).not.toBeInTheDocument();
  });

  it('renders nothing for an empty list', () => {
    const { container } = renderGroups({ skills: [] });

    expect(container.querySelector('section')).toBeNull();
  });

  it('shows the mastery of each skill as a named meter', () => {
    renderGroups();

    expect(screen.getByRole('meter', { name: 'CSS' })).toHaveAttribute(
      'aria-valuetext',
      'Beginner',
    );
    expect(screen.getByRole('meter', { name: 'NestJS' })).toHaveAttribute(
      'aria-valuetext',
      'Expert',
    );
  });

  it('passes the clicked item to onItemClick', async () => {
    const onItemClick = vi.fn();
    const { user } = renderGroups({ onItemClick });

    await user.click(screen.getByRole('button', { name: /CSS/ }));

    expect(onItemClick).toHaveBeenCalledWith(css);
  });

  it('has no buttons when it cannot be edited', () => {
    renderGroups({ canEdit: false });

    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('marks the selected items as pressed in selection mode', () => {
    renderGroups({ selectedIds: new Set(['a1']) });

    expect(screen.getByRole('button', { name: /React/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /CSS/ })).toHaveAttribute('aria-pressed', 'false');
  });

  it('exposes no pressed state outside selection mode', () => {
    renderGroups();

    expect(screen.getByRole('button', { name: /React/ })).not.toHaveAttribute('aria-pressed');
  });
});
