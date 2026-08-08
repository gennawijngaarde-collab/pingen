import type { AppLocale } from './types';

const STORAGE_KEY = 'pingen_locale';

/** Fuseaux horaires → langue probable (approximation pays) */
const TIMEZONE_LOCALE: Record<string, AppLocale> = {
  'Europe/Paris': 'fr',
  'Europe/Brussels': 'fr',
  'Europe/Luxembourg': 'fr',
  'Europe/Monaco': 'fr',
  'Africa/Casablanca': 'fr',
  'America/Martinique': 'fr',
  'America/Guadeloupe': 'fr',
  'Indian/Reunion': 'fr',
  'Europe/Madrid': 'es',
  'Europe/Barcelona': 'es',
  'America/Mexico_City': 'es',
  'America/Bogota': 'es',
  'America/Argentina/Buenos_Aires': 'es',
  'America/Santiago': 'es',
  'America/Lima': 'es',
  'Europe/Berlin': 'de',
  'Europe/Vienna': 'de',
  'Europe/Zurich': 'de',
  'Europe/London': 'en',
  'America/New_York': 'en',
  'America/Chicago': 'en',
  'America/Los_Angeles': 'en',
  'America/Toronto': 'en',
  'Australia/Sydney': 'en',
};

function fromLanguageTag(tag: string): AppLocale | null {
  const lower = tag.toLowerCase();
  if (lower.startsWith('fr')) return 'fr';
  if (lower.startsWith('es')) return 'es';
  if (lower.startsWith('de')) return 'de';
  if (lower.startsWith('en')) return 'en';
  return null;
}

/**
 * Détecte la langue :
 * 1. Choix utilisateur (localStorage)
 * 2. Langues du navigateur (souvent liées au pays / OS)
 * 3. Fuseau horaire (indice pays)
 * 4. Fallback anglais
 */
export function detectLocale(): AppLocale {
  if (typeof window === 'undefined') return 'en';

  try {
    const saved = localStorage.getItem(STORAGE_KEY) as AppLocale | null;
    if (saved && ['fr', 'en', 'es', 'de'].includes(saved)) {
      return saved;
    }
  } catch {
    /* ignore */
  }

  const languages = [
    ...(navigator.languages || []),
    navigator.language,
  ].filter(Boolean);

  for (const lang of languages) {
    const match = fromLanguageTag(lang);
    if (match) return match;
  }

  try {
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (tz && TIMEZONE_LOCALE[tz]) {
      return TIMEZONE_LOCALE[tz];
    }
  } catch {
    /* ignore */
  }

  return 'en';
}

export function persistLocale(locale: AppLocale): void {
  try {
    localStorage.setItem(STORAGE_KEY, locale);
  } catch {
    /* ignore */
  }
}

export function clearPersistedLocale(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* ignore */
  }
}
