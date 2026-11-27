import { render, screen, within } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { ProfileIcon } from '../icons/ProfileIcon';
import { Breadcrumbs, type BreadcrumbItem } from './Breadcrumbs';

const ITEMS: BreadcrumbItem[] = [
  { label: 'Employees', href: '/users' },
  { label: 'Anna Smith', href: '/users/42/profile', icon: ProfileIcon, variant: 'entity' },
  { label: 'Skills' },
];

const renderBreadcrumbs = (items: readonly BreadcrumbItem[] = ITEMS) =>
  render(<Breadcrumbs items={items} label="Breadcrumb" />);

describe('Breadcrumbs', () => {
  it('renders a labelled nav with an ordered list of items', () => {
    renderBreadcrumbs();

    const nav = screen.getByRole('navigation', { name: 'Breadcrumb' });
    const list = within(nav).getByRole('list');
    expect(list.tagName).toBe('OL');
    expect(within(list).getAllByRole('listitem')).toHaveLength(3);
  });

  it('links the previous items to their pages', () => {
    renderBreadcrumbs();

    expect(screen.getByRole('link', { name: 'Employees' })).toHaveAttribute('href', '/users');
    expect(screen.getByRole('link', { name: 'Anna Smith' })).toHaveAttribute(
      'href',
      '/users/42/profile',
    );
  });

  it('shows the last item without href as the current page, not a link', () => {
    renderBreadcrumbs();

    expect(screen.queryByRole('link', { name: 'Skills' })).not.toBeInTheDocument();
    expect(screen.getByText('Skills').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'page',
    );
    expect(screen.getByRole('link', { name: 'Employees' })).not.toHaveAttribute('aria-current');
  });

  it('shows a single item without href as plain current text', () => {
    renderBreadcrumbs([{ label: 'Settings' }]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Settings').closest('[aria-current]')).toHaveAttribute(
      'aria-current',
      'page',
    );
  });

  // e.g. "CVs" on a CV that does not exist: the user is not on the CVs page, the item leads back to it
  it('links a last item that has an href, without marking it current', () => {
    renderBreadcrumbs([{ label: 'CVs', href: '/cvs' }]);

    expect(screen.getByRole('link', { name: 'CVs' })).toHaveAttribute('href', '/cvs');
    expect(screen.getByRole('link', { name: 'CVs' })).not.toHaveAttribute('aria-current');
  });

  it('renders an item without href as text', () => {
    renderBreadcrumbs([{ label: 'Employees' }, { label: 'Skills' }]);

    expect(screen.queryByRole('link')).not.toBeInTheDocument();
    expect(screen.getByText('Employees').closest('[aria-current]')).toBeNull();
  });

  it('puts a separator before every item except the first', () => {
    const { container } = renderBreadcrumbs();

    const items = container.querySelectorAll('li');
    expect(items[0]?.querySelectorAll('svg')).toHaveLength(0);
    expect(items[1]?.querySelectorAll('svg')).toHaveLength(2); // separator + profile icon
    expect(items[2]?.querySelectorAll('svg')).toHaveLength(1); // separator only
  });

  it('marks the entity item and keeps the full name in the tooltip', () => {
    renderBreadcrumbs();

    const entity = screen.getByRole('link', { name: 'Anna Smith' });
    expect(entity.closest('li')).toHaveAttribute('data-variant', 'entity');
    expect(entity).toHaveAttribute('title', 'Anna Smith');
  });

  it('shows a hidden skeleton instead of the name while it loads', () => {
    renderBreadcrumbs([
      { label: 'Employees', href: '/users' },
      { label: '', href: '/users/42/profile', variant: 'entity', loading: true },
      { label: 'Skills' },
    ]);

    expect(screen.getAllByRole('link')).toHaveLength(1);
    const entityItem = screen.getAllByRole('listitem')[1];
    expect(entityItem?.querySelector('[aria-hidden]:not(svg)')).toBeInTheDocument();
  });
});
