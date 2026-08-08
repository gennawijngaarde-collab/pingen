import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { fr as dfFr, enUS, es as dfEs, de as dfDe, type Locale } from 'date-fns/locale';
import { detectLocale, persistLocale } from './detect';
import type { AppLocale, Dictionary } from './types';
import { LOCALE_LABELS } from './types';
import fr from './locales/fr';
import en from './locales/en';
import es from './locales/es';
import de from './locales/de';

const dictionaries: Record<AppLocale, Dictionary> = { fr, en, es, de };

const dateLocales: Record<AppLocale, Locale> = {
  fr: dfFr,
  en: enUS,
  es: dfEs,
  de: dfDe,
};

interface I18nContextValue {
  locale: AppLocale;
  setLocale: (locale: AppLocale) => void;
  t: Dictionary;
  dateLocale: Locale;
  localeLabel: string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<AppLocale>(() => detectLocale());

  const setLocale = useCallback((next: AppLocale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const value = useMemo<I18nContextValue>(
    () => ({
      locale,
      setLocale,
      t: dictionaries[locale],
      dateLocale: dateLocales[locale],
      localeLabel: LOCALE_LABELS[locale],
    }),
    [locale, setLocale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

export { LOCALE_LABELS };
export type { AppLocale, Dictionary };
