import { canonicalAppUrl } from './http.js';
import { createServiceClient } from './publishScheduledPins.js';
import { ensureStripeWebhook, reconcileSubscriptions, type ReconcileResult, type WebhookEnsureResult } from './stripe.js';

let adminEmailCache: { value: string | null; at: number } | null = null;
const ADMIN_CACHE_TTL_MS = 60 * 60 * 1000;

/**
 * Address that receives operational notifications (new signups).
 * `ADMIN_EMAIL` wins; otherwise the account that created the workspace
 * (the oldest profile) is the owner.
 */
export async function resolveAdminEmail(): Promise<string | null> {
  const fromEnv = (process.env.ADMIN_EMAIL || '').trim();
  if (fromEnv) return fromEnv;
  if (adminEmailCache && Date.now() - adminEmailCache.at < ADMIN_CACHE_TTL_MS) return adminEmailCache.value;

  const client = createServiceClient();
  if (!client) return null;
  const { data, error } = await client.rpc('workspace_owner_email');
  if (error) console.error('[maintenance] workspace_owner_email failed:', error.message);
  const email = typeof data === 'string' && data.trim() ? data.trim() : null;
  adminEmailCache = { value: email, at: Date.now() };
  return email;
}

export function maskEmail(email: string | null): string | null {
  if (!email) return null;
  const [local, domain] = email.split('@');
  if (!domain) return '***';
  return `${local.slice(0, 1)}***@${domain}`;
}

export interface MaintenanceResult {
  stripeWebhook: WebhookEnsureResult;
  reconcile: ReconcileResult;
  adminEmail: string | null;
}

/**
 * Self-provisioning housekeeping run by the automation caller after publishing:
 * guarantees the Stripe webhook exists for the current key (test or live) and
 * re-syncs stale subscriptions. Everything here is idempotent and bounded by
 * `deadlineMs`.
 */
export async function runMaintenance(deadlineMs: number): Promise<MaintenanceResult> {
  const stripeWebhook = await ensureStripeWebhook(`${canonicalAppUrl()}/api/stripe/webhook`);
  const reconcile = Date.now() < deadlineMs ? await reconcileSubscriptions(20, deadlineMs) : { checked: 0, updated: 0, errors: 0 };
  const adminEmail = maskEmail(await resolveAdminEmail().catch(() => null));
  return { stripeWebhook, reconcile, adminEmail };
}
