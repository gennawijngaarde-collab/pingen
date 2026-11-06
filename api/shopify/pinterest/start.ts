import { bearerToken, canonicalAppUrl, type ApiRequest, type ApiResponse } from '../../../server/http.js';
import { PINTEREST_SCOPES, pinterestAppId } from '../../../server/pinterestApp.js';
import { loadShop, signShopState, verifySessionToken } from '../../../server/shopify.js';

/** Returns the Pinterest OAuth URL for this shop. The secret stays on the server. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const shopDomain = verifySessionToken(bearerToken(req));
  if (!shopDomain) {
    res.status(401).json({ error: 'Session Shopify invalide' });
    return;
  }
  const shop = await loadShop(shopDomain);
  if (!shop) {
    res.status(404).json({ error: 'Boutique non installée' });
    return;
  }
  const redirectUri = `${canonicalAppUrl()}/api/shopify/pinterest/callback`;
  const params = new URLSearchParams({
    client_id: pinterestAppId(),
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: PINTEREST_SCOPES.join(','),
    state: signShopState(shop.shop_domain),
  });
  res.status(200).json({ url: `https://www.pinterest.com/oauth/?${params.toString()}` });
}
