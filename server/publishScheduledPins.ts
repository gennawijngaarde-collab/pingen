import { createClient, type SupabaseClient } from '@supabase/supabase-js';

/**
 * Server-side publication engine for scheduled pins.
 *
 * Runs inside Vercel serverless functions, so it must not import anything
 * from `src/` (that code relies on `import.meta.env` and `window`).
 */

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 15 * 60 * 1000;
const ACCESS_PENDING_RETRY_MS = 60 * 60 * 1000;

/**
 * Pinterest refuses production writes until the app is granted "Standard"
 * access. This is an account-level approval, not a pin problem, so affected
 * pins must stay scheduled (no retry budget consumed) and publish
 * automatically once access is granted.
 */
export const PINTEREST_ACCESS_PENDING_CODE = 'PINTEREST_ACCESS_PENDING';
export const PINTEREST_TRIAL_ACCESS_MESSAGE =
  `${PINTEREST_ACCESS_PENDING_CODE}: Pinterest app has Trial access; request Standard access on developers.pinterest.com. This pin will be published automatically once approved.`;

function isTrialAccessError(err: unknown): boolean {
  return err instanceof Error && /Trial access/i.test(err.message);
}
const PINTEREST_API = 'https://api.pinterest.com/v5';
const DEFAULT_APP_ID = '1609578';

interface PinRow {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  image_url: string;
  link: string | null;
  board_id: string | null;
  alt_text: string | null;
  retry_count: number | null;
  scheduled_at: string | null;
}

interface PinterestAccountRow {
  id: string;
  user_id: string;
  access_token: string;
  refresh_token: string | null;
  token_expires_at: string | null;
  boards: Array<{ id?: string }> | null;
  is_active: boolean | null;
}

export interface PublishResult {
  processed: number;
  successful: number;
  failed: number;
  /** Pins blocked only by the Pinterest app access level (still scheduled). */
  awaitingAccess: number;
  details: Array<{
    pinId: string;
    status: 'published' | 'retry' | 'failed' | 'awaiting_access';
    pinterestPinId?: string;
    error?: string;
  }>;
}

function env(...names: string[]): string {
  for (const name of names) {
    const value = (process.env[name] || '').trim();
    if (value) return value;
  }
  return '';
}

export function getSupabaseUrl(): string {
  return env('SUPABASE_URL', 'VITE_SUPABASE_URL');
}

export function getSupabaseAnonKey(): string {
  return env('SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');
}

export function getServiceRoleKey(): string {
  return env('SUPABASE_SERVICE_ROLE_KEY');
}

/** Client with full access (bypasses RLS) — used by the automated cron. */
export function createServiceClient(): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getServiceRoleKey();
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

/** Client acting as the signed-in user (RLS applies) — used by the in-app button. */
export function createUserClient(userJwt: string): SupabaseClient | null {
  const url = getSupabaseUrl();
  const key = getSupabaseAnonKey();
  if (!url || !key) return null;
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { headers: { Authorization: `Bearer ${userJwt}` } },
  });
}

async function refreshAccessToken(
  client: SupabaseClient,
  account: PinterestAccountRow
): Promise<string> {
  if (!account.refresh_token) {
    throw new Error('Pinterest token expired and no refresh token available. Reconnect Pinterest.');
  }
  const appId = env('VITE_PINTEREST_APP_ID', 'PINTEREST_APP_ID') || DEFAULT_APP_ID;
  const appSecret = env('PINTEREST_APP_SECRET', 'VITE_PINTEREST_APP_SECRET');
  if (!appSecret) {
    throw new Error('PINTEREST_APP_SECRET missing: cannot refresh Pinterest token.');
  }

  const params = new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token: account.refresh_token,
  });
  const basic = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  const res = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    message?: string;
  };
  if (!res.ok || !data.access_token) {
    throw new Error(`Pinterest token refresh failed: ${data.message || res.status}`);
  }

  const expiresAt = new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString();
  await client
    .from('pinterest_accounts')
    .update({
      access_token: data.access_token,
      refresh_token: data.refresh_token || account.refresh_token,
      token_expires_at: expiresAt,
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);

  return data.access_token;
}

async function resolveBoardId(accessToken: string, pin: PinRow, account: PinterestAccountRow): Promise<string> {
  if (pin.board_id) return pin.board_id;

  const cached = account.boards?.find((b) => b?.id)?.id;
  if (cached) return cached;

  const res = await fetch(`${PINTEREST_API}/boards?page_size=1`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  const data = (await res.json()) as { items?: Array<{ id: string }>; message?: string };
  const first = data.items?.[0]?.id;
  if (!res.ok || !first) {
    throw new Error(
      `No Pinterest board selected and none found on the account (${data.message || res.status}). Create a board on Pinterest first.`
    );
  }
  return first;
}

async function createPin(accessToken: string, pin: PinRow, boardId: string): Promise<string> {
  const res = await fetch(`${PINTEREST_API}/pins`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: pin.title,
      description: pin.description || undefined,
      link: pin.link || undefined,
      board_id: boardId,
      alt_text: pin.alt_text || pin.title,
      media_source: { source_type: 'image_url', url: pin.image_url },
    }),
  });
  const data = (await res.json()) as { id?: string; message?: string; code?: number };
  if (!res.ok || !data.id) {
    throw new Error(`Pinterest API error ${res.status}: ${data.message || 'unknown error'}`);
  }
  return data.id;
}

