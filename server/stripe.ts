import { createHmac } from 'node:crypto';
import { createServiceClient } from './publishScheduledPins.js';
import { isConfiguredKey, safeEqual } from './http.js';

export type PaidPlan = 'pro' | 'business';
export type Plan = 'starter' | PaidPlan;

export const PLAN_AMOUNTS: Record<PaidPlan, number> = { pro: 1900, business: 4900 };

export function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'business';
}

export function stripeSecretKey(): string {
  return (process.env.STRIPE_SECRET_KEY || '').trim();
}

export function stripeConfigured(): boolean {
  return isConfiguredKey(stripeSecretKey());
}

export interface StripeResult {
  ok: boolean;
  status: number;
  data: Record<string, unknown>;
}

export async function stripeRequest(
  path: string,
  params?: URLSearchParams,
  method: 'POST' | 'GET' | 'DELETE' = params ? 'POST' : 'GET'
): Promise<StripeResult> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${stripeSecretKey()}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : params,
    signal: AbortSignal.timeout(20_000),
  });
  const data = (await res.json().catch(() => ({}))) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

export function stripeErrorMessage(data: Record<string, unknown>): string {
  const err = data.error;
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return typeof data.message === 'string' ? data.message : '';
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value ? value : null;
}

/** Stripe returns expandable fields as either an id or an object. */
export function idOf(value: unknown): string | null {
  if (typeof value === 'string') return value || null;
  if (value && typeof value === 'object' && 'id' in value) return pickString((value as { id: unknown }).id);
  return null;
}

export function stripeStatusToLocal(status: unknown): 'active' | 'canceled' | 'past_due' | 'unpaid' {
  switch (status) {
    case 'active':
    case 'trialing':
      return 'active';
    case 'past_due':
      return 'past_due';
    case 'unpaid':
    case 'incomplete':
    case 'incomplete_expired':
    case 'paused':
      return 'unpaid';
    default:
      return 'canceled';
  }
}

export interface SubscriptionState {
  userId: string;
  plan: Plan;
  status: 'active' | 'canceled' | 'past_due' | 'unpaid';
  customerId: string | null;
  subscriptionId: string | null;
  periodStart?: string | null;
  periodEnd?: string | null;
}

/**
 * Single writer for billing state (service role — users cannot edit plans).
 * The profile plan only grants paid features while the subscription is active.
 */
export async function applySubscriptionState(state: SubscriptionState): Promise<void> {
  const client = createServiceClient();
  if (!client) throw new Error('SUPABASE_SERVICE_ROLE_KEY is not configured');

  const effectivePlan: Plan = state.status === 'active' || state.status === 'past_due' ? state.plan : 'starter';
  const now = new Date().toISOString();

  const { error: profileError } = await client
    .from('profiles')
    .update({ plan: effectivePlan, updated_at: now })
    .eq('id', state.userId);
  if (profileError) throw new Error(`profile update failed: ${profileError.message}`);

  const { error: subError } = await client.from('subscriptions').upsert(
    {
      user_id: state.userId,
      stripe_customer_id: state.customerId,
      stripe_subscription_id: state.subscriptionId,
      plan: state.plan,
      status: state.status,
      current_period_start: state.periodStart ?? null,
      current_period_end: state.periodEnd ?? null,
      updated_at: now,
    },
    { onConflict: 'user_id' }
  );
  if (subError) throw new Error(`subscription upsert failed: ${subError.message}`);
}

export async function findUserIdByCustomer(customerId: string): Promise<string | null> {
  const client = createServiceClient();
  if (!client) return null;
  const { data } = await client
    .from('subscriptions')
    .select('user_id')
    .eq('stripe_customer_id', customerId)
    .maybeSingle();
  return (data as { user_id?: string } | null)?.user_id || null;
}

export async function findSubscriptionForUser(
  userId: string
): Promise<{ customerId: string | null; subscriptionId: string | null; plan: string | null; status: string | null } | null> {
  const client = createServiceClient();
  if (!client) return null;
  const { data } = await client
    .from('subscriptions')
    .select('stripe_customer_id, stripe_subscription_id, plan, status')
    .eq('user_id', userId)
    .maybeSingle();
  if (!data) return null;
  const row = data as {
    stripe_customer_id?: string | null;
    stripe_subscription_id?: string | null;
    plan?: string | null;
    status?: string | null;
  };
  return {
    customerId: row.stripe_customer_id ?? null,
    subscriptionId: row.stripe_subscription_id ?? null,
    plan: row.plan ?? null,
    status: row.status ?? null,
  };
}

