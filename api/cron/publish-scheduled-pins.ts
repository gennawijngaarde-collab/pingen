import {
  createServiceClient,
  createUserClient,
  getServiceRoleKey,
  publishDuePins,
  type PublishOptions,
} from '../../server/publishScheduledPins.js';
import {
  authenticate,
  bearerToken,
  clientIp,
  jsonBody,
  rateLimit,
  safeEqual,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function parseOptions(req: ApiRequest): PublishOptions {
  const body = jsonBody(req);
  const rawIds = Array.isArray(body.pinIds)
    ? body.pinIds
    : typeof body.pinId === 'string'
      ? [body.pinId]
      : [];
  const pinIds = rawIds.filter((id): id is string => typeof id === 'string' && UUID_RE.test(id)).slice(0, 50);

  return {
    pinIds: pinIds.length > 0 ? pinIds : undefined,
    scope: body.scope === 'all' ? 'all' : 'due',
  };
}

/**
 * Publishes every scheduled pin that is due.
 *
 * Two callers are accepted:
 *  - Automation (GitHub Actions / Vercel Cron): `Authorization: Bearer <CRON_SECRET>`.
 *    Uses the service-role key to cover all users. CRON_SECRET must be set in
 *    Vercel; there is deliberately no fallback value in the code.
 *  - A signed-in user (in-app button): `Authorization: Bearer <Supabase JWT>`.
 *    Runs under RLS, so only that user's pins are published. Optional JSON body:
 *    `{ pinId }` / `{ pinIds: [] }` to publish specific pins immediately (even if
 *    scheduled later), or `{ scope: 'all' }` to publish every scheduled pin now.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const token = bearerToken(req);
  if (!token) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const cronSecret = (process.env.CRON_SECRET || '').trim();
  const isCronCaller = cronSecret.length >= 16 && safeEqual(token, cronSecret);

  try {
    if (isCronCaller) {
      const client = createServiceClient();
      if (!client) {
        res.status(503).json({
          success: false,
          mode: 'cron',
          error: getServiceRoleKey()
            ? 'SUPABASE_URL missing'
            : 'SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel. The automated publisher needs it to read all users\u2019 scheduled pins (RLS).',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const result = await publishDuePins(client, { timeBudgetMs: 45_000 });
      console.log('[cron] publish result:', JSON.stringify(result));
      res.status(200).json({ success: true, mode: 'cron', ...result, timestamp: new Date().toISOString() });
      return;
    }

    if (!rateLimit(`publish:${clientIp(req)}`, 30, 60_000)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const user = await authenticate(req);
    if (!user) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }
    if (!rateLimit(`publish:user:${user.id}`, 20, 60_000)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }

    const client = createUserClient(user.token);
    if (!client) {
      res.status(503).json({ error: 'Supabase is not configured on the server' });
      return;
    }
    // Only signed-in users may publish ahead of schedule or target specific pins (RLS scopes them).
    const options = { ...parseOptions(req), timeBudgetMs: 40_000 };
    const result = await publishDuePins(client, options);
    console.log(`[user ${user.id}] publish result (${JSON.stringify(options)}):`, JSON.stringify(result));
    res.status(200).json({ success: true, mode: 'user', ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[publish-scheduled-pins] error:', error);
    res.status(500).json({
      success: false,
      error: 'Publication failed. Please retry.',
      timestamp: new Date().toISOString(),
    });
  }
}
