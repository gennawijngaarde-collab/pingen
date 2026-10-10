import { reportError } from '../../server/sentry.js';
import {
  authenticate,
  clientIp,
  jsonBody,
  rateLimit,
  str,
  unauthorized,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';
import {
  applySubscriptionState,
  findSubscriptionForUser,
  idOf,
  isPaidPlan,
  stripeConfigured,
  stripeErrorMessage,
  stripeRequest,
  stripeStatusToLocal,
  unixToIso,
} from '../../server/stripe.js';

/**
 * Billing actions for the signed-in user. Plans are only ever written here and
 * by the Stripe webhook (service role); browsers cannot edit `profiles.plan`.
 *
 *  - `{ sessionId }`        : confirm a Checkout session and activate the plan.
 *  - `{ action: 'cancel' }` : downgrade to Starter (cancels the Stripe subscription
 *                             at period end when one exists).
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!rateLimit(`billing:${clientIp(req)}`, 30, 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    unauthorized(res);
    return;
  }

  const body = jsonBody(req);

  try {
    if (body.action === 'cancel') {
      const existing = await findSubscriptionForUser(user.id);
      if (existing?.subscriptionId && stripeConfigured()) {
        const params = new URLSearchParams({ cancel_at_period_end: 'true' });
        const result = await stripeRequest(`/subscriptions/${encodeURIComponent(existing.subscriptionId)}`, params);
        if (!result.ok && result.status !== 404) {
          console.error('[stripe/confirm] cancel failed', result.status, stripeErrorMessage(result.data));
          res.status(502).json({ error: 'Stripe refused the cancellation. Please retry.' });
          return;
        }
        // Access continues until the period ends; the webhook downgrades the plan then.
        res.status(200).json({ plan: existing.plan || 'starter', scheduledDowngrade: true });
        return;
      }
      await applySubscriptionState({
        userId: user.id,
        plan: 'starter',
        status: 'canceled',
        customerId: existing?.customerId ?? null,
        subscriptionId: null,
      });
      res.status(200).json({ plan: 'starter', scheduledDowngrade: false });
      return;
    }

    if (!stripeConfigured()) {
      res.status(503).json({ error: 'Stripe is not configured.' });
      return;
    }

    const sessionId = str(body.sessionId, 200);
    if (!/^cs_[A-Za-z0-9_]+$/.test(sessionId)) {
      res.status(400).json({ error: 'sessionId is required' });
      return;
    }

    const result = await stripeRequest(
      `/checkout/sessions/${encodeURIComponent(sessionId)}?expand[]=subscription`
    );
    if (!result.ok) {
      res.status(404).json({ error: 'Stripe session not found.' });
      return;
    }

    const session = result.data;
    const metadata = (session.metadata || {}) as Record<string, unknown>;
    const sessionUserId =
      (typeof metadata.user_id === 'string' && metadata.user_id) ||
      (typeof session.client_reference_id === 'string' ? session.client_reference_id : '');
    if (sessionUserId !== user.id) {
      res.status(403).json({ error: 'This Stripe session belongs to another account.' });
      return;
    }

    const paid =
      session.status === 'complete' ||
      session.payment_status === 'paid' ||
      session.payment_status === 'no_payment_required';
    if (!paid) {
      res.status(400).json({ error: 'The Stripe payment is not complete.' });
      return;
    }

    const plan = metadata.plan;
    if (!isPaidPlan(plan)) {
      res.status(400).json({ error: 'Invalid plan on the Stripe session.' });
      return;
    }

    const subscription =
      session.subscription && typeof session.subscription === 'object'
        ? (session.subscription as Record<string, unknown>)
        : null;
    const customerId = idOf(session.customer);
    const subscriptionId = idOf(session.subscription);

    await applySubscriptionState({
      userId: user.id,
      plan,
      status: subscription ? stripeStatusToLocal(subscription.status) : 'active',
      customerId,
      subscriptionId,
      periodStart: subscription ? unixToIso(subscription.current_period_start) : null,
      periodEnd: subscription ? unixToIso(subscription.current_period_end) : null,
    });

    res.status(200).json({
      plan,
      customerId: customerId ?? undefined,
      subscriptionId: subscriptionId ?? undefined,
    });
  } catch (error) {
    console.error('[stripe/confirm] error', error);
    await reportError(error, { route: 'stripe/confirm', userId: user.id });
    res.status(500).json({ error: 'Billing update failed. Please retry.' });
  }
}