export function unixToIso(value: unknown): string | null {
  return typeof value === 'number' && Number.isFinite(value) ? new Date(value * 1000).toISOString() : null;
}

export function stripeMode(): 'live' | 'test' | 'none' {
  const key = stripeSecretKey();
  if (!key) return 'none';
  return key.startsWith('sk_live_') || key.startsWith('rk_live_') ? 'live' : 'test';
}

type StripeObject = Record<string, unknown>;

export function planFromSubscription(sub: StripeObject): PaidPlan | null {
  const metadata = (sub.metadata || {}) as StripeObject;
  if (isPaidPlan(metadata.plan)) return metadata.plan;
  const items = (sub.items as { data?: Array<{ price?: { id?: string; unit_amount?: number } }> } | undefined)?.data || [];
  const price = items[0]?.price;
  const priceId = price?.id || '';
  if (priceId && priceId === (process.env.STRIPE_PRICE_BUSINESS || '').trim()) return 'business';
  if (priceId && priceId === (process.env.STRIPE_PRICE_PRO || '').trim()) return 'pro';
  if (price?.unit_amount === PLAN_AMOUNTS.business) return 'business';
  if (price?.unit_amount === PLAN_AMOUNTS.pro) return 'pro';
  return null;
}

async function resolveUserId(sub: StripeObject): Promise<string | null> {
  const metadata = (sub.metadata || {}) as StripeObject;
  if (typeof metadata.user_id === 'string' && metadata.user_id) return metadata.user_id;
  const customerId = idOf(sub.customer);
  return customerId ? findUserIdByCustomer(customerId) : null;
}

/** Writes the local billing state for a Stripe subscription object. */
export async function syncSubscription(sub: StripeObject, forceCanceled = false): Promise<boolean> {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn('[stripe] subscription without resolvable user', idOf(sub.id));
    return false;
  }
  await applySubscriptionState({
    userId,
    plan: planFromSubscription(sub) || 'pro',
    status: forceCanceled ? 'canceled' : stripeStatusToLocal(sub.status),
    customerId: idOf(sub.customer),
    subscriptionId: idOf(sub.id),
    periodStart: unixToIso(sub.current_period_start),
    periodEnd: unixToIso(sub.current_period_end),
  });
  return true;
}

/**
 * Re-reads a subscription from Stripe (the authoritative state) and syncs it.
 * Optional hints (user id / plan) come from the Checkout session metadata when
 * the subscription itself has none.
 */
export async function syncSubscriptionById(
  subscriptionId: string,
  hints: { userId?: string | null; plan?: string | null } = {}
): Promise<boolean> {
  const result = await stripeRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
  if (result.status === 404) {
    const userId = hints.userId || null;
    if (!userId) return false;
    const existing = await findSubscriptionForUser(userId);
    const previousPlan = existing?.plan;
    await applySubscriptionState({
      userId,
      plan: isPaidPlan(previousPlan) ? previousPlan : 'starter',
      status: 'canceled',
      customerId: existing?.customerId ?? null,
      subscriptionId: null,
    });
    return true;
  }
  if (!result.ok) throw new Error(`Stripe subscription fetch failed (${result.status}): ${stripeErrorMessage(result.data)}`);

  const metadata = { ...((result.data.metadata as StripeObject) || {}) };
  if (hints.userId && !metadata.user_id) metadata.user_id = hints.userId;
  if (isPaidPlan(hints.plan) && !metadata.plan) metadata.plan = hints.plan;
  return syncSubscription({ ...result.data, metadata });
}

export const STRIPE_WEBHOOK_EVENTS = [
  'checkout.session.completed',
  'customer.subscription.created',
  'customer.subscription.updated',
  'customer.subscription.deleted',
  'invoice.paid',
  'invoice.payment_failed',
] as const;

export interface WebhookEnsureResult {
  mode: 'live' | 'test' | 'none';
  url: string;
  action: 'exists' | 'created' | 'skipped' | 'error';
  endpointId?: string;
  error?: string;
}

let webhookCheck: { url: string; mode: string; at: number; endpointId: string } | null = null;
const WEBHOOK_CHECK_TTL_MS = 6 * 60 * 60 * 1000;

/**
 * Makes sure a webhook endpoint pointing at `url` exists in the Stripe account
 * for the configured key (test or live). Idempotent; cached per process.
 * The signing secret is not needed: the handler re-fetches every event from Stripe.
 */
