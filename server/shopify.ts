import {
  createCipheriv,
  createDecipheriv,
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from 'node:crypto';
import type { SupabaseClient } from '@supabase/supabase-js';
import { canonicalAppUrl, safeEqual } from './http.js';
import { createServiceClient } from './publishScheduledPins.js';

export const SHOPIFY_API_VERSION = '2026-01';

export const SHOP_PLANS = {
  shop_starter: { priceEur: 0, pins: 5, label: 'Starter' },
  shop_pro: { priceEur: 19, pins: 150, label: 'Pro' },
  shop_business: { priceEur: 49, pins: 600, label: 'Business' },
} as const;

export type ShopPlan = keyof typeof SHOP_PLANS;

const SHOP_DOMAIN = /^[a-z0-9][a-z0-9-]*\.myshopify\.com$/;

export interface ShopRow {
  id: string;
  shop_domain: string;
  status: string;
  access_token_enc: string | null;
  scopes: string | null;
}

export function shopifyApiKey(): string {
  return (process.env.SHOPIFY_API_KEY || process.env.VITE_SHOPIFY_API_KEY || '').trim();
}

export function shopifyApiSecret(): string {
  return (process.env.SHOPIFY_API_SECRET || '').trim();
}

export function shopifyConfigured(): boolean {
  return shopifyApiKey().length >= 8 && shopifyApiSecret().length >= 8;
}

export function shopifyRedirectUri(): string {
  return `${canonicalAppUrl()}/api/shopify/auth/callback`;
}

export function shopifyWebhookUrl(): string {
  return `${canonicalAppUrl()}/api/shopify/webhooks`;
}

export function normalizeShopDomain(raw: string): string | null {
  const value = raw.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
  const domain = value.includes('.') ? value : `${value}.myshopify.com`;
  return SHOP_DOMAIN.test(domain) ? domain : null;
}

function tokenKey(): Buffer {
  const hex = (process.env.SHOPIFY_TOKEN_KEY || '').trim();
  if (/^[0-9a-f]{64}$/i.test(hex)) return Buffer.from(hex, 'hex');
  const secret = shopifyApiSecret();
  if (!secret) throw new Error('SHOPIFY_API_SECRET missing');
  return scryptSync(secret, 'genx-shopify-v1', 32);
}

/** AES-256-GCM. Stored value is base64(iv | tag | ciphertext). */
export function encryptSecret(plain: string): string {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', tokenKey(), iv);
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, enc]).toString('base64');
}

export function decryptSecret(payload: string): string {
  const buf = Buffer.from(payload, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const enc = buf.subarray(28);
  const decipher = createDecipheriv('aes-256-gcm', tokenKey(), iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(enc), decipher.final()]).toString('utf8');
}

function sign(payload: string): string {
  return createHmac('sha256', shopifyApiSecret()).update(payload).digest('base64url');
}

export function signShopState(shop: string): string {
  const exp = Date.now() + 10 * 60 * 1000;
  const body = Buffer.from(`${shop}.${exp}`).toString('base64url');
  return `${body}.${sign(body)}`;
}

export function readShopState(state: string): string | null {
  const [body, mac] = state.split('.');
  if (!body || !mac || !shopifyConfigured()) return null;
  const expected = sign(body);
  const a = Buffer.from(mac);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  const decoded = Buffer.from(body, 'base64url').toString('utf8');
  const dot = decoded.lastIndexOf('.');
  const shop = decoded.slice(0, dot);
  const exp = Number(decoded.slice(dot + 1));
  if (!normalizeShopDomain(shop) || !Number.isFinite(exp) || exp < Date.now()) return null;
  return shop;
}

/** Verifies the HMAC Shopify puts on OAuth callbacks. */
export function verifyShopifyQuery(query: Record<string, string | undefined>): boolean {
  const hmac = query.hmac || '';
  if (!hmac || !shopifyConfigured()) return false;
  const message = Object.keys(query)
    .filter((key) => key !== 'hmac' && key !== 'signature' && query[key] !== undefined)
    .sort()
    .map((key) => `${key}=${query[key]}`)
    .join('&');
  const digest = createHmac('sha256', shopifyApiSecret()).update(message).digest('hex');
  return safeEqual(digest, hmac);
}

export function verifyWebhookHmac(rawBody: string, headerHmac: string): boolean {
  if (!headerHmac || !shopifyConfigured()) return false;
  const digest = createHmac('sha256', shopifyApiSecret()).update(rawBody, 'utf8').digest('base64');
  return safeEqual(digest, headerHmac);
}

interface SessionClaims {
  aud?: string;
  dest?: string;
  exp?: number;
}

/** Shopify session token (embedded app). Returns the shop domain. */
export function verifySessionToken(token: string): string | null {
  if (!shopifyConfigured()) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [header, payload, signature] = parts;
  const expected = createHmac('sha256', shopifyApiSecret()).update(`${header}.${payload}`).digest('base64url');
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  let claims: SessionClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionClaims;
  } catch {
    return null;
  }
  if (claims.aud !== shopifyApiKey()) return null;
  if (!claims.exp || claims.exp * 1000 < Date.now()) return null;
  if (!claims.dest) return null;
  try {
    return normalizeShopDomain(new URL(claims.dest).hostname);
  } catch {
    return null;
  }
}

export function installUrl(shop: string): string {
  const params = new URLSearchParams({
    client_id: shopifyApiKey(),
    scope: 'read_products',
    redirect_uri: shopifyRedirectUri(),
    state: signShopState(shop),
  });
  return `https://${shop}/admin/oauth/authorize?${params.toString()}`;
}

