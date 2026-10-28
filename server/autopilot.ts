import type { SupabaseClient } from '@supabase/supabase-js';
import { reportError } from './sentry.js';
import { canonicalAppUrl, isConfiguredKey } from './http.js';
import {
  buildGrokPrompt,
  buildPinConceptMessages,
  CONCEPT_LANGUAGE_NAMES,
  CONCEPT_MAX_TOKENS,
  CONCEPT_TEXT_MODEL,
  extractJsonObject,
  sanitizePinTitle,
  shortBusinessHook,
  type ConceptLocale,
  type PinConcept,
} from './pinConcept.js';

/**
 * Server-side autopilot: fills every enabled account's calendar from the cron,
 * so nobody needs to keep a dashboard tab open.
 *
 * Runs inside Vercel functions: must not import anything from `src/`.
 * Cost control happens in the database (consume_quota_for, plan trigger).
 */

const PIN_IMAGES_BUCKET = 'pin-images';
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const SLOT_WINDOW_MS = 45 * 60 * 1000;
/** Conservative estimate of one text + image generation; used to stop before the function times out. */
const GENERATION_RESERVE_MS = 38_000;
const LEASE_SECONDS = 120;
const DEFAULT_TIMEZONE = 'Europe/Paris';
const DEFAULT_POSTING_HOURS = [9, 13, 19];

export interface ServerAutopilotSettings {
  enabled: boolean;
  business: string;
  websiteUrl: string;
  productOrOffer: string;
  audience: string;
  niche: string;
  tone: string;
  postsPerDay: number;
  postingHours: number[];
  lookAheadDays: number;
  language: ConceptLocale;
  timezone: string;
  lastRunAt: string | null;
  lastGeneratedAt: string | null;
  totalGenerated: number;
}

interface AccountRow {
  user_id: string;
  plan: string;
  settings: Record<string, unknown> | null;
}

interface Candidate {
  userId: string;
  plan: string;
  settings: ServerAutopilotSettings;
  nextSlot: Date;
}

export interface AutopilotRunSummary {
  accounts: number;
  candidates: number;
  generated: number;
  skipped: Record<string, number>;
  errors: number;
  elapsedMs: number;
}

function isValidTimeZone(tz: unknown): tz is string {
  if (typeof tz !== 'string' || !tz) return false;
  try {
    new Intl.DateTimeFormat('en-US', { timeZone: tz });
    return true;
  } catch {
    return false;
  }
}

export function normalizeServerSettings(raw: Record<string, unknown> | null): ServerAutopilotSettings {
  const src = raw ?? {};
  const hoursRaw = Array.isArray(src.postingHours) ? src.postingHours : DEFAULT_POSTING_HOURS;
  const hours = [...new Set(hoursRaw.map((h) => Number(h)))]
    .filter((h) => Number.isInteger(h) && h >= 0 && h <= 23)
    .sort((a, b) => a - b);
  const language = (['fr', 'en', 'es', 'de'] as const).includes(src.language as ConceptLocale)
    ? (src.language as ConceptLocale)
    : 'fr';
  const text = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  return {
    enabled: src.enabled === true,
    business: text(src.business),
    websiteUrl: text(src.websiteUrl),
    productOrOffer: text(src.productOrOffer),
    audience: text(src.audience),
    niche: text(src.niche),
    tone: text(src.tone) || 'inspiring',
    postsPerDay: Math.min(10, Math.max(1, Number(src.postsPerDay) || 3)),
    postingHours: hours.length ? hours : [...DEFAULT_POSTING_HOURS],
    lookAheadDays: Math.min(30, Math.max(1, Number(src.lookAheadDays) || 7)),
    language,
    timezone: isValidTimeZone(src.timezone) ? src.timezone : DEFAULT_TIMEZONE,
    lastRunAt: typeof src.lastRunAt === 'string' ? src.lastRunAt : null,
    lastGeneratedAt: typeof src.lastGeneratedAt === 'string' ? src.lastGeneratedAt : null,
    totalGenerated: Math.max(0, Number(src.totalGenerated) || 0),
  };
}

// ---------------------------------------------------------------------------
// Time zone helpers (no dependency): wall-clock → UTC instant in a given zone.

interface WallClock {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
}

function wallClockIn(date: Date, timeZone: string): WallClock {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  }).formatToParts(date);
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return { year: get('year'), month: get('month'), day: get('day'), hour: get('hour') % 24, minute: get('minute') };
}

