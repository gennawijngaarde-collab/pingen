import {
  authenticate,
  bearerToken,
  clientIp,
  header,
  rateLimit,
  unauthorized,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';

const ENDPOINTS: Record<string, string> = {
  user: 'https://api.pinterest.com/v5/user_account',
  boards: 'https://api.pinterest.com/v5/boards?page_size=100',
};

/**
 * Read-only Pinterest proxy (browser cannot call api.pinterest.com directly: CORS).
 *  - `Authorization: Bearer <Supabase JWT>` identifies the GenX user.
 *  - `X-Pinterest-Token: <access token>` is the user's own Pinterest token.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!rateLimit(`pin-proxy:${clientIp(req)}`, 60, 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    unauthorized(res);
    return;
  }

  // Legacy clients sent the Pinterest token in Authorization; new clients use X-Pinterest-Token.
  const accessToken = header(req, 'x-pinterest-token').trim() || bearerToken(req);
  if (!accessToken || accessToken.length > 4096) {
    res.status(400).json({ error: 'Pinterest access token missing' });
    return;
  }

  const url = new URL(req.url || '', 'https://localhost');
  const endpoint = url.searchParams.get('endpoint') || 'user';
  const pinterestUrl = ENDPOINTS[endpoint];
  if (!pinterestUrl) {
    res.status(400).json({ error: 'Unknown endpoint' });
    return;
  }

  try {
    const response = await fetch(pinterestUrl, {
      headers: { Authorization: `Bearer ${accessToken}` },
      signal: AbortSignal.timeout(20_000),
    });
    const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;

    if (!response.ok) {
      res.status(response.status >= 500 ? 502 : response.status).json({
        error: (typeof data.message === 'string' && data.message) || 'Pinterest API error',
      });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    console.error('[pinterest/proxy] error', error);
    res.status(504).json({ error: 'Pinterest did not answer in time. Please retry.' });
  }
}
