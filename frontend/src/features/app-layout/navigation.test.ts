import { describe, expect, it } from 'vitest';
import { getNavItems, isActivePath } from './navigation';

const MAIN_HREFS = ['/users', '/skills', '/languages', '/cvs'];
const ADMIN_HREFS = ['/departments', '/positions', '/projects'];

const hrefs = (items: { href: string }[]) => items.map((item) => item.href);

describe('getNavItems', () => {
  it('gives an admin the common tabs and the admin tabs', () => {
    const { main, admin } = getNavItems('ADMIN');

    expect(hrefs(main)).toEqual(MAIN_HREFS);
    expect(hrefs(admin)).toEqual(ADMIN_HREFS);
  });

  it('gives an employee only the common tabs', () => {
    const { main, admin } = getNavItems('EMPLOYEE');

    expect(hrefs(main)).toEqual(MAIN_HREFS);
    expect(admin).toEqual([]);
  });

  it('hides the admin tabs while the role is still unknown', () => {
    const { main, admin } = getNavItems(null);

    expect(hrefs(main)).toEqual(MAIN_HREFS);
    expect(admin).toEqual([]);
  });
});

describe('isActivePath', () => {
  it('matches the tab page itself', () => {
    expect(isActivePath('/users', '/users')).toBe(true);
  });

  it('matches pages nested under the tab', () => {
    expect(isActivePath('/users/42/skills', '/users')).toBe(true);
  });

  it('does not match a different page that only starts with the same letters', () => {
    expect(isActivePath('/users-archive', '/users')).toBe(false);
  });

  it('does not match other tabs', () => {
    expect(isActivePath('/cvs', '/users')).toBe(false);
  });
});
