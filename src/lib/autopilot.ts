import { supabase, isDemoMode, type Pin } from './supabase';
import { generateBusinessPin } from './ai';
import { persistPinImage } from './pinStorage';
import { currentLocale, isAppLocale } from '@/i18n/current';
import type { AppLocale } from '@/i18n/types';

export interface AutopilotSettings {
  enabled: boolean;
  business: string;
  websiteUrl: string;
  productOrOffer: string;
  audience: string;
  niche: string;
  tone: string;
  /** Nombre de pins à publier par jour */
  postsPerDay: number;
  /** Heures locales (0–23), ex. [9, 13, 19] */
  postingHours: number[];
  /** Remplir le calendrier sur N jours à l'avance */
  lookAheadDays: number;
  /** Language of generated texts; the UI language at the time of saving. */
  language?: AppLocale;
  lastRunAt: string | null;
  lastGeneratedAt: string | null;
  totalGenerated: number;
}

export const DEFAULT_POSTING_HOURS = [9, 13, 19];

export const DEFAULT_AUTOPILOT: AutopilotSettings = {
  enabled: false,
  business: '',
  websiteUrl: '',
  productOrOffer: '',
  audience: '',
  niche: '',
  tone: 'inspiring',
  postsPerDay: 3,
  postingHours: [...DEFAULT_POSTING_HOURS],
  lookAheadDays: 7,
  lastRunAt: null,
  lastGeneratedAt: null,
  totalGenerated: 0,
};

/**
 * Persistence model: the account's settings live in Supabase Auth
 * `user_metadata.autopilot` so every device/browser sees the same on/off state.
 * localStorage is only a per-device cache (and the store in demo mode).
 */
const METADATA_KEY = 'autopilot';

function storageKey(userId: string): string {
  return `pingen_autopilot_${userId}`;
}

function normalizeSettings(parsed: Partial<AutopilotSettings> | null | undefined): AutopilotSettings {
  const source = parsed && typeof parsed === 'object' ? parsed : {};
  const hours = Array.isArray(source.postingHours)
    ? [...new Set(source.postingHours.map((h) => Number(h)))]
        .filter((h) => Number.isInteger(h) && h >= 0 && h <= 23)
        .sort((a, b) => a - b)
        .slice(0, 8)
    : [];
  const str = (value: unknown, max = 500) => (typeof value === 'string' ? value.trim().slice(0, max) : '');
  const num = (value: unknown, fallback: number) => (typeof value === 'number' && Number.isFinite(value) ? value : fallback);
  return {
    enabled: source.enabled === true,
    business: str(source.business, 1000),
    websiteUrl: str(source.websiteUrl),
    productOrOffer: str(source.productOrOffer),
    audience: str(source.audience),
    niche: str(source.niche, 100),
    tone: str(source.tone, 50) || DEFAULT_AUTOPILOT.tone,
    postsPerDay: Math.min(5, Math.max(1, Math.round(num(source.postsPerDay, DEFAULT_AUTOPILOT.postsPerDay)))),
    postingHours: hours.length > 0 ? hours : [...DEFAULT_POSTING_HOURS],
    lookAheadDays: Math.min(14, Math.max(1, Math.round(num(source.lookAheadDays, DEFAULT_AUTOPILOT.lookAheadDays)))),
    language: isAppLocale(source.language) ? source.language : undefined,
    lastRunAt: typeof source.lastRunAt === 'string' ? source.lastRunAt : null,
    lastGeneratedAt: typeof source.lastGeneratedAt === 'string' ? source.lastGeneratedAt : null,
    totalGenerated: Math.max(0, Math.round(num(source.totalGenerated, 0))),
  };
}

function readLocal(userId: string): AutopilotSettings | null {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    return raw ? normalizeSettings(JSON.parse(raw) as Partial<AutopilotSettings>) : null;
  } catch {
    return null;
  }
}

function writeLocal(userId: string, settings: AutopilotSettings): void {
  try {
    localStorage.setItem(storageKey(userId), JSON.stringify(settings));
  } catch {
    // Storage full or disabled: the server copy is the source of truth anyway.
  }
}

async function writeRemote(settings: AutopilotSettings): Promise<void> {
  const { error } = await supabase.auth.updateUser({ data: { [METADATA_KEY]: settings } });
  if (error) throw new Error(error.message || 'Unable to save autopilot settings');
}

/** Cached copy for synchronous UI (banner); prefer `loadAutopilotSettings`. */
export function getAutopilotSettings(userId: string): AutopilotSettings {
  return readLocal(userId) ?? { ...DEFAULT_AUTOPILOT };
}

/**
 * Loads the account's settings from the server (falls back to the device cache
 * offline). A pre-existing device-only configuration is promoted to the account
 * the first time no server copy exists.
 */
