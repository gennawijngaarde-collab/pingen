import { reportError } from '../../server/sentry.js';
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
import { looksLikeJwt, verifyGitHubOidcToken } from '../../server/githubOidc.js';
import { runMaintenance } from '../../server/maintenance.js';

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
 * Two kinds of callers are accepted:
 *  - Automation, using the service-role key to cover all users:
 *      • Vercel Cron: `Authorization: Bearer <CRON_SECRET>` (no fallback value in code);
 *      • GitHub Actions: `Authorization: Bearer <GitHub OIDC id token>` — signed by
 *        GitHub for this repository's `main` branch, no shared secret required.
 *    Automation runs also perform housekeeping (Stripe webhook provisioning,
 *    subscription reconciliation).
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
  let automation: string | null = cronSecret.length >= 16 && safeEqual(token, cronSecret) ? 'cron-secret' : null;
  if (!automation && looksLikeJwt(token)) {
    const github = await verifyGitHubOidcToken(token).catch(() => null);
    if (github) automation = `github:${github.event}:${github.runId}`;
  }

  try {
    if (automation) {
      if (!rateLimit(`publish:automation:${clientIp(req)}`, 12, 60_000)) {
        res.status(429).json({ error: 'Too many requests' });
        return;
      }
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
      const startedAt = Date.now();
      const result = await publishDuePins(client, { timeBudgetMs: 40_000 });
      console.log(`[cron ${automation}] publish result:`, JSON.stringify(result));
      // Housekeeping (Stripe webhook provisioning, subscription reconciliation) in the remaining budget.
      const maintenance = await runMaintenance(startedAt + 52_000).catch((error) => {
        console.error('[cron] maintenance failed:', error);
        void reportError(error, { route: 'cron/maintenance' });
        return null;
      });
      res.status(200).json({
        success: true,
        mode: 'cron',
        caller: automation.split(':')[0],
        ...result,
        maintenance,
        timestamp: new Date().toISOString(),
      });
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
    await reportError(error, { route: 'cron/publish-scheduled-pins' });
    res.status(500).json({
      success: false,
      error: 'Publication failed. Please retry.',
      timestamp: new Date().toISOString(),
    });
  }
}
