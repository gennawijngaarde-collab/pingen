import { reportError } from '../../../server/sentry.js';
import { bearerToken, jsonBody, str, type ApiRequest, type ApiResponse } from '../../../server/http.js';
import { loadShop, pinsCreatedThisMonth, requireService, shopPinLimit, verifySessionToken } from '../../../server/shopify.js';

/**
 * Creates a draft pin for one product. Nothing is sent to Pinterest.
 * A second call for the same product URL returns the existing open pin.
 */
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
  const shop = await loadShop(shopDomain);
  if (!shop) {
    res.status(404).json({ error: 'Boutique non installée' });
    return;
  }
  const productGid = str(jsonBody(req).productGid, 200);
  if (!productGid.startsWith('gid://shopify/Product/')) {
    res.status(400).json({ error: 'productGid requis' });
    return;
  }
  try {
    const client = requireService();
    const { data: product, error } = await client
      .from('shopify_products')
      .select('title, image_url, product_url, product_status')
      .eq('shop_id', shop.id)
      .eq('product_gid', productGid)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!product?.image_url || !product.product_url) {
      res.status(400).json({ error: 'Ce produit n’a pas d’image ou d’URL. Synchronisez le catalogue.' });
      return;
    }
    if (product.product_status && product.product_status !== 'ACTIVE') {
      res.status(400).json({ error: 'Seuls les produits actifs peuvent devenir des pins.' });
      return;
    }

    const { data: existing } = await client
      .from('pins')
      .select('id, status, title')
      .eq('shop_id', shop.id)
      .eq('link', product.product_url)
      .in('status', ['draft', 'scheduled', 'published'])
      .limit(1)
      .maybeSingle();
    if (existing) {
      res.status(200).json({ pin: existing, created: false });
      return;
    }

    const used = await pinsCreatedThisMonth(shop.id);
    const limit = await shopPinLimit(shop.id);
    if (used >= limit) {
      res.status(402).json({ error: `Quota mensuel atteint (${used}/${limit}).`, used, limit });
      return;
    }

    const title = String(product.title).replace(/\s+/g, ' ').trim().slice(0, 100);
    const description = `${title}. Voir le produit.`.slice(0, 800);
    const { data: pin, error: insertError } = await client
      .from('pins')
      .insert({
        user_id: null,
        shop_id: shop.id,
        title,
        description,
        image_url: product.image_url,
        link: product.product_url,
        status: 'draft',
        source: 'shopify',
        alt_text: title.slice(0, 500),
        hashtags: [],
      })
      .select('id, status, title, link')
      .single();
    if (insertError || !pin) throw new Error(insertError?.message || 'Insert failed');
    res.status(201).json({ pin, created: true });
  } catch (error) {
    console.error('[shopify] generate', error);
    await reportError(error, { route: 'shopify/pins/generate' });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Generate failed' });
  }
}