export async function ensureStripeWebhook(url: string): Promise<WebhookEnsureResult> {
  const mode = stripeMode();
  if (mode === 'none') return { mode, url, action: 'skipped', error: 'STRIPE_SECRET_KEY not configured' };
  if (webhookCheck && webhookCheck.url === url && webhookCheck.mode === mode && Date.now() - webhookCheck.at < WEBHOOK_CHECK_TTL_MS) {
    return { mode, url, action: 'exists', endpointId: webhookCheck.endpointId };
  }

  try {
    let startingAfter = '';
    for (let page = 0; page < 5; page++) {
      const query = `/webhook_endpoints?limit=100${startingAfter ? `&starting_after=${encodeURIComponent(startingAfter)}` : ''}`;
      const list = await stripeRequest(query);
      if (!list.ok) return { mode, url, action: 'error', error: stripeErrorMessage(list.data) || `HTTP ${list.status}` };
      const data = (list.data.data as Array<{ id: string; url: string; status: string }> | undefined) || [];
      const existing = data.find((ep) => ep.url === url && ep.status === 'enabled');
      if (existing) {
        webhookCheck = { url, mode, at: Date.now(), endpointId: existing.id };
        return { mode, url, action: 'exists', endpointId: existing.id };
      }
      if (!list.data.has_more || data.length === 0) break;
      startingAfter = data[data.length - 1].id;
    }

    const params = new URLSearchParams({ url, description: 'GenX billing sync (auto-provisioned)' });
    STRIPE_WEBHOOK_EVENTS.forEach((event, i) => params.set(`enabled_events[${i}]`, event));
    const created = await stripeRequest('/webhook_endpoints', params);
    if (!created.ok) return { mode, url, action: 'error', error: stripeErrorMessage(created.data) || `HTTP ${created.status}` };
    const endpointId = String(created.data.id || '');
    webhookCheck = { url, mode, at: Date.now(), endpointId };
    console.log(`[stripe] webhook endpoint created (${mode}) ${endpointId} → ${url}`);
    return { mode, url, action: 'created', endpointId };
  } catch (error) {
    return { mode, url, action: 'error', error: error instanceof Error ? error.message : String(error) };
  }
}

export interface ReconcileResult {
  checked: number;
  updated: number;
  errors: number;
}

/**
 * Safety net for missed webhooks: re-syncs subscriptions not refreshed for a
 * day, a few at a time. `applySubscriptionState` bumps `updated_at`, so each
 * row is naturally revisited about once per day without any extra state.
 */
export async function reconcileSubscriptions(limit: number, deadlineMs: number): Promise<ReconcileResult> {
  const result: ReconcileResult = { checked: 0, updated: 0, errors: 0 };
  if (!stripeConfigured()) return result;
  const client = createServiceClient();
  if (!client) return result;

  const staleBefore = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const { data, error } = await client
    .from('subscriptions')
    .select('user_id, stripe_subscription_id, plan')
    .not('stripe_subscription_id', 'is', null)
    .lt('updated_at', staleBefore)
    .order('updated_at', { ascending: true })
    .limit(limit);
  if (error || !data) return result;

  for (const row of data as Array<{ user_id: string; stripe_subscription_id: string; plan: string | null }>) {
    if (Date.now() > deadlineMs) break;
    result.checked++;
    try {
      if (await syncSubscriptionById(row.stripe_subscription_id, { userId: row.user_id, plan: row.plan })) result.updated++;
    } catch (err) {
      result.errors++;
      console.error('[stripe] reconcile failed for', row.stripe_subscription_id, err);
    }
  }
  return result;
}

/** Fetches an event from Stripe; the authoritative copy of what a webhook delivered. */
export async function fetchStripeEvent(eventId: string): Promise<StripeObject | null> {
  if (!/^evt_[A-Za-z0-9]+$/.test(eventId)) return null;
  const result = await stripeRequest(`/events/${encodeURIComponent(eventId)}`);
  return result.ok ? result.data : null;
}

/**
 * Verifies a `Stripe-Signature` header (v1 scheme) against the raw payload.
 * Implemented locally to avoid pulling the Stripe SDK into the functions bundle.
 */
export function verifyStripeSignature(
  rawBody: string,
  signatureHeader: string,
  secret: string,
  toleranceSeconds = 300
): boolean {
  const parts = signatureHeader.split(',').map((p) => p.trim());
  const timestamp = parts.find((p) => p.startsWith('t='))?.slice(2) || '';
  const signatures = parts.filter((p) => p.startsWith('v1=')).map((p) => p.slice(3));
  if (!timestamp || signatures.length === 0) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts) || Math.abs(Date.now() / 1000 - ts) > toleranceSeconds) return false;

  const expected = createHmac('sha256', secret).update(`${timestamp}.${rawBody}`, 'utf8').digest('hex');
  return signatures.some((sig) => safeEqual(sig, expected));
}
