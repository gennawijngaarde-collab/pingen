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
