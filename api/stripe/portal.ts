import {
  authenticate,
  canonicalAppUrl,
  clientIp,
  isAllowedAppUrl,
  jsonBody,
  rateLimit,
  str,
  unauthorized,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';
import { findSubscriptionForUser, stripeConfigured, stripeErrorMessage, stripeRequest } from '../../server/stripe.js';

/**
 * Opens the Stripe customer portal for the signed-in user's own customer.
 * The customer id is resolved server-side; a caller can never open someone
 * else's portal by guessing a `cus_…` id.
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
  if (!rateLimit(`portal:${clientIp(req)}`, 20, 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    unauthorized(res);
    return;
  }

  const existing = await findSubscriptionForUser(user.id).catch(() => null);
  if (!existing?.customerId) {
    res.status(404).json({ error: 'No Stripe customer is linked to this account yet.' });
    return;
  }

  const returnUrl = str(jsonBody(req).returnUrl, 500);
  const params = new URLSearchParams();
  params.set('customer', existing.customerId);
  params.set('return_url', isAllowedAppUrl(returnUrl) ? returnUrl : `${canonicalAppUrl()}/dashboard/settings?tab=billing`);

  const result = await stripeRequest('/billing_portal/sessions', params);
  const portalUrl = typeof result.data.url === 'string' ? result.data.url : '';
  if (!result.ok || !portalUrl) {
    console.error('[stripe/portal] failed', result.status, stripeErrorMessage(result.data));
    res.status(502).json({ error: 'Unable to open the Stripe customer portal.' });
    return;
  }

  res.status(200).json({ url: portalUrl });
}
