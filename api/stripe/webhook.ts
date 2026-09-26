import { header, type ApiRequest, type ApiResponse } from '../../server/http.js';
import {
  applySubscriptionState,
  findUserIdByCustomer,
  idOf,
  isPaidPlan,
  stripeRequest,
  stripeStatusToLocal,
  unixToIso,
  verifyStripeSignature,
} from '../../server/stripe.js';

// Signature verification needs the exact bytes Stripe sent.
export const config = { api: { bodyParser: false } };

type RawRequest = ApiRequest & Partial<AsyncIterable<Buffer | string>>;

async function readRawBody(req: RawRequest): Promise<string> {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req[Symbol.asyncIterator] === 'function') {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req as AsyncIterable<Buffer | string>) {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += buf.length;
      if (size > 1_000_000) throw new Error('payload too large');
      chunks.push(buf);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  return req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : '';
}

interface StripeEvent {
  id?: string;
  type?: string;
  data?: { object?: Record<string, unknown> };
}

function planFromSubscription(sub: Record<string, unknown>): 'pro' | 'business' | null {
  const metadata = (sub.metadata || {}) as Record<string, unknown>;
  if (isPaidPlan(metadata.plan)) return metadata.plan;
  const items = (sub.items as { data?: Array<{ price?: { id?: string } }> } | undefined)?.data || [];
  const priceId = items[0]?.price?.id || '';
  if (priceId && priceId === (process.env.STRIPE_PRICE_BUSINESS || '').trim()) return 'business';
  if (priceId && priceId === (process.env.STRIPE_PRICE_PRO || '').trim()) return 'pro';
  return null;
}

async function resolveUserId(sub: Record<string, unknown>): Promise<string | null> {
  const metadata = (sub.metadata || {}) as Record<string, unknown>;
  if (typeof metadata.user_id === 'string' && metadata.user_id) return metadata.user_id;
  const customerId = idOf(sub.customer);
  return customerId ? findUserIdByCustomer(customerId) : null;
}

async function syncSubscription(sub: Record<string, unknown>, forceCanceled = false): Promise<void> {
  const userId = await resolveUserId(sub);
  if (!userId) {
    console.warn('[stripe/webhook] subscription without resolvable user', idOf(sub.id));
    return;
  }
  const plan = planFromSubscription(sub) || 'pro';
  const status = forceCanceled ? 'canceled' : stripeStatusToLocal(sub.status);
  await applySubscriptionState({
    userId,
    plan,
    status,
    customerId: idOf(sub.customer),
    subscriptionId: idOf(sub.id),
    periodStart: unixToIso(sub.current_period_start),
    periodEnd: unixToIso(sub.current_period_end),
  });
}

/**
 * Stripe webhook: the source of truth for plan changes after checkout
 * (renewals, payment failures, cancellations, portal changes).
 * Configure the endpoint in Stripe → Developers → Webhooks with events:
 *   checkout.session.completed, customer.subscription.created/updated/deleted,
 *   invoice.payment_failed, invoice.paid
 * and set STRIPE_WEBHOOK_SECRET in Vercel.
 */
export default async function handler(req: RawRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (!secret) {
    console.error('[stripe/webhook] STRIPE_WEBHOOK_SECRET is not configured');
    res.status(503).json({ error: 'Webhook not configured' });
    return;
  }

  let rawBody: string;
  try {
    rawBody = await readRawBody(req);
  } catch {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  if (!verifyStripeSignature(rawBody, header(req, 'stripe-signature'), secret)) {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  let event: StripeEvent;
  try {
    event = JSON.parse(rawBody) as StripeEvent;
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }

  const object = event.data?.object || {};

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const subscriptionId = idOf(object.subscription);
        if (subscriptionId) {
          const sub = await stripeRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
          if (sub.ok) {
            const metadata = (object.metadata || {}) as Record<string, unknown>;
            const subMeta = { ...((sub.data.metadata as Record<string, unknown>) || {}) };
            if (typeof metadata.user_id === 'string' && !subMeta.user_id) subMeta.user_id = metadata.user_id;
            if (isPaidPlan(metadata.plan) && !subMeta.plan) subMeta.plan = metadata.plan;
            await syncSubscription({ ...sub.data, metadata: subMeta });
          }
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated':
        await syncSubscription(object);
        break;
      case 'customer.subscription.deleted':
        await syncSubscription(object, true);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const subscriptionId = idOf(object.subscription);
        if (subscriptionId) {
          const sub = await stripeRequest(`/subscriptions/${encodeURIComponent(subscriptionId)}`);
          if (sub.ok) await syncSubscription(sub.data);
        }
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe/webhook] ${event.type} failed`, error);
    // 500 makes Stripe retry with backoff.
    res.status(500).json({ received: false });
    return;
  }

  res.status(200).json({ received: true });
}