async function publishOne(client: SupabaseClient, pin: PinRow, account: PinterestAccountRow): Promise<string> {
  let accessToken = account.access_token;
  const expired = account.token_expires_at ? new Date(account.token_expires_at) <= new Date() : false;
  if (expired) {
    accessToken = await refreshAccessToken(client, account);
  }

  const boardId = await resolveBoardId(accessToken, pin, account);

  let pinterestPinId: string;
  try {
    pinterestPinId = await createPin(accessToken, pin, boardId);
  } catch (err) {
    // Token may be invalid despite a future expiry: refresh once and retry.
    if (!expired && err instanceof Error && err.message.includes('401') && account.refresh_token) {
      accessToken = await refreshAccessToken(client, account);
      pinterestPinId = await createPin(accessToken, pin, boardId);
    } else {
      throw err;
    }
  }

  const { error } = await client
    .from('pins')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      pinterest_pin_id: pinterestPinId,
      board_id: boardId,
      error_message: null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', pin.id);
  if (error) throw new Error(`Pin published on Pinterest (${pinterestPinId}) but DB update failed: ${error.message}`);

  await client.rpc('increment_pin_count', { user_uuid: pin.user_id }).then(() => undefined, () => undefined);

  return pinterestPinId;
}

export interface PublishOptions {
  /** Publish only these pins, right now, regardless of their scheduled date. */
  pinIds?: string[];
  /** 'due' (default): only overdue pins. 'all': every scheduled pin, including future ones. */
  scope?: 'due' | 'all';
}

/**
 * Publish scheduled pins.
 * Default behaviour publishes every pin whose `scheduled_at` is in the past.
 * With a service-role client this covers all users; with a user client RLS
 * restricts it to that user's pins.
 */
export async function publishDuePins(
  client: SupabaseClient,
  options: PublishOptions = {}
): Promise<PublishResult> {
  const now = new Date().toISOString();
  let query = client
    .from('pins')
    .select('id, user_id, title, description, image_url, link, board_id, alt_text, retry_count, scheduled_at')
    .order('scheduled_at', { ascending: true })
    .limit(50);

  if (options.pinIds && options.pinIds.length > 0) {
    // Explicit request: allow re-publishing failed pins too.
    query = query.in('id', options.pinIds).in('status', ['scheduled', 'failed', 'draft']);
  } else if (options.scope === 'all') {
    query = query.eq('status', 'scheduled');
  } else {
    query = query.eq('status', 'scheduled').lte('scheduled_at', now);
  }

  const { data: pins, error } = await query;

  if (error) throw new Error(`Failed to load scheduled pins: ${error.message}`);

  const result: PublishResult = { processed: 0, successful: 0, failed: 0, awaitingAccess: 0, details: [] };
  if (!pins || pins.length === 0) return result;

  const userIds = Array.from(new Set(pins.map((p) => p.user_id)));
  const { data: accounts, error: accErr } = await client
    .from('pinterest_accounts')
    .select('id, user_id, access_token, refresh_token, token_expires_at, boards, is_active')
    .in('user_id', userIds)
    .order('updated_at', { ascending: false });
  if (accErr) throw new Error(`Failed to load Pinterest accounts: ${accErr.message}`);

  const accountByUser = new Map<string, PinterestAccountRow>();
  for (const acc of (accounts || []) as PinterestAccountRow[]) {
    if (acc.is_active === false) continue;
    if (!accountByUser.has(acc.user_id)) accountByUser.set(acc.user_id, acc);
  }

  for (const pin of pins as PinRow[]) {
    result.processed++;
    try {
      const account = accountByUser.get(pin.user_id);
      if (!account) throw new Error('No active Pinterest account connected. Connect Pinterest in Settings.');

      const pinterestPinId = await publishOne(client, pin, account);
      result.successful++;
      result.details.push({ pinId: pin.id, status: 'published', pinterestPinId });
    } catch (err) {
      if (isTrialAccessError(err)) {
        result.awaitingAccess++;
        // Keep the user's future schedule intact; only back off pins that are already due.
        const isDue = !pin.scheduled_at || pin.scheduled_at <= now;
        await client
          .from('pins')
          .update({
            ...(isDue && { scheduled_at: new Date(Date.now() + ACCESS_PENDING_RETRY_MS).toISOString() }),
            status: 'scheduled',
            error_message: PINTEREST_TRIAL_ACCESS_MESSAGE,
            updated_at: now,
          })
          .eq('id', pin.id);
        result.details.push({ pinId: pin.id, status: 'awaiting_access', error: PINTEREST_TRIAL_ACCESS_MESSAGE });
        continue;
      }

      result.failed++;
      const message = err instanceof Error ? err.message : 'Unknown error';
      const retryCount = (pin.retry_count || 0) + 1;

      if (retryCount >= MAX_RETRIES) {
        await client
          .from('pins')
          .update({ status: 'failed', error_message: message, retry_count: retryCount, updated_at: now })
          .eq('id', pin.id);
        result.details.push({ pinId: pin.id, status: 'failed', error: message });
      } else {
        await client
          .from('pins')
          .update({
            scheduled_at: new Date(Date.now() + RETRY_DELAY_MS).toISOString(),
            retry_count: retryCount,
            error_message: `Retry ${retryCount}/${MAX_RETRIES}: ${message}`,
            updated_at: now,
          })
          .eq('id', pin.id);
        result.details.push({ pinId: pin.id, status: 'retry', error: message });
      }
      console.error(`[publish] pin ${pin.id} failed:`, message);
    }
  }

  return result;
}