export async function loadAutopilotSettings(userId: string): Promise<AutopilotSettings> {
  const local = readLocal(userId);
  if (isDemoMode) return local ?? { ...DEFAULT_AUTOPILOT };

  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== userId) {
    return local ?? { ...DEFAULT_AUTOPILOT };
  }
  const remote = (data.user.user_metadata as Record<string, unknown> | undefined)?.[METADATA_KEY];
  if (remote && typeof remote === 'object') {
    const settings = normalizeSettings(remote as Partial<AutopilotSettings>);
    writeLocal(userId, settings);
    return settings;
  }
  if (local) {
    // Keep the device's configuration but never switch the account on implicitly.
    const promoted = { ...local, enabled: false };
    await writeRemote(promoted).catch(() => undefined);
    writeLocal(userId, promoted);
    return promoted;
  }
  return { ...DEFAULT_AUTOPILOT };
}

/** Fresh read of the on/off switch from the account (no cache). */
export async function isAutopilotEnabled(userId: string): Promise<boolean> {
  if (isDemoMode) return readLocal(userId)?.enabled === true;
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user || data.user.id !== userId) return false;
  const remote = (data.user.user_metadata as Record<string, unknown> | undefined)?.[METADATA_KEY];
  return !!remote && typeof remote === 'object' && (remote as { enabled?: unknown }).enabled === true;
}

