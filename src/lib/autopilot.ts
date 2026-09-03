import { supabase, type Pin } from './supabase';
import { generateBusinessPin } from './ai';

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

function storageKey(userId: string): string {
  return `pingen_autopilot_${userId}`;
}

export function getAutopilotSettings(userId: string): AutopilotSettings {
  try {
    const raw = localStorage.getItem(storageKey(userId));
    if (!raw) return { ...DEFAULT_AUTOPILOT };
    const parsed = JSON.parse(raw) as Partial<AutopilotSettings>;
    return {
      ...DEFAULT_AUTOPILOT,
      ...parsed,
      postingHours:
        Array.isArray(parsed.postingHours) && parsed.postingHours.length > 0
          ? parsed.postingHours.map((h) => Number(h)).filter((h) => h >= 0 && h <= 23)
          : [...DEFAULT_POSTING_HOURS],
    };
  } catch {
    return { ...DEFAULT_AUTOPILOT };
  }
}

export function saveAutopilotSettings(
  userId: string,
  settings: AutopilotSettings
): AutopilotSettings {
  const normalized: AutopilotSettings = {
    ...settings,
    business: settings.business.trim(),
    websiteUrl: settings.websiteUrl.trim(),
    productOrOffer: settings.productOrOffer.trim(),
    audience: settings.audience.trim(),
    niche: settings.niche.trim(),
    postsPerDay: Math.min(5, Math.max(1, settings.postsPerDay || 1)),
    lookAheadDays: Math.min(14, Math.max(1, settings.lookAheadDays || 7)),
    postingHours: [...new Set(settings.postingHours)]
      .filter((h) => h >= 0 && h <= 23)
      .sort((a, b) => a - b)
      .slice(0, 8),
  };
  if (normalized.postingHours.length === 0) {
    normalized.postingHours = [...DEFAULT_POSTING_HOURS];
  }
  localStorage.setItem(storageKey(userId), JSON.stringify(normalized));
  return normalized;
}

export function validateAutopilotForEnable(settings: AutopilotSettings): string | null {
  if (!settings.business.trim()) {
    return 'Décrivez votre business pour activer l\'autopilote.';
  }
  if (settings.postingHours.length === 0) {
    return 'Choisissez au moins une heure de publication.';
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
  maxToGenerate = 1
): Promise<AutopilotRunResult> {
  const settings = getAutopilotSettings(userId);

  if (!settings.enabled) {
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
    saveAutopilotSettings(userId, {
      ...settings,
      lastRunAt: new Date().toISOString(),
    });
    return { skipped: true, reason: 'calendar_full', generated: 0, nextSlot: null };
  }

  let generated = 0;
  const slotsToFill = missingSlots.slice(0, maxToGenerate);

  for (const slot of slotsToFill) {
    const pinPayload = await createAutopilotPinContent(settings);

    const { error: insertError } = await supabase.from('pins').insert([
      {
        user_id: userId,
        title: pinPayload.title,
        description: pinPayload.description,
        image_url: pinPayload.imageUrl,
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
      throw new Error(insertError.message || 'Impossible de créer le pin autopilote');
    }

    generated++;
  }

  const updated = saveAutopilotSettings(userId, {
    ...settings,
    lastRunAt: new Date().toISOString(),
    lastGeneratedAt: new Date().toISOString(),
    totalGenerated: settings.totalGenerated + generated,
  });

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
  });
  if (settings.websiteUrl) {
    pin.description = `${pin.description} Découvrez plus sur ${settings.websiteUrl}`;
  }
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
