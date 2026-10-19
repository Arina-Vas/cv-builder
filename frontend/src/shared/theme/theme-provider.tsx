'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react';
import {
  DARK_QUERY,
  DEFAULT_THEME_MODE,
  THEME_STORAGE_KEY,
  isThemeMode,
  resolveTheme,
  type ResolvedTheme,
  type ThemeMode,
} from './theme';

type ThemeContextValue = {
  theme: ThemeMode;
  resolvedTheme: ResolvedTheme;
  setTheme: (mode: ThemeMode) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

function readStoredMode(): ThemeMode {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    return isThemeMode(value) ? value : DEFAULT_THEME_MODE;
  } catch {
    return DEFAULT_THEME_MODE;
  }
}

function createModeStore() {
  let fallback: ThemeMode | null = null;
  const listeners = new Set<() => void>();

  return {
    subscribe(listener: () => void) {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === null || event.key === THEME_STORAGE_KEY) listener();
      };
      window.addEventListener('storage', onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener('storage', onStorage);
      };
    },
    getSnapshot(): ThemeMode {
      return fallback ?? readStoredMode();
    },
    set(mode: ThemeMode) {
      try {
        localStorage.setItem(THEME_STORAGE_KEY, mode);
        fallback = null;
      } catch {
        fallback = mode;
      }
      listeners.forEach((listener) => listener());
    },
  };
}

function subscribeSystem(listener: () => void) {
  const query = window.matchMedia(DARK_QUERY);
  query.addEventListener('change', listener);
  return () => query.removeEventListener('change', listener);
}

const getSystemIsDark = () => window.matchMedia(DARK_QUERY).matches;
const getServerMode = () => DEFAULT_THEME_MODE;
const getServerSystemIsDark = () => false;

const subscribeNoop = () => () => {};
const getHydrated = () => true;
const getServerHydrated = () => false;

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [store] = useState(createModeStore);

  const theme = useSyncExternalStore(store.subscribe, store.getSnapshot, getServerMode);
  const systemIsDark = useSyncExternalStore(
    subscribeSystem,
    getSystemIsDark,
    getServerSystemIsDark,
  );
  const hydrated = useSyncExternalStore(subscribeNoop, getHydrated, getServerHydrated);

  const resolvedTheme = resolveTheme(theme, systemIsDark);

  useEffect(() => {
    if (!hydrated) return;
    document.documentElement.dataset.theme = resolvedTheme;
  }, [hydrated, resolvedTheme]);

  const setTheme = useCallback((mode: ThemeMode) => store.set(mode), [store]);

  const value = useMemo(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
}
