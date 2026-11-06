import { reportError } from '../../../server/sentry.js';
import { bearerToken, jsonBody, str, type ApiRequest, type ApiResponse } from '../../../server/http.js';
import { loadShop, requireService, verifySessionToken } from '../../../server/shopify.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Explicit merchant approval. Moves one draft to scheduled.
 * The cron publishes it only after this.
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
  const pinId = str(jsonBody(req).pinId, 80);
  if (!UUID_RE.test(pinId)) {
    res.status(400).json({ error: 'pinId requis' });
    return;
  }
  const when = new Date();
  when.setMinutes(when.getMinutes() + 2);
  try {
    const client = requireService();
    const { data: account } = await client
      .from('shop_pinterest_accounts')
      .select('id')
      .eq('shop_id', shop.id)
      .eq('is_active', true)
      .maybeSingle();
    if (!account) {
      res.status(409).json({ error: 'Connectez Pinterest avant de valider un pin.' });
      return;
    }
    const now = new Date().toISOString();
    const { data, error } = await client
      .from('pins')
      .update({
        status: 'scheduled',
        approved_at: now,
        scheduled_at: when.toISOString(),
        updated_at: now,
        error_message: null,
      })
      .eq('id', pinId)
      .eq('shop_id', shop.id)
      .eq('status', 'draft')
      .select('id, status, scheduled_at, approved_at')
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!data) {
      res.status(404).json({ error: 'Brouillon introuvable.' });
      return;
    }
    res.status(200).json({ pin: data });
  } catch (error) {
    console.error('[shopify] approve', error);
    await reportError(error, { route: 'shopify/pins/approve' });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Approve failed' });
  }
}
