import { describe, expect, it } from 'vitest';
import { mergeMessages } from './merge-messages';

const english = {
  nav: { employees: 'Employees', skills: 'Skills' },
  settings: { theme: { label: 'Theme', DARK: 'Dark' }, title: 'Settings' },
};

describe('mergeMessages', () => {
  it('takes the translation where it exists and keeps the English text where it is missing', () => {
    const merged = mergeMessages(english, { nav: { employees: 'Працівники' } });

    expect(merged.nav).toEqual({ employees: 'Працівники', skills: 'Skills' });
  });

  it('merges nested groups key by key instead of replacing the whole group', () => {
    const merged = mergeMessages(english, { settings: { theme: { DARK: 'Темна' } } });

    expect(merged.settings).toEqual({
      theme: { label: 'Theme', DARK: 'Темна' },
      title: 'Settings',
    });
  });

  it('returns the fallback unchanged for an empty translation', () => {
    expect(mergeMessages(english, {})).toEqual(english);
  });

  it('does not change its arguments', () => {
    const translation = { settings: { theme: { DARK: 'Темна' } } };
    const before = structuredClone({ english, translation });

    mergeMessages(english, translation);

    expect({ english, translation }).toEqual(before);
  });
});
