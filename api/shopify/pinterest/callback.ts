import { reportError } from '../../../server/sentry.js';
import { canonicalAppUrl, type ApiRequest, type ApiResponse } from '../../../server/http.js';
import { pinterestAppId, pinterestAppSecret } from '../../../server/pinterestApp.js';
import { encryptSecret, loadShop, readShopState, requireService, shopifyApiKey } from '../../../server/shopify.js';

function queryString(req: ApiRequest, key: string): string {
  const value = req.query?.[key];
  return (Array.isArray(value) ? value[0] : value) || '';
}

/** Pinterest redirects here. The shop is taken from the signed state, not from the query shop. */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  const code = queryString(req, 'code');
  const shop = readShopState(queryString(req, 'state'));
  if (!code || !shop) {
    res.status(400).json({ error: 'État Pinterest invalide' });
    return;
  }
  const loaded = await loadShop(shop);
  if (!loaded) {
    res.status(404).json({ error: 'Boutique non installée' });
    return;
  }
  const redirectUri = `${canonicalAppUrl()}/api/shopify/pinterest/callback`;
  const basic = Buffer.from(`${pinterestAppId()}:${pinterestAppSecret()}`).toString('base64');
  try {
    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ grant_type: 'authorization_code', code, redirect_uri: redirectUri }),
      signal: AbortSignal.timeout(15_000),
    });
    const token = (await tokenRes.json()) as {
      access_token?: string;
      refresh_token?: string;
      expires_in?: number;
      message?: string;
    };
    if (!tokenRes.ok || !token.access_token) {
      res.status(502).json({ error: token.message || 'Échange du jeton Pinterest refusé' });
      return;
    }
    const me = await fetch('https://api.pinterest.com/v5/user_account', {
      headers: { Authorization: `Bearer ${token.access_token}` },
    });
    const account = (await me.json()) as { username?: string; id?: string };
    const now = new Date().toISOString();
    const { error } = await requireService().from('shop_pinterest_accounts').upsert(
      {
        shop_id: loaded.id,
        pinterest_user_id: account.id || 'unknown',
        username: account.username || shop,
        access_token_enc: encryptSecret(token.access_token),
        refresh_token_enc: token.refresh_token ? encryptSecret(token.refresh_token) : null,
        token_expires_at: new Date(Date.now() + (token.expires_in || 3600) * 1000).toISOString(),
        is_active: true,
        updated_at: now,
      },
      { onConflict: 'shop_id' },
    );
    if (error) throw new Error(error.message);
    res.setHeader('Location', `https://${shop}/admin/apps/${shopifyApiKey()}`);
    res.status(302).send('');
  } catch (error) {
    console.error('[shopify] pinterest callback', error);
    await reportError(error, { route: 'shopify/pinterest/callback' });
    res.status(500).json({ error: error instanceof Error ? error.message : 'Pinterest connect failed' });
  }
}
