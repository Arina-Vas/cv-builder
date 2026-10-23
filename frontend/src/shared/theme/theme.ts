export type ThemeMode = 'LIGHT' | 'DARK' | 'SYSTEM';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_MODES = ['LIGHT', 'DARK', 'SYSTEM'] as const;
export const THEME_STORAGE_KEY = 'cv-builder-theme';
export const DARK_QUERY = '(prefers-color-scheme: dark)';
export const DEFAULT_THEME_MODE: ThemeMode = 'SYSTEM';

export function isThemeMode(value: unknown): value is ThemeMode {
  return typeof value === 'string' && (THEME_MODES as readonly string[]).includes(value);
}

export function resolveTheme(mode: ThemeMode, systemIsDark: boolean): ResolvedTheme {
  switch (mode) {
    case 'LIGHT':
      return 'light';
    case 'DARK':
      return 'dark';
    case 'SYSTEM':
      return systemIsDark ? 'dark' : 'light';
  }
}
