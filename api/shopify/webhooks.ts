import { reportError } from '../../server/sentry.js';
import { header, type ApiRequest, type ApiResponse } from '../../server/http.js';
import {
  deleteShopData,
  markShopUninstalled,
  normalizeShopDomain,
  requireService,
  verifyWebhookHmac,
} from '../../server/shopify.js';

export const config = { api: { bodyParser: false } };

type RawRequest = ApiRequest & Partial<AsyncIterable<Buffer | string>>;

async function readRawBody(req: RawRequest): Promise<string> {
  if (typeof req.body === 'string') return req.body;
  if (Buffer.isBuffer(req.body)) return req.body.toString('utf8');
  if (typeof req[Symbol.asyncIterator] === 'function') {
    const chunks: Buffer[] = [];
    let size = 0;
    for await (const chunk of req as AsyncIterable<Buffer | string>) {
      const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
      size += buf.length;
      if (size > 1_000_000) throw new Error('payload too large');
      chunks.push(buf);
    }
    return Buffer.concat(chunks).toString('utf8');
  }
  return req.body && typeof req.body === 'object' ? JSON.stringify(req.body) : '';
}

/**
 * Shopify webhooks, including the mandatory GDPR topics.
 * HMAC is checked on the raw body. A repeated webhook id is acknowledged and ignored.
 */
export default async function handler(req: RawRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const raw = await readRawBody(req);
  if (!verifyWebhookHmac(raw, header(req, 'x-shopify-hmac-sha256'))) {
    res.status(401).json({ error: 'Invalid HMAC' });
    return;
  }
  const topic = header(req, 'x-shopify-topic');
  const webhookId = header(req, 'x-shopify-webhook-id') || `${topic}:${header(req, 'x-shopify-triggered-at')}`;
  const shop = normalizeShopDomain(header(req, 'x-shopify-shop-domain'));
  if (!shop) {
    res.status(400).json({ error: 'Missing shop' });
    return;
  }

  try {
    const client = requireService();
    const { error: dup } = await client.from('shopify_webhook_events').insert({
      webhook_id: webhookId,
      shop_domain: shop,
      topic: topic || 'unknown',
    });
    if (dup && (dup.code === '23505' || /duplicate|unique/i.test(dup.message))) {
      res.status(200).json({ ok: true, duplicate: true });
      return;
    }

    if (topic === 'app/uninstalled') await markShopUninstalled(shop);
    else if (topic === 'shop/redact') await deleteShopData(shop);
    else if (topic === 'customers/redact' || topic === 'customers/data_request') {
      // GenX does not store Shopify customer records. The event row is the audit trail.
    } else if (topic === 'products/delete') {
      const body = JSON.parse(raw) as { admin_graphql_api_id?: string; id?: number };
      const gid = body.admin_graphql_api_id || (body.id ? `gid://shopify/Product/${body.id}` : '');
      const loaded = await client.from('shopify_shops').select('id').eq('shop_domain', shop).maybeSingle();
      if (gid && loaded.data?.id) {
        await client.from('shopify_products').delete().eq('shop_id', loaded.data.id).eq('product_gid', gid);
      }
    } else if (topic === 'app_subscriptions/update') {
      const body = JSON.parse(raw) as {
        app_subscription?: { admin_graphql_api_id?: string; status?: string; name?: string };
      };
      const status = (body.app_subscription?.status || '').toLowerCase();
      const mapped =
        status === 'active' ? 'active' : status === 'frozen' ? 'frozen' : status === 'cancelled' || status === 'canceled' ? 'cancelled' : 'expired';
      const loaded = await client.from('shopify_shops').select('id').eq('shop_domain', shop).maybeSingle();
      if (loaded.data?.id) {
        await client
          .from('shopify_subscriptions')
          .update({
            status: mapped,
            shopify_charge_gid: body.app_subscription?.admin_graphql_api_id || null,
            updated_at: new Date().toISOString(),
          })
          .eq('shop_id', loaded.data.id);
      }
    }

    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[shopify] webhook', topic, error);
    await reportError(error, { route: 'shopify/webhooks' });
    res.status(500).json({ error: 'Webhook failed' });
  }
}
