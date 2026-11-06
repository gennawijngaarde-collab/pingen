import type { SupabaseClient } from '@supabase/supabase-js';
import { pinterestAppId, pinterestAppSecret } from './pinterestApp.js';
import { decryptSecret, encryptSecret } from './shopify.js';

const PINTEREST_API = 'https://api.pinterest.com/v5';

interface ShopPin {
  id: string;
  shop_id: string;
  title: string;
  description: string | null;
  image_url: string;
  link: string | null;
  board_id: string | null;
  alt_text: string | null;
  retry_count: number | null;
}

interface ShopAccount {
  id: string;
  shop_id: string;
  access_token_enc: string;
  refresh_token_enc: string | null;
  token_expires_at: string | null;
  boards: Array<{ id?: string }> | null;
  is_active: boolean | null;
}

export interface ShopPublishResult {
  processed: number;
  successful: number;
  failed: number;
  skipped?: string;
}

/**
 * Publishes Shopify pins that a merchant already approved.
 * Drafts are never selected. SaaS pins are not touched.
 */
export async function publishDueShopPins(client: SupabaseClient, timeBudgetMs = 20_000): Promise<ShopPublishResult> {
  const startedAt = Date.now();
  const now = new Date().toISOString();
  const result: ShopPublishResult = { processed: 0, successful: 0, failed: 0 };

  const { data, error } = await client
    .from('pins')
    .select('id, shop_id, title, description, image_url, link, board_id, alt_text, retry_count')
    .not('shop_id', 'is', null)
    .not('approved_at', 'is', null)
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(10);

  if (error) {
    if (/shop_id|approved_at/i.test(error.message)) return { ...result, skipped: 'migration' };
    throw new Error(error.message);
  }
  const pins = (data || []) as ShopPin[];
  if (pins.length === 0) return result;

  const { data: claimed, error: claimError } = await client.rpc('claim_pins_for_publishing', {
    p_ids: pins.map((pin) => pin.id),
  });
  if (claimError) throw new Error(claimError.message);
  const claimedIds = new Set(
    (Array.isArray(claimed) ? claimed : []).map((row) => (typeof row === 'string' ? row : (row as { id?: string })?.id || '')),
  );
  const shopIds = Array.from(new Set(pins.filter((pin) => claimedIds.has(pin.id)).map((pin) => pin.shop_id)));
  if (shopIds.length === 0) return result;

  const { data: accounts, error: accountError } = await client
    .from('shop_pinterest_accounts')
    .select('id, shop_id, access_token_enc, refresh_token_enc, token_expires_at, boards, is_active')
    .in('shop_id', shopIds)
    .eq('is_active', true);
  if (accountError) throw new Error(accountError.message);
  const byShop = new Map<string, ShopAccount>();
  for (const account of (accounts || []) as ShopAccount[]) byShop.set(account.shop_id, account);

  for (const pin of pins) {
    if (!claimedIds.has(pin.id)) continue;
    if (Date.now() - startedAt > timeBudgetMs) {
      await client.rpc('release_pin_lock', { p_id: pin.id });
      continue;
    }
    result.processed++;
    try {
      const account = byShop.get(pin.shop_id);
      if (!account) throw new Error('Aucun compte Pinterest actif pour cette boutique.');
      const accessToken = await usableToken(client, account);
      const boardId = pin.board_id || account.boards?.find((board) => board?.id)?.id || (await firstBoard(accessToken));
      const pinterestPinId = await createPin(accessToken, pin, boardId);
      const { error: updateError } = await client
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
      if (updateError) throw new Error(updateError.message);
      result.successful++;
    } catch (err) {
      result.failed++;
      const message = err instanceof Error ? err.message : 'Unknown error';
      const retryCount = (pin.retry_count || 0) + 1;
      const update: {
        status: 'failed' | 'scheduled';
        retry_count: number;
        error_message: string;
        updated_at: string;
        scheduled_at?: string;
      } = {
        status: retryCount >= 3 ? 'failed' : 'scheduled',
        retry_count: retryCount,
        error_message: message.slice(0, 500),
        updated_at: new Date().toISOString(),
      };
      if (retryCount < 3) update.scheduled_at = new Date(Date.now() + 15 * 60 * 1000).toISOString();
      await client.from('pins').update(update).eq('id', pin.id);
    } finally {
      await client.rpc('release_pin_lock', { p_id: pin.id });
    }
  }
  return result;
}

async function usableToken(client: SupabaseClient, account: ShopAccount): Promise<string> {
  const expired = account.token_expires_at ? new Date(account.token_expires_at) <= new Date() : false;
  if (!expired) return decryptSecret(account.access_token_enc);
  if (!account.refresh_token_enc) throw new Error('Jeton Pinterest expiré. Reconnectez Pinterest.');
  const refresh = decryptSecret(account.refresh_token_enc);
  const basic = Buffer.from(`${pinterestAppId()}:${pinterestAppSecret()}`).toString('base64');
  const res = await fetch(`${PINTEREST_API}/oauth/token`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ grant_type: 'refresh_token', refresh_token: refresh }),
  });
  const data = (await res.json()) as { access_token?: string; refresh_token?: string; expires_in?: number; message?: string };
  if (!res.ok || !data.access_token) throw new Error(data.message || 'Rafraîchissement Pinterest refusé');
  const nextRefresh = data.refresh_token || refresh;
  await client
    .from('shop_pinterest_accounts')
    .update({
      access_token_enc: encryptSecret(data.access_token),
      refresh_token_enc: encryptSecret(nextRefresh),
      token_expires_at: new Date(Date.now() + (data.expires_in || 3600) * 1000).toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq('id', account.id);
  return data.access_token;
}

async function firstBoard(accessToken: string): Promise<string> {
  const res = await fetch(`${PINTEREST_API}/boards?page_size=1`, { headers: { Authorization: `Bearer ${accessToken}` } });
  const data = (await res.json()) as { items?: Array<{ id: string }>; message?: string };
  const id = data.items?.[0]?.id;
  if (!res.ok || !id) throw new Error(data.message || 'Aucun tableau Pinterest.');
  return id;
}

async function createPin(accessToken: string, pin: ShopPin, boardId: string): Promise<string> {
  const res = await fetch(`${PINTEREST_API}/pins`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      title: pin.title.slice(0, 100),
      description: pin.description ? pin.description.slice(0, 800) : undefined,
      link: pin.link || undefined,
      board_id: boardId,
      alt_text: (pin.alt_text || pin.title).slice(0, 500),
      media_source: { source_type: 'image_url', url: pin.image_url },
    }),
    signal: AbortSignal.timeout(25_000),
  });
  const data = (await res.json()) as { id?: string; message?: string };
  if (!res.ok || !data.id) throw new Error(data.message || `Pinterest ${res.status}`);
  return data.id;
}
