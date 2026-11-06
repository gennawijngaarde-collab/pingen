import { reportError } from '../../../server/sentry.js';
import { bearerToken, type ApiRequest, type ApiResponse } from '../../../server/http.js';
import { loadShop, requireService, shopifyGraphql, verifySessionToken } from '../../../server/shopify.js';

interface ProductsData {
  products: {
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
    edges: Array<{
      node: {
        id: string;
        title: string;
        handle: string;
        status: string;
        onlineStoreUrl: string | null;
        featuredImage: { url: string } | null;
      };
    }>;
  };
}

const QUERY = `query Products($cursor: String) {
  products(first: 50, after: $cursor) {
    pageInfo { hasNextPage endCursor }
    edges {
      node { id title handle status onlineStoreUrl featuredImage { url } }
    }
  }
}`;

/** Pulls up to 250 products into shopify_products. Does not create pins. */
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
  try {
    const client = requireService();
    let cursor: string | null = null;
    let imported = 0;
    for (let page = 0; page < 5; page++) {
      const data: ProductsData = await shopifyGraphql<ProductsData>(shop.shop_domain, shop.token, QUERY, { cursor });
      const rows = data.products.edges.map(({ node }) => ({
        shop_id: shop.id,
        product_gid: node.id,
        title: node.title.slice(0, 500),
        handle: node.handle,
        image_url: node.featuredImage?.url || null,
        product_url: node.onlineStoreUrl || `https://${shop.shop_domain}/products/${node.handle}`,
        product_status: node.status,
        synced_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }));
      if (rows.length > 0) {
        const { error } = await client.from('shopify_products').upsert(rows, { onConflict: 'shop_id,product_gid' });
        if (error) throw new Error(error.message);
        imported += rows.length;
      }
      if (!data.products.pageInfo.hasNextPage) break;
      cursor = data.products.pageInfo.endCursor;
    }
    res.status(200).json({ imported });
  } catch (error) {
    console.error('[shopify] sync', error);
    await reportError(error, { route: 'shopify/products/sync' });
    res.status(502).json({ error: error instanceof Error ? error.message : 'Sync failed' });
  }
}