/** Instant at which the given zone's wall clock reads `wall` (handles DST by iterating once). */
export function zonedTimeToUtc(wall: WallClock, timeZone: string): Date {
  const asUtc = Date.UTC(wall.year, wall.month - 1, wall.day, wall.hour, wall.minute);
  let guess = asUtc;
  for (let i = 0; i < 2; i++) {
    const seen = wallClockIn(new Date(guess), timeZone);
    const seenUtc = Date.UTC(seen.year, seen.month - 1, seen.day, seen.hour, seen.minute);
    const diff = asUtc - seenUtc;
    if (diff === 0) break;
    guess += diff;
  }
  return new Date(guess);
}

/** Upcoming publication slots, computed in the account's time zone (mirrors the browser logic). */
export function upcomingSlots(settings: ServerAutopilotSettings, from = new Date()): Date[] {
  const slots: Date[] = [];
  const today = wallClockIn(from, settings.timezone);
  for (let d = 0; d < settings.lookAheadDays; d++) {
    // Date.UTC normalises day overflow (e.g. 31 + 1 → next month).
    const dayUtc = new Date(Date.UTC(today.year, today.month - 1, today.day + d));
    let posted = 0;
    for (const hour of settings.postingHours) {
      if (posted >= settings.postsPerDay) break;
      const slot = zonedTimeToUtc(
        { year: dayUtc.getUTCFullYear(), month: dayUtc.getUTCMonth() + 1, day: dayUtc.getUTCDate(), hour, minute: 0 },
        settings.timezone
      );
      if (slot.getTime() > from.getTime()) {
        slots.push(slot);
        posted++;
      }
    }
  }
  return slots;
}

function slotTaken(scheduled: Array<{ scheduled_at: string | null }>, slot: Date): boolean {
  const t = slot.getTime();
  return scheduled.some((pin) => pin.scheduled_at && Math.abs(new Date(pin.scheduled_at).getTime() - t) < SLOT_WINDOW_MS);
}

// ---------------------------------------------------------------------------
// AI calls (direct, server-side; same models and prompts as the browser).

