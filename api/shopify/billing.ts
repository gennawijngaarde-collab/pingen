import { reportError } from '../../server/sentry.js';
import { bearerToken, canonicalAppUrl, jsonBody, type ApiRequest, type ApiResponse } from '../../server/http.js';
import {
  SHOP_PLANS,
  loadShop,
  requireService,
  shopifyGraphql,
  verifySessionToken,
  type ShopPlan,
} from '../../server/shopify.js';

interface BillingData {
  appSubscriptionCreate: {
    confirmationUrl: string | null;
    userErrors: Array<{ message: string }>;
  };
}

const MUTATION = `mutation Billing($name: String!, $returnUrl: URL!, $amount: Decimal!, $test: Boolean!) {
  appSubscriptionCreate(
    name: $name
    returnUrl: $returnUrl
    test: $test
    lineItems: [{
      plan: { appRecurringPricingDetails: { price: { amount: $amount, currencyCode: EUR }, interval: EVERY_30_DAYS } }
    }]
  ) {
    confirmationUrl
    userErrors { message }
  }
}`;

/** Starts Shopify Billing. Stripe is not involved. The merchant confirms the charge in Shopify. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const shopDomain = verifySessionToken(bearerToken(req));
  if (!shopDomain) {
    res.status(401).json({ error: 'Session Shopify invalide' });
    return;
  }
  const plan = jsonBody(req).plan;
  if (plan !== 'shop_pro' && plan !== 'shop_business') {
    res.status(400).json({ error: 'plan doit être shop_pro ou shop_business' });
    return;
  }
  const shop = await loadShop(shopDomain);
  if (!shop) {
    res.status(404).json({ error: 'Boutique non installée' });
    return;
  }
  const chosen = SHOP_PLANS[plan as ShopPlan];
  try {
    const data = await shopifyGraphql<BillingData>(shop.shop_domain, shop.token, MUTATION, {
      name: `PingenX ${chosen.label}`,
      returnUrl: `${canonicalAppUrl()}/shopify`,
      amount: chosen.priceEur.toFixed(2),
      test: process.env.SHOPIFY_BILLING_TEST === 'true',
    });
    const confirmationUrl = data.appSubscriptionCreate.confirmationUrl;
    const reason = data.appSubscriptionCreate.userErrors[0]?.message;
    if (!confirmationUrl) {
      res.status(422).json({ error: reason || 'Shopify n’a pas renvoyé d’URL de confirmation' });
      return;
    }
    await requireService()
      .from('shopify_subscriptions')
      .update({ plan, status: 'pending', updated_at: new Date().toISOString() })
      .eq('shop_id', shop.id);
    res.status(200).json({ confirmationUrl });
  } catch (error) {
    console.error('[shopify] billing', error);
    await reportError(error, { route: 'shopify/billing' });
    res.status(502).json({ error: error instanceof Error ? error.message : 'Billing failed' });
  }
}