export async function exchangeOfflineToken(shop: string, code: string): Promise<{ accessToken: string; scope: string }> {
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ client_id: shopifyApiKey(), client_secret: shopifyApiSecret(), code }),
    signal: AbortSignal.timeout(15_000),
  });
  const data = (await res.json()) as { access_token?: string; scope?: string; error?: string };
  if (!res.ok || !data.access_token) {
    throw new Error(data.error || `Shopify token exchange failed (${res.status})`);
  }
  return { accessToken: data.access_token, scope: data.scope || 'read_products' };
}

export async function shopifyGraphql<T>(shop: string, token: string, query: string, variables?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
    body: JSON.stringify({ query, variables }),
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json()) as { data?: T; errors?: Array<{ message?: string }> };
  if (!res.ok || data.errors?.length) {
    throw new Error(data.errors?.[0]?.message || `Shopify GraphQL failed (${res.status})`);
  }
  if (!data.data) throw new Error('Shopify GraphQL returned no data');
  return data.data;
}

export async function registerShopWebhooks(shop: string, token: string): Promise<void> {
  const topics = ['app/uninstalled', 'products/update', 'products/delete', 'app_subscriptions/update'];
  for (const topic of topics) {
    const res = await fetch(`https://${shop}/admin/api/${SHOPIFY_API_VERSION}/webhooks.json`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Shopify-Access-Token': token },
      body: JSON.stringify({ webhook: { topic, address: shopifyWebhookUrl(), format: 'json' } }),
      signal: AbortSignal.timeout(15_000),
    });
    if (res.ok || res.status === 422) continue;
    const text = await res.text();
    console.error('[shopify] webhook register', topic, res.status, text.slice(0, 200));
  }
}

export function requireService(): SupabaseClient {
  const client = createServiceClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');
  return client;
}

export async function upsertInstalledShop(shop: string, accessToken: string, scopes: string): Promise<ShopRow> {
  const client = requireService();
  const now = new Date().toISOString();
  const { data, error } = await client
    .from('shopify_shops')
    .upsert(
      {
        shop_domain: shop,
        status: 'installed',
        access_token_enc: encryptSecret(accessToken),
        scopes,
        installed_at: now,
        uninstalled_at: null,
        updated_at: now,
      },
      { onConflict: 'shop_domain' },
    )
    .select('id, shop_domain, status, access_token_enc, scopes')
    .single();
  if (error || !data) throw new Error(error?.message || 'Could not store the shop');
  const row = data as ShopRow;
  const { data: existingSub } = await client.from('shopify_subscriptions').select('id').eq('shop_id', row.id).maybeSingle();
  if (!existingSub) {
    await client.from('shopify_subscriptions').insert({
      shop_id: row.id,
      plan: 'shop_starter',
      status: 'active',
      updated_at: now,
    });
  }
  return row;
}

export async function loadShop(shop: string): Promise<(ShopRow & { token: string }) | null> {
  const client = requireService();
  const { data, error } = await client
    .from('shopify_shops')
    .select('id, shop_domain, status, access_token_enc, scopes')
    .eq('shop_domain', shop)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || data.status !== 'installed' || !data.access_token_enc) return null;
  return { ...(data as ShopRow), token: decryptSecret(data.access_token_enc) };
}

export async function shopPinLimit(shopId: string): Promise<number> {
  const client = requireService();
  const { data } = await client
    .from('shopify_subscriptions')
    .select('plan, status')
    .eq('shop_id', shopId)
    .maybeSingle();
  const plan = data?.plan as ShopPlan | undefined;
  const active = data?.status === 'active' && plan && plan in SHOP_PLANS;
  if (!active || !plan) return SHOP_PLANS.shop_starter.pins;
  return SHOP_PLANS[plan].pins;
}

export async function pinsCreatedThisMonth(shopId: string): Promise<number> {
  const client = requireService();
  const start = new Date();
  start.setUTCDate(1);
  start.setUTCHours(0, 0, 0, 0);
  const { count, error } = await client
    .from('pins')
    .select('id', { count: 'exact', head: true })
    .eq('shop_id', shopId)
    .gte('created_at', start.toISOString());
  if (error) throw new Error(error.message);
  return count || 0;
}

export async function deleteShopData(shop: string): Promise<void> {
  const client = requireService();
  const { data } = await client.from('shopify_shops').select('id').eq('shop_domain', shop).maybeSingle();
  if (!data?.id) return;
  const shopId = data.id as string;
  await client.from('pins').delete().eq('shop_id', shopId);
  await client.from('shopify_products').delete().eq('shop_id', shopId);
  await client.from('shop_api_usage').delete().eq('shop_id', shopId);
  await client.from('shop_pinterest_accounts').delete().eq('shop_id', shopId);
  await client.from('shopify_subscriptions').delete().eq('shop_id', shopId);
  await client.from('shopify_shops').delete().eq('id', shopId);
}

export async function markShopUninstalled(shop: string): Promise<void> {
  const client = requireService();
  const now = new Date().toISOString();
  await client
    .from('shopify_shops')
    .update({ status: 'uninstalled', access_token_enc: null, uninstalled_at: now, updated_at: now })
    .eq('shop_domain', shop);
  const { data } = await client.from('shopify_shops').select('id').eq('shop_domain', shop).maybeSingle();
  if (!data?.id) return;
  await client.from('shop_pinterest_accounts').update({ is_active: false, updated_at: now }).eq('shop_id', data.id);
  await client.from('shopify_subscriptions').update({ status: 'cancelled', updated_at: now }).eq('shop_id', data.id);
}
