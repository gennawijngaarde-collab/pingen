import { reportError } from '../../../server/sentry.js';
import {
  authenticate,
  clientIp,
  isConfiguredKey,
  jsonBody,
  rateLimit,
  str,
  unauthorized,
  type ApiRequest,
  type ApiResponse,
} from '../../../server/http.js';
import { allowedPinterestRedirectUris, pinterestAppId, pinterestAppSecret } from '../../../server/pinterestApp.js';

/**
 * Exchanges an OAuth code (or refresh token) for Pinterest tokens using the
 * app secret. Only signed-in GenX users may use it, and only with one of our
 * registered redirect URIs, so the app credentials cannot be borrowed by
 * third parties.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!rateLimit(`pin-oauth:${clientIp(req)}`, 20, 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    unauthorized(res);
    return;
  }

  const appId = pinterestAppId();
  const appSecret = pinterestAppSecret();
  if (!isConfiguredKey(appId, 4) || !isConfiguredKey(appSecret, 4)) {
    res.status(503).json({ error: 'Pinterest integration is not configured on the server.' });
    return;
  }

  const body = jsonBody(req);
  const grantType = body.grant_type === 'refresh_token' ? 'refresh_token' : 'authorization_code';
  const params = new URLSearchParams();

  if (grantType === 'refresh_token') {
    const refreshToken = str(body.refresh_token, 2048);
    if (!refreshToken) {
      res.status(400).json({ error: 'refresh_token is required' });
      return;
    }
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', refreshToken);
  } else {
    const code = str(body.code, 2048);
    const redirectUri = str(body.redirect_uri, 500);
    if (!code || !redirectUri) {
      res.status(400).json({ error: 'code and redirect_uri are required' });
      return;
    }
    if (!allowedPinterestRedirectUris().includes(redirectUri)) {
      res.status(400).json({ error: 'redirect_uri is not registered for this app' });
      return;
    }
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', redirectUri);
  }

  const basic = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  try {
    const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${basic}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
      signal: AbortSignal.timeout(20_000),
    });

    const data = (await tokenRes.json().catch(() => ({}))) as Record<string, unknown>;
    if (!tokenRes.ok) {
      console.error('[pinterest/oauth] exchange failed', tokenRes.status, data.message || data.error);
      res.status(tokenRes.status === 401 || tokenRes.status === 400 ? 400 : 502).json({
        error:
          (typeof data.message === 'string' && data.message) ||
          (typeof data.error === 'string' && data.error) ||
          'Pinterest token exchange failed',
      });
      return;
    }

    res.status(200).json({
      access_token: data.access_token,
      refresh_token: data.refresh_token,
      expires_in: data.expires_in,
      refresh_token_expires_in: data.refresh_token_expires_in,
      scope: data.scope,
      token_type: data.token_type,
    });
  } catch (error) {
    console.error('[pinterest/oauth] error', error);
    await reportError(error, { route: 'pinterest/oauth/token' });
    res.status(504).json({ error: 'Pinterest did not answer in time. Please retry.' });
  }
}
