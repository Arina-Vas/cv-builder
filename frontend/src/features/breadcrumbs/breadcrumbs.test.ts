import { describe, expect, it } from 'vitest';
import { ProfileIcon } from '@/shared/components/icons/ProfileIcon';
import { buildBreadcrumbs, parseBreadcrumbRoute } from './breadcrumbs';

// Returns the key itself, so the result shows which translation was asked for.
const translate = (key: string) => key;

const LOADING = { name: undefined, loading: true };
const LOADED = { name: 'Anna Smith', loading: false };

describe('parseBreadcrumbRoute', () => {
  it.each([
    ['/users', 'users'],
    ['/settings', 'settings'],
    ['/departments', 'departments'],
  ])('reads a list page %s as a section', (pathname, section) => {
    expect(parseBreadcrumbRoute(pathname)).toEqual({ kind: 'section', section });
  });

  it('reads an employee tab as a detail page', () => {
    expect(parseBreadcrumbRoute('/users/42/skills')).toEqual({
      kind: 'detail',
      section: 'users',
      id: '42',
      tab: 'skills',
    });
  });

  it('reads a CV tab as a detail page', () => {
    expect(parseBreadcrumbRoute('/cvs/7/preview')).toEqual({
      kind: 'detail',
      section: 'cvs',
      id: '7',
      tab: 'preview',
    });
  });

  it('ignores a trailing slash', () => {
    expect(parseBreadcrumbRoute('/users/42/skills/')).toEqual(
      parseBreadcrumbRoute('/users/42/skills'),
    );
  });

  it('treats extra segments of a section without detail pages as the section', () => {
    expect(parseBreadcrumbRoute('/skills/abc')).toEqual({ kind: 'section', section: 'skills' });
  });

  it.each(['/', '/unknown', '/toString'])('gives no route for %s', (pathname) => {
    expect(parseBreadcrumbRoute(pathname)).toBeNull();
  });

  it.each(['/users/42', '/users/42/unknown', '/cvs/7/profile'])(
    'gives no route for a detail URL without a known tab: %s',
    (pathname) => {
      expect(parseBreadcrumbRoute(pathname)).toBeNull();
    },
  );
});

describe('buildBreadcrumbs', () => {
  it('gives no items without a route', () => {
    expect(buildBreadcrumbs(null, translate, LOADING)).toEqual([]);
  });

  it('gives a list page one plain item', () => {
    const items = buildBreadcrumbs({ kind: 'section', section: 'users' }, translate, LOADING);

    expect(items).toEqual([{ label: 'nav.employees' }]);
  });

  it('uses the profile menu label for settings', () => {
    const items = buildBreadcrumbs({ kind: 'section', section: 'settings' }, translate, LOADING);

    expect(items).toEqual([{ label: 'layout.settings' }]);
  });

  it('builds section > employee > tab for an employee page', () => {
    const items = buildBreadcrumbs(
      { kind: 'detail', section: 'users', id: '42', tab: 'skills' },
      translate,
      LOADED,
    );

    expect(items).toEqual([
      { label: 'nav.employees', href: '/users' },
      {
        label: 'Anna Smith',
        href: '/users/42/profile',
        icon: ProfileIcon,
        variant: 'entity',
        loading: false,
      },
      { label: 'users.tabs.skills' },
    ]);
  });

  it('builds a CV page without an icon and links the name to the first tab', () => {
    const [, cv, tab] = buildBreadcrumbs(
      { kind: 'detail', section: 'cvs', id: '7', tab: 'projects' },
      translate,
      { name: 'Frontend CV', loading: false },
    );

    expect(cv).toMatchObject({ label: 'Frontend CV', href: '/cvs/7/details', variant: 'entity' });
    expect(cv?.icon).toBeUndefined();
    expect(tab).toEqual({ label: 'cvs.tabs.projects' });
  });

  it('shows the name as loading while it is not known', () => {
    const [, user] = buildBreadcrumbs(
      { kind: 'detail', section: 'users', id: '42', tab: 'profile' },
      translate,
      LOADING,
    );

    expect(user).toMatchObject({ label: '', loading: true });
  });

  it('follows the tab when only the tab changes', () => {
    const route = parseBreadcrumbRoute('/users/42/languages');
    const items = buildBreadcrumbs(route, translate, LOADED);

    expect(items.at(-1)).toEqual({ label: 'users.tabs.languages' });
  });
});
