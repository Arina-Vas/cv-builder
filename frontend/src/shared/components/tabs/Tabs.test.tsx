import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { usePathname } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { getActiveHref, Tabs } from './Tabs';

const ITEMS = [
  { href: '/cvs/1/details', label: 'Details' },
  { href: '/cvs/1/skills', label: 'Skills' },
  { href: '/cvs/1/projects', label: 'Projects' },
];

function renderTabs(pathname: string) {
  usePathname.mockReturnValue(pathname);
  return renderWithProviders(
    <Tabs items={ITEMS} label="CV sections">
      <p>Tab content</p>
    </Tabs>,
  );
}

describe('getActiveHref', () => {
  it('matches the exact path', () => {
    expect(getActiveHref(ITEMS, '/cvs/1/skills')).toBe('/cvs/1/skills');
  });

  it('matches a nested path of a tab', () => {
    expect(getActiveHref(ITEMS, '/cvs/1/projects/42')).toBe('/cvs/1/projects');
  });

  it('prefers the longest matching href', () => {
    const items = [
      { href: '/users', label: 'Users' },
      { href: '/users/1', label: 'User' },
    ];
    expect(getActiveHref(items, '/users/1/skills')).toBe('/users/1');
  });

  it('does not match a path that only shares a prefix', () => {
    expect(getActiveHref(ITEMS, '/cvs/1/skillsets')).toBe('');
  });

  it('returns an empty string when no tab matches', () => {
    expect(getActiveHref(ITEMS, '/settings')).toBe('');
  });
});

describe('Tabs', () => {
  it('renders a labelled tab list with a link per item', () => {
    renderTabs('/cvs/1/details');

    expect(screen.getByRole('tablist', { name: 'CV sections' })).toBeInTheDocument();
    ITEMS.forEach(({ href, label }) => {
      expect(screen.getByRole('tab', { name: label })).toHaveAttribute('href', href);
    });
  });

  it('marks the tab of the current route as selected', () => {
    renderTabs('/cvs/1/skills');

    const skills = screen.getByRole('tab', { name: 'Skills' });
    expect(skills).toHaveAttribute('aria-selected', 'true');
    expect(skills).toHaveAttribute('aria-current', 'page');

    const details = screen.getByRole('tab', { name: 'Details' });
    expect(details).toHaveAttribute('aria-selected', 'false');
    expect(details).not.toHaveAttribute('aria-current');
  });

  it('renders the children inside the tab panel of the active tab', () => {
    renderTabs('/cvs/1/projects');

    const panel = screen.getByRole('tabpanel');
    expect(panel).toHaveTextContent('Tab content');
    expect(panel).toHaveAttribute(
      'aria-labelledby',
      screen.getByRole('tab', { name: 'Projects' }).id,
    );
  });

  it('moves focus between tabs with the arrow keys', async () => {
    const { user } = renderTabs('/cvs/1/details');

    await user.tab();
    expect(screen.getByRole('tab', { name: 'Details' })).toHaveFocus();

    await user.keyboard('{ArrowRight}');
    expect(screen.getByRole('tab', { name: 'Skills' })).toHaveFocus();

    await user.keyboard('{ArrowLeft}{ArrowLeft}');
    expect(screen.getByRole('tab', { name: 'Projects' })).toHaveFocus();
  });

  it('keeps the selected tab while focus moves', async () => {
    const { user } = renderTabs('/cvs/1/details');

    await user.tab();
    await user.keyboard('{ArrowRight}');

    expect(screen.getByRole('tab', { name: 'Details' })).toHaveAttribute('aria-selected', 'true');
  });
});
