import { reportError } from '../../server/sentry.js';
import { clientIp, header, rateLimit, type ApiRequest, type ApiResponse } from '../../server/http.js';
import {
  fetchStripeEvent,
  idOf,
  isPaidPlan,
  stripeConfigured,
  stripeRequest,
  syncSubscription,
  syncSubscriptionById,
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

/**
 * Stripe webhook: keeps plans in sync after checkout (renewals, payment
 * failures, cancellations, portal changes).
 *
 * The endpoint is provisioned automatically by the daily maintenance task
 * (see server/stripe.ts#ensureStripeWebhook). Trust model:
 *  - when STRIPE_WEBHOOK_SECRET is set, the signature is verified first;
 *  - in every case the delivered payload is only used for its event id: the
 *    event is re-fetched from the Stripe API, and subscription state is read
 *    live, so a forged or replayed body cannot change any plan.
 */
export default async function handler(req: RawRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!stripeConfigured()) {
    res.status(503).json({ error: 'Stripe not configured' });
    return;
  }
  if (!rateLimit(`stripe-webhook:${clientIp(req)}`, 240, 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  let rawBody: string;
  try {
    rawBody = await readRawBody(req);
  } catch {
    res.status(413).json({ error: 'Payload too large' });
    return;
  }

  const secret = (process.env.STRIPE_WEBHOOK_SECRET || '').trim();
  if (secret && !verifyStripeSignature(rawBody, header(req, 'stripe-signature'), secret)) {
    res.status(400).json({ error: 'Invalid signature' });
    return;
  }

  let delivered: StripeEvent;
  try {
    delivered = JSON.parse(rawBody) as StripeEvent;
  } catch {
    res.status(400).json({ error: 'Invalid JSON' });
    return;
  }
  if (typeof delivered.id !== 'string') {
    res.status(400).json({ error: 'Missing event id' });
    return;
  }

  const event = (await fetchStripeEvent(delivered.id)) as StripeEvent | null;
  if (!event) {
    res.status(400).json({ error: 'Unknown event' });
    return;
  }

  const object = event.data?.object || {};

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const sessionId = idOf(object.id);
        if (!sessionId) break;
        const session = await stripeRequest(`/checkout/sessions/${encodeURIComponent(sessionId)}`);
        if (!session.ok) throw new Error(`session fetch failed (${session.status})`);
        const metadata = (session.data.metadata || {}) as Record<string, unknown>;
        const subscriptionId = idOf(session.data.subscription);
        if (subscriptionId) {
          await syncSubscriptionById(subscriptionId, {
            userId: typeof metadata.user_id === 'string' ? metadata.user_id : null,
            plan: isPaidPlan(metadata.plan) ? metadata.plan : null,
          });
        }
        break;
      }
      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscriptionId = idOf(object.id);
        if (subscriptionId) await syncSubscriptionById(subscriptionId);
        break;
      }
      case 'customer.subscription.deleted':
        // The live object may already be gone; the fetched event is authoritative here.
        await syncSubscription(object, true);
        break;
      case 'invoice.paid':
      case 'invoice.payment_failed': {
        const subscriptionId = idOf(object.subscription);
        if (subscriptionId) await syncSubscriptionById(subscriptionId);
        break;
      }
      default:
        break;
    }
  } catch (error) {
    console.error(`[stripe/webhook] ${event.type} failed`, error);
    await reportError(error, { route: 'stripe/webhook', tags: { eventType: String(event.type) } });
    // 500 makes Stripe retry with backoff.
    res.status(500).json({ received: false });
    return;
  }

  res.status(200).json({ received: true });
}
