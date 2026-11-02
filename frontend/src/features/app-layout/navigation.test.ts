import { describe, expect, it } from 'vitest';
import { getNavItems } from './navigation';

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
