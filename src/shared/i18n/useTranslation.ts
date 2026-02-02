import { useCallback } from 'react';
import { useAppStore } from '@shared/stores/appStore';
import { translations, type Locale } from './translations';

function getNested(obj: Record<string, unknown>, path: string): string | undefined {
  const value = path.split('.').reduce<unknown>((acc, key) => (acc as Record<string, unknown>)?.[key], obj);
  return typeof value === 'string' ? value : undefined;
}

const VALID_LOCALES: Locale[] = ['en', 'tr'];

function getSafeLocale(locale: unknown): Locale {
  return VALID_LOCALES.includes(locale as Locale) ? (locale as Locale) : 'tr';
}

export function useTranslation() {
  const localeFromStore = useAppStore((s) => s.locale);
  const locale = getSafeLocale(localeFromStore);
  const dict = translations[locale] as Record<string, unknown>;

  const t = useCallback(
    (key: string): string => getNested(dict, key) ?? key,
    [locale, dict]
  );

  return { t, locale };
}