async function generateConcept(settings: ServerAutopilotSettings, userId: string): Promise<PinConcept> {
  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) throw new Error('TEXT_AI_DISABLED');
  const lang = CONCEPT_LANGUAGE_NAMES[settings.language];
  const messages = buildPinConceptMessages(
    {
      business: settings.business,
      productOrOffer: settings.productOrOffer || undefined,
      audience: settings.audience || undefined,
      niche: settings.niche || undefined,
      tone: settings.tone || undefined,
      websiteUrl: settings.websiteUrl || undefined,
    },
    lang
  );
  const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': canonicalAppUrl(),
      'X-OpenRouter-Title': 'GenX Autopilot',
      'X-User-Id': userId,
    },
    body: JSON.stringify({
      model: CONCEPT_TEXT_MODEL,
      messages,
      max_tokens: CONCEPT_MAX_TOKENS,
      temperature: 0.9,
      response_format: { type: 'json_object' },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  if (!res.ok) {
    console.error('[autopilot] text', res.status, (await res.text().catch(() => '')).slice(0, 200));
    throw new Error('La génération du texte a échoué.');
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error('La génération du texte n’a rien renvoyé.');
  const parsed = JSON.parse(extractJsonObject(content)) as Partial<PinConcept>;
  const title = sanitizePinTitle(parsed.title, settings.business);
  const hook = shortBusinessHook(settings.business);
  return {
    imagePrompt:
      (typeof parsed.imagePrompt === 'string' && parsed.imagePrompt.trim()) ||
      `Vertical Pinterest-style lifestyle photo related to ${hook}, bright lighting, professional marketing aesthetic`,
    overlayText: '',
    title,
    description: (typeof parsed.description === 'string' && parsed.description.trim().slice(0, 500)) || title,
    hashtags: Array.isArray(parsed.hashtags)
      ? parsed.hashtags.filter((h): h is string => typeof h === 'string').slice(0, 5)
      : ['#pinterest'],
    altText: (typeof parsed.altText === 'string' && parsed.altText.trim().slice(0, 500)) || title,
  };
}

async function generateImageUrl(imagePrompt: string): Promise<string> {
  const apiKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) throw new Error('IMAGE_AI_DISABLED');
  const res = await fetch('https://api.x.ai/v1/images/generations', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    // No overlay text server-side (no canvas): the image stays clean, the hook lives in the title.
    body: JSON.stringify({ model: 'grok-imagine-image-quality', prompt: buildGrokPrompt(imagePrompt) }),
    signal: AbortSignal.timeout(45_000),
  });
  if (!res.ok) {
    console.error('[autopilot] image', res.status, (await res.text().catch(() => '')).slice(0, 200));
    throw new Error('La génération de l’image a échoué.');
  }
  const data = (await res.json()) as { data?: Array<{ url?: string }> };
  const url = data.data?.[0]?.url;
  if (!url || !/^https:\/\//i.test(url)) throw new Error('La génération de l’image n’a rien renvoyé.');
  return url;
}

/** Copies the (short-lived) generated image into Supabase Storage under the user's folder. */
async function storeImage(client: SupabaseClient, userId: string, remoteUrl: string): Promise<string> {
  const res = await fetch(remoteUrl, { signal: AbortSignal.timeout(15_000), headers: { Accept: 'image/*' } });
  if (!res.ok) throw new Error(`image download failed (${res.status})`);
  const contentType = (res.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
  const mime = contentType === 'image/png' || contentType === 'image/webp' ? contentType : 'image/jpeg';
  const buffer = Buffer.from(await res.arrayBuffer());
  if (buffer.length === 0 || buffer.length > MAX_IMAGE_BYTES) throw new Error(`image size not allowed (${buffer.length})`);
  const ext = mime === 'image/png' ? 'png' : mime === 'image/webp' ? 'webp' : 'jpg';
  const path = `${userId}/${Date.now()}-${crypto.randomUUID()}.${ext}`;
  const { error } = await client.storage
    .from(PIN_IMAGES_BUCKET)
    .upload(path, buffer, { contentType: mime, cacheControl: '31536000', upsert: false });
  if (error) throw new Error(`storage upload failed: ${error.message}`);
  const { data } = client.storage.from(PIN_IMAGES_BUCKET).getPublicUrl(path);
  if (!data.publicUrl) throw new Error('storage returned no public URL');
  return data.publicUrl;
}

// ---------------------------------------------------------------------------

interface QuotaReply {
  allowed?: boolean;
  scope?: string;
}

async function consumeFor(client: SupabaseClient, userId: string, kind: 'ai_text' | 'ai_image'): Promise<string | null> {
  const { data, error } = await client.rpc('consume_quota_for', { p_user: userId, p_kind: kind });
  if (error) throw new Error(`consume_quota_for failed: ${error.message}`);
  const reply = (data ?? {}) as QuotaReply;
  if (reply.allowed === false) return `quota_${reply.scope || 'day'}`;
  return null;
}

async function claimLease(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await client.rpc('claim_autopilot_lease', { p_user: userId, p_seconds: LEASE_SECONDS });
  if (error) throw new Error(`claim_autopilot_lease failed: ${error.message}`);
  return data === true;
}

async function releaseLease(client: SupabaseClient, userId: string): Promise<void> {
  await client.rpc('release_autopilot_lease', { p_user: userId }).then(() => undefined, () => undefined);
}

async function stillEnabled(client: SupabaseClient, userId: string): Promise<boolean> {
  const { data, error } = await client.rpc('autopilot_enabled_for', { p_user: userId });
  return !error && data === true;
}

async function recordStats(client: SupabaseClient, userId: string, generated: number): Promise<void> {
  const { data, error } = await client.auth.admin.getUserById(userId);
  if (error || !data.user) return;
  const current = (data.user.user_metadata as Record<string, unknown> | undefined)?.autopilot;
  if (!current || typeof current !== 'object') return;
  const now = new Date().toISOString();
  const previousTotal = Number((current as { totalGenerated?: unknown }).totalGenerated) || 0;
  await client.auth.admin.updateUserById(userId, {
    user_metadata: {
      autopilot: { ...(current as Record<string, unknown>), lastRunAt: now, lastGeneratedAt: now, totalGenerated: previousTotal + generated },
    },
  });
}

/** Generates exactly one pin for the candidate's next missing slot. Returns a skip reason or null on success. */
async function generateOne(client: SupabaseClient, candidate: Candidate): Promise<string | null> {
  const { userId, settings, nextSlot } = candidate;

  const textQuota = await consumeFor(client, userId, 'ai_text');
  if (textQuota) return textQuota;
  const concept = await generateConcept(settings, userId);

  const imageQuota = await consumeFor(client, userId, 'ai_image');
  if (imageQuota) return imageQuota;
  const remoteUrl = await generateImageUrl(concept.imagePrompt);

  // Generation takes a while: drop the result if the switch was flipped meanwhile.
  if (!(await stillEnabled(client, userId))) return 'disabled';
  const imageUrl = await storeImage(client, userId, remoteUrl);

  const { error } = await client.from('pins').insert({
    user_id: userId,
    source: 'autopilot',
    title: concept.title,
    description: concept.description,
    image_url: imageUrl,
    link: settings.websiteUrl || null,
    board_id: null,
    board_name: settings.niche || 'Autopilot',
    status: 'scheduled',
    scheduled_at: nextSlot.toISOString(),
    published_at: null,
    pinterest_pin_id: null,
    hashtags: concept.hashtags,
    alt_text: concept.altText,
    retry_count: 0,
    error_message: null,
  });
  if (error) {
    const message = error.message || '';
    if (message.includes('AUTOPILOT_DISABLED')) return 'disabled';
    if (message.includes('AUTOPILOT_REQUIRES_PRO')) return 'requires_pro';
    if (message.includes('AUTOPILOT_DAILY_LIMIT')) return 'daily_limit';
    if (message.includes('PIN_LIMIT_REACHED')) return 'pin_limit';
    throw new Error(`pin insert failed: ${message}`);
  }
  await recordStats(client, userId, 1).catch(() => undefined);
  return null;
}

async function loadCandidates(client: SupabaseClient, now: Date): Promise<{ accounts: number; candidates: Candidate[] }> {
  const { data, error } = await client.rpc('autopilot_accounts');
  if (error) throw new Error(`autopilot_accounts failed: ${error.message}`);
  const rows = (data ?? []) as AccountRow[];
  const candidates: Candidate[] = [];

  for (const row of rows) {
    const settings = normalizeServerSettings(row.settings);
    if (!settings.enabled || !settings.business) continue;

    const horizon = new Date(now.getTime() + settings.lookAheadDays * 24 * 3600 * 1000);
    const { data: scheduled, error: pinsError } = await client
      .from('pins')
      .select('scheduled_at')
      .eq('user_id', row.user_id)
      .eq('status', 'scheduled')
      .gte('scheduled_at', now.toISOString())
      .lte('scheduled_at', horizon.toISOString());
    if (pinsError) continue;

    const missing = upcomingSlots(settings, now).filter((slot) => !slotTaken(scheduled ?? [], slot));
    if (missing.length === 0) continue;
    candidates.push({ userId: row.user_id, plan: row.plan, settings, nextSlot: missing[0] });
  }

  // Most urgent slot first so a busy cron still serves the pins due soonest.
  candidates.sort((a, b) => a.nextSlot.getTime() - b.nextSlot.getTime());
  return { accounts: rows.length, candidates };
}

/**
 * One cron tick: generates at most one pin per account, most urgent first,
 * until `deadlineMs` would be exceeded. Each run is small and idempotent; the
 * 5-minute cadence does the rest.
 */
export async function runServerAutopilot(client: SupabaseClient, deadlineMs: number): Promise<AutopilotRunSummary> {
  const startedAt = Date.now();
  const now = new Date();
  const summary: AutopilotRunSummary = { accounts: 0, candidates: 0, generated: 0, skipped: {}, errors: 0, elapsedMs: 0 };
  const skip = (reason: string) => {
    summary.skipped[reason] = (summary.skipped[reason] ?? 0) + 1;
  };

  const { accounts, candidates } = await loadCandidates(client, now);
  summary.accounts = accounts;
  summary.candidates = candidates.length;

  for (const candidate of candidates) {
    if (Date.now() + GENERATION_RESERVE_MS > deadlineMs) {
      skip('out_of_time');
      continue;
    }
    let leased = false;
    try {
      leased = await claimLease(client, candidate.userId);
      if (!leased) {
        skip('busy');
        continue;
      }
      const reason = await generateOne(client, candidate);
      if (reason) skip(reason);
      else summary.generated++;
    } catch (error) {
      summary.errors++;
      console.error(`[autopilot] user ${candidate.userId} failed:`, error);
      await reportError(error, { route: 'cron/autopilot', userId: candidate.userId, tags: { plan: candidate.plan } });
    } finally {
      if (leased) await releaseLease(client, candidate.userId);
    }
  }

  summary.elapsedMs = Date.now() - startedAt;
  return summary;
}
