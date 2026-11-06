import { reportError } from '../../../server/sentry.js';
import {
  exchangeOfflineToken,
  normalizeShopDomain,
  readShopState,
  registerShopWebhooks,
  shopifyApiKey,
  upsertInstalledShop,
  verifyShopifyQuery,
} from '../../../server/shopify.js';
import type { ApiRequest, ApiResponse } from '../../../server/http.js';

function queryString(req: ApiRequest, key: string): string {
  const value = req.query?.[key];
  return (Array.isArray(value) ? value[0] : value) || '';
}

/** OAuth callback. Stores an encrypted offline token and returns the merchant to the embedded app. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const query: Record<string, string | undefined> = {
    code: queryString(req, 'code'),
    shop: queryString(req, 'shop'),
    state: queryString(req, 'state'),
    timestamp: queryString(req, 'timestamp'),
    hmac: queryString(req, 'hmac'),
    host: queryString(req, 'host') || undefined,
  };
  if (!verifyShopifyQuery(query)) {
    res.status(401).json({ error: 'Invalid Shopify HMAC' });
    return;
  }
  const shop = normalizeShopDomain(query.shop || '');
  const stateShop = readShopState(query.state || '');
  if (!shop || !query.code || stateShop !== shop) {
    res.status(400).json({ error: 'Invalid OAuth state' });
    return;
  }
  try {
    const { accessToken, scope } = await exchangeOfflineToken(shop, query.code);
    await upsertInstalledShop(shop, accessToken, scope);
    await registerShopWebhooks(shop, accessToken);
    res.setHeader('Location', `https://${shop}/admin/apps/${shopifyApiKey()}`);
    res.status(302).send('');
  } catch (error) {
    console.error('[shopify] oauth callback', error);
    await reportError(error, { route: 'shopify/auth/callback' });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Install failed' });
  }
}
