'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { saveLocale } from '@/features/settings/settings.constants';
import { isLocale, LOCALES } from '@/i18n/config';
import { Select } from '@/shared/components/select/Select';
import type { SelectOption } from '@/shared/components/select/Select.types';
import { isThemeMode, THEME_MODES } from '@/shared/theme/theme';
import { useTheme } from '@/shared/theme/theme-provider';
import { ChangePasswordForm } from './ChangePasswordForm';
import s from './Settings.module.css';

export const Settings = () => {
  const t = useTranslations('settings');
  const { theme, setTheme } = useTheme();
  const locale = useLocale();
  const router = useRouter();
  const [isChangingLocale, startTransition] = useTransition();

  const themeOptions: SelectOption[] = THEME_MODES.map((mode) => ({
    value: mode,
    label: t(`theme.${mode}`),
  }));
  const localeOptions: SelectOption[] = LOCALES.map((code) => ({
    value: code,
    label: t(`locales.${code}`),
  }));

  const handleThemeChange = (value: string) => {
    if (isThemeMode(value)) setTheme(value);
  };

  const handleLocaleChange = (value: string) => {
    if (!isLocale(value) || value === locale) return;
    saveLocale(value);
    startTransition(() => router.refresh());
  };

  return (
    <div className={s.root}>
      <section className={s.preferences} aria-label={t('preferences')}>
        <Select
          label={t('theme.label')}
          options={themeOptions}
          value={theme}
          onValueChange={handleThemeChange}
        />
        <Select
          label={t('language.label')}
          options={localeOptions}
          value={locale}
          onValueChange={handleLocaleChange}
          disabled={isChangingLocale}
        />
      </section>

      <ChangePasswordForm />
    </div>
  );
};
