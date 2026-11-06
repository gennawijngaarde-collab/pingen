import { bearerToken, type ApiRequest, type ApiResponse } from '../../http.js';
import { loadShop, pinsCreatedThisMonth, requireService, shopPinLimit, verifySessionToken } from '../../shopify.js';

/** Embedded app bootstrap. Authorization: Bearer <Shopify session token>. */
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
    res.status(404).json({ error: 'Boutique non installée', shop: shopDomain });
    return;
  }
  const client = requireService();
  const [{ data: sub }, { data: pinterest }, { data: products }, { data: pins }, used, limit] = await Promise.all([
    client.from('shopify_subscriptions').select('plan, status').eq('shop_id', shop.id).maybeSingle(),
    client.from('shop_pinterest_accounts').select('username, is_active').eq('shop_id', shop.id).maybeSingle(),
    client.from('shopify_products').select('product_gid, title, image_url, product_url, product_status').eq('shop_id', shop.id).order('title').limit(50),
    client
      .from('pins')
      .select('id, title, status, link, scheduled_at, approved_at, error_message')
      .eq('shop_id', shop.id)
      .order('created_at', { ascending: false })
      .limit(30),
    pinsCreatedThisMonth(shop.id),
    shopPinLimit(shop.id),
  ]);
  res.status(200).json({
    shop: shop.shop_domain,
    plan: sub?.plan || 'shop_starter',
    subscriptionStatus: sub?.status || 'active',
    pinterest: pinterest?.is_active ? pinterest.username : null,
    products: products || [],
    pins: pins || [],
    pinsUsed: used,
    pinsLimit: limit,
  });
}