/** Scheduled pins generated by the autopilot that have not been published yet. */
export async function countPendingAutopilotPins(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('pins')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', userId)
    .eq('source', 'autopilot')
    .eq('status', 'scheduled');
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function deletePendingAutopilotPins(userId: string): Promise<number> {
  const { data, error } = await supabase
    .from('pins')
    .delete()
    .eq('user_id', userId)
    .eq('source', 'autopilot')
    .eq('status', 'scheduled')
    .select('id');
  if (error) throw new Error(error.message);
  return data?.length ?? 0;
}

/**
 * Runs `fn` only if no other tab/window of this browser is running the
 * autopilot right now (Web Locks); falls back to running directly.
 */
async function withBrowserLock<T>(fn: () => Promise<T>, skipped: T): Promise<T> {
  const locks = typeof navigator !== 'undefined' ? navigator.locks : undefined;
  if (!locks) return fn();
  const result = await locks.request('pingen-autopilot', { ifAvailable: true }, async (lock) =>
    lock ? fn() : skipped
  );
  return result as T;
}

export async function saveAutopilotSettings(
  userId: string,
  settings: AutopilotSettings
): Promise<AutopilotSettings> {
  const normalized = normalizeSettings({ ...settings, language: settings.language ?? currentLocale() });
  if (!isDemoMode) await writeRemote(normalized);
  writeLocal(userId, normalized);
  return normalized;
}

export function validateAutopilotForEnable(settings: AutopilotSettings): string | null {
  if (!settings.business.trim()) {
    return 'BUSINESS_REQUIRED';
  }
  if (settings.postingHours.length === 0) {
    return 'HOURS_REQUIRED';
  }
  return null;
}

/** Créneaux futurs selon horaires + posts/jour + lookahead */
export function getUpcomingAutopilotSlots(settings: AutopilotSettings, from = new Date()): Date[] {
  const hours = [...settings.postingHours].sort((a, b) => a - b);
  const slots: Date[] = [];
  const now = from.getTime();

  for (let d = 0; d < settings.lookAheadDays; d++) {
    const day = new Date(from);
    day.setDate(day.getDate() + d);
    let posted = 0;

    for (const hour of hours) {
      if (posted >= settings.postsPerDay) break;
      const slot = new Date(day);
      slot.setHours(hour, 0, 0, 0);
      if (slot.getTime() > now) {
        slots.push(slot);
        posted++;
      }
    }
  }

  return slots;
}

function slotTaken(scheduledPins: Pin[], slot: Date, windowMinutes = 45): boolean {
  const t = slot.getTime();
  const windowMs = windowMinutes * 60 * 1000;
  return scheduledPins.some((pin) => {
    if (!pin.scheduled_at) return false;
    const pinTime = new Date(pin.scheduled_at).getTime();
    return Math.abs(pinTime - t) < windowMs;
  });
}

export interface AutopilotRunResult {
  skipped: boolean;
  reason?: string;
  generated: number;
  nextSlot: string | null;
}

/**
 * Remplit le calendrier : génère au plus `maxToGenerate` pins manquants
 * et les planifie aux créneaux définis.
 */
export async function processAutopilot(
  userId: string,
  maxToGenerate = 1,
  options: { force?: boolean } = {}
): Promise<AutopilotRunResult> {
  return withBrowserLock(() => runAutopilot(userId, maxToGenerate, options), {
    skipped: true,
    reason: 'busy',
    generated: 0,
    nextSlot: null,
  });
}

async function runAutopilot(
  userId: string,
  maxToGenerate: number,
  options: { force?: boolean }
): Promise<AutopilotRunResult> {
  const settings = await loadAutopilotSettings(userId);

  // `force` = explicit "generate now" click; it never switches the autopilot on.
  if (!settings.enabled && !options.force) {
    return { skipped: true, reason: 'disabled', generated: 0, nextSlot: null };
  }

  const validationError = validateAutopilotForEnable(settings);
  if (validationError) {
    return { skipped: true, reason: validationError, generated: 0, nextSlot: null };
  }

  const nowIso = new Date().toISOString();
  const horizon = new Date();
  horizon.setDate(horizon.getDate() + settings.lookAheadDays);

  const { data: existing, error } = await supabase
    .from('pins')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', nowIso)
    .lte('scheduled_at', horizon.toISOString());

  if (error) {
    throw new Error(error.message || 'Impossible de lire les pins planifiés');
  }

  const scheduledPins = (existing || []) as Pin[];
  const missingSlots = getUpcomingAutopilotSlots(settings).filter(
    (slot) => !slotTaken(scheduledPins, slot)
  );

  if (missingSlots.length === 0) {
    // Run timestamps are device-local; only generation stats go to the account.
    writeLocal(userId, { ...settings, lastRunAt: new Date().toISOString() });
    return { skipped: true, reason: 'calendar_full', generated: 0, nextSlot: null };
  }

  let generated = 0;
  const slotsToFill = missingSlots.slice(0, maxToGenerate);

  for (const slot of slotsToFill) {
    const pinPayload = await createAutopilotPinContent(settings);

    // Generation takes a while: if the autopilot was switched off meanwhile, drop the result.
    if (!options.force && !(await isAutopilotEnabled(userId))) {
      return { skipped: true, reason: 'disabled', generated, nextSlot: null };
    }
    const imageUrl = await persistPinImage(pinPayload.imageUrl, userId);

    const { error: insertError } = await supabase.from('pins').insert([
      {
        user_id: userId,
        source: options.force ? 'autopilot_manual' : 'autopilot',
        title: pinPayload.title,
        description: pinPayload.description,
        image_url: imageUrl,
        link: settings.websiteUrl || null,
        board_id: null,
        board_name: settings.niche || 'Autopilote',
        status: 'scheduled',
        scheduled_at: slot.toISOString(),
        published_at: null,
        pinterest_pin_id: null,
        hashtags: pinPayload.hashtags,
        alt_text: pinPayload.altText,
        retry_count: 0,
        error_message: null,
      },
    ]);

    if (insertError) {
      // Database guard: the account's autopilot is off (stale client state).
      if (insertError.message?.includes('AUTOPILOT_DISABLED')) {
        writeLocal(userId, { ...settings, enabled: false });
        return { skipped: true, reason: 'disabled', generated, nextSlot: null };
      }
      throw new Error(insertError.message || 'Impossible de créer le pin autopilote');
    }

    generated++;
  }

  // Re-read before writing stats so a toggle made meanwhile on another device is not undone.
  const latest = await loadAutopilotSettings(userId);
  const updated = await saveAutopilotSettings(userId, {
    ...latest,
    lastRunAt: new Date().toISOString(),
    lastGeneratedAt: new Date().toISOString(),
    totalGenerated: latest.totalGenerated + generated,
  }).catch(() => ({ ...settings, totalGenerated: settings.totalGenerated + generated }));

  const remaining = getUpcomingAutopilotSlots(updated).filter((slot) => {
    // Approximate: after insert we don't re-fetch; next slot is first missing after filled
    return missingSlots.slice(generated).some((s) => s.getTime() === slot.getTime()) ||
      missingSlots[generated]?.getTime() === slot.getTime();
  });

  return {
    skipped: false,
    generated,
    nextSlot: missingSlots[generated]?.toISOString() || remaining[0]?.toISOString() || null,
  };
}

async function createAutopilotPinContent(settings: AutopilotSettings) {
  const pin = await generateBusinessPin({
    business: settings.business,
    productOrOffer: settings.productOrOffer || undefined,
    audience: settings.audience || undefined,
    niche: settings.niche || undefined,
    tone: settings.tone || undefined,
    websiteUrl: settings.websiteUrl || undefined,
    language: settings.language ?? currentLocale(),
  });
  return pin;
}

export function formatHourLabel(hour: number): string {
  return `${String(hour).padStart(2, '0')}:00`;
}

export function getAutopilotStatusSummary(userId: string): {
  enabled: boolean;
  business: string;
  postsPerDay: number;
  hoursLabel: string;
  totalGenerated: number;
  lastGeneratedAt: string | null;
} {
  const s = getAutopilotSettings(userId);
  return {
    enabled: s.enabled,
    business: s.business,
    postsPerDay: s.postsPerDay,
    hoursLabel: s.postingHours.map(formatHourLabel).join(', '),
    totalGenerated: s.totalGenerated,
    lastGeneratedAt: s.lastGeneratedAt,
  };
}
