import { installUrl, normalizeShopDomain, shopifyConfigured } from '../../shopify.js';
import type { ApiRequest, ApiResponse } from '../../http.js';

/** Starts the public-app OAuth install. */
export default function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!shopifyConfigured()) {
    res.status(503).json({ error: 'Shopify app is not configured (SHOPIFY_API_KEY, SHOPIFY_API_SECRET).' });
    return;
  }
  const raw = Array.isArray(req.query?.shop) ? req.query?.shop[0] : req.query?.shop;
  const shop = normalizeShopDomain(typeof raw === 'string' ? raw : '');
  if (!shop) {
    res.status(400).json({ error: 'Paramètre shop invalide. Exemple : boutique.myshopify.com' });
    return;
  }
  res.setHeader('Location', installUrl(shop));
  res.status(302).send('');
}
