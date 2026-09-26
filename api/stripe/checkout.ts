import {
  authenticate,
  canonicalAppUrl,
  clientIp,
  isAllowedAppUrl,
  isConfiguredKey,
  jsonBody,
  rateLimit,
  str,
  unauthorized,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';
import {
  PLAN_AMOUNTS,
  findSubscriptionForUser,
  isPaidPlan,
  stripeConfigured,
  stripeErrorMessage,
  stripeRequest,
} from '../../server/stripe.js';

/**
 * Creates a Stripe Checkout session for the signed-in user.
 * The user id and email come from the verified session, never from the body.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!stripeConfigured()) {
    res.status(503).json({ error: 'Stripe is not configured.' });
    return;
  }
  if (!rateLimit(`checkout:${clientIp(req)}`, 20, 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    unauthorized(res);
    return;
  }

  const body = jsonBody(req);
  const plan = body.plan;
  if (!isPaidPlan(plan)) {
    res.status(400).json({ error: 'plan must be "pro" or "business"' });
    return;
  }

  const appUrl = canonicalAppUrl();
  const successUrl = str(body.successUrl, 500);
  const cancelUrl = str(body.cancelUrl, 500);
  const success = isAllowedAppUrl(successUrl)
    ? successUrl
    : `${appUrl}/dashboard/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`;
  const cancel = isAllowedAppUrl(cancelUrl) ? cancelUrl : `${appUrl}/dashboard/settings?tab=billing&canceled=1`;

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('client_reference_id', user.id);
  params.set('success_url', success);
  params.set('cancel_url', cancel);
  params.set('metadata[user_id]', user.id);
  params.set('metadata[plan]', plan);
  params.set('subscription_data[metadata][user_id]', user.id);
  params.set('subscription_data[metadata][plan]', plan);
  params.set('allow_promotion_codes', 'true');

  // Reuse the existing Stripe customer so invoices and the portal stay consistent.
  const existing = await findSubscriptionForUser(user.id).catch(() => null);
  if (existing?.customerId) {
    params.set('customer', existing.customerId);
  } else if (user.email) {
    params.set('customer_email', user.email);
  }

  const priceId = (plan === 'pro' ? process.env.STRIPE_PRICE_PRO : process.env.STRIPE_PRICE_BUSINESS)?.trim() || '';
  if (isConfiguredKey(priceId)) {
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
  } else {
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'eur');
    params.set('line_items[0][price_data][unit_amount]', String(PLAN_AMOUNTS[plan]));
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set('line_items[0][price_data][product_data][name]', plan === 'pro' ? 'GenX Pro' : 'GenX Business');
  }

  const result = await stripeRequest('/checkout/sessions', params);
  const checkoutUrl = typeof result.data.url === 'string' ? result.data.url : '';
  if (!result.ok || !checkoutUrl) {
    console.error('[stripe/checkout] failed', result.status, stripeErrorMessage(result.data));
    res.status(502).json({ error: 'Unable to create the Stripe Checkout session.' });
    return;
  }

  res.status(200).json({ url: checkoutUrl });
}
