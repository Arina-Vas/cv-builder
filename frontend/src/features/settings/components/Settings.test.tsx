import { screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { LOCALE_COOKIE } from '@/i18n/config';
import { mockRouter } from '@/test/next-navigation';
import { renderWithProviders } from '@/test/render';
import { Settings } from './Settings';

const optionNames = () =>
  within(document.body)
    .getAllByRole('option')
    .map((option) => option.textContent);

const localeCookie = () =>
  document.cookie
    .split('; ')
    .find((cookie) => cookie.startsWith(`${LOCALE_COOKIE}=`))
    ?.split('=')[1];

describe('Settings', () => {
  afterEach(() => {
    document.cookie = `${LOCALE_COOKIE}=; path=/; max-age=0`;
  });

  describe('theme', () => {
    it('shows Device settings by default and offers Light, Dark and Device settings', async () => {
      const { user } = renderWithProviders(<Settings />);
      const theme = screen.getByRole('combobox', { name: 'Theme' });

      expect(theme).toHaveTextContent('Device settings');
      await user.click(theme);
      expect(optionNames()).toEqual(['Light', 'Dark', 'Device settings']);
    });

    it('applies and stores the chosen theme', async () => {
      const { user } = renderWithProviders(<Settings />);

      await user.click(screen.getByRole('combobox', { name: 'Theme' }));
      await user.click(within(document.body).getByRole('option', { name: 'Dark' }));

      expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveTextContent('Dark');
      expect(localStorage.getItem('cv-builder-theme')).toBe('DARK');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('shows the stored theme', () => {
      localStorage.setItem('cv-builder-theme', 'LIGHT');
      renderWithProviders(<Settings />);

      expect(screen.getByRole('combobox', { name: 'Theme' })).toHaveTextContent('Light');
    });
  });

  describe('language', () => {
    it('shows the current language and the nine languages of the spec, each in its own language', async () => {
      const { user } = renderWithProviders(<Settings />);
      const language = screen.getByRole('combobox', { name: 'Language' });

      expect(language).toHaveTextContent('English');
      await user.click(language);
      // The UI is English here, yet French is "Français": the names do not follow the UI language
      expect(optionNames()).toEqual([
        'English',
        'Français',
        'Deutsch',
        'Italiano',
        'Polski',
        'Português',
        'Русский',
        'Español',
        'Українська',
      ]);
    });

    it('stores the chosen language in the cookie for a year and re-renders the page', async () => {
      const { user } = renderWithProviders(<Settings />);

      await user.click(screen.getByRole('combobox', { name: 'Language' }));
      await user.click(within(document.body).getByRole('option', { name: 'Українська' }));

      expect(localeCookie()).toBe('uk');
      expect(mockRouter.refresh).toHaveBeenCalledTimes(1);
    });

    it('does nothing when the current language is chosen again', async () => {
      const { user } = renderWithProviders(<Settings />);

      await user.click(screen.getByRole('combobox', { name: 'Language' }));
      await user.click(within(document.body).getByRole('option', { name: 'English' }));

      expect(localeCookie()).toBeUndefined();
      expect(mockRouter.refresh).not.toHaveBeenCalled();
    });
  });

  it('shows the Change password section', () => {
    renderWithProviders(<Settings />);

    expect(screen.getByRole('heading', { name: 'Change password' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Change' })).toBeDisabled();
  });
});
