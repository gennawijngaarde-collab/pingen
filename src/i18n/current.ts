import { detectLocale } from './detect';
import type { AppLocale, Dictionary } from './types';
import fr from './locales/fr';
import en from './locales/en';
import es from './locales/es';
import de from './locales/de';

export const dictionaries: Record<AppLocale, Dictionary> = { fr, en, es, de };

/** English names used to instruct the AI models. */
export const LANGUAGE_NAMES: Record<AppLocale, string> = {
  fr: 'French',
  en: 'English',
  es: 'Spanish',
  de: 'German',
};

export const LOCALE_TAGS: Record<AppLocale, string> = {
  fr: 'fr-FR',
  en: 'en-US',
  es: 'es-ES',
  de: 'de-DE',
};

export function isAppLocale(value: unknown): value is AppLocale {
  return value === 'fr' || value === 'en' || value === 'es' || value === 'de';
}

/**
 * Language currently selected by the user (same source as the I18nProvider),
 * for code that runs outside React: AI prompts, background workers, hooks.
 */
export function currentLocale(): AppLocale {
  return detectLocale();
}

export function currentDictionary(): Dictionary {
  return dictionaries[currentLocale()];
}
