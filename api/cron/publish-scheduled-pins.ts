import {
  createServiceClient,
  createUserClient,
  getServiceRoleKey,
  getSupabaseAnonKey,
  getSupabaseUrl,
  publishDuePins,
} from '../../server/publishScheduledPins.js';

interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
  setHeader: (name: string, value: string) => void;
}

// Fallback keeps the automated cron working even if CRON_SECRET is not set in Vercel.
const FALLBACK_CRON_SECRET = 'VcEg+YXh4z1rjMKfQU1TaECWSCIZoxmG0uA/8484Pxw=';

function header(req: VercelRequest, name: string): string {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return (Array.isArray(raw) ? raw[0] : raw) || '';
}

async function resolveUserId(token: string): Promise<string | null> {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string };
    return user.id || null;
  } catch {
    return null;
  }
}

/**
 * Publishes every scheduled pin that is due.
 *
 * Two callers are accepted:
 *  - Automation (GitHub Actions / Vercel Cron): `Authorization: Bearer <CRON_SECRET>`
 *    or the `x-vercel-cron` header. Uses the service-role key to cover all users.
 *  - A signed-in user (in-app button): `Authorization: Bearer <Supabase JWT>`.
 *    Runs under RLS, so only that user's pins are published.
 */
export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'GET' && req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const auth = header(req, 'authorization');
  const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
  const cronSecret = (process.env.CRON_SECRET || '').trim() || FALLBACK_CRON_SECRET;
  const isVercelCron = Boolean(header(req, 'x-vercel-cron'));
  const isCronCaller = isVercelCron || (token !== '' && token === cronSecret);

  try {
    if (isCronCaller) {
      const client = createServiceClient();
      if (!client) {
        res.status(503).json({
          success: false,
          mode: 'cron',
          error: getServiceRoleKey()
            ? 'SUPABASE_URL missing'
            : 'SUPABASE_SERVICE_ROLE_KEY is not configured in Vercel. The automated publisher needs it to read all users\u2019 scheduled pins (RLS). Add it in Vercel → Settings → Environment Variables.',
          timestamp: new Date().toISOString(),
        });
        return;
      }
      const result = await publishDuePins(client);
      console.log('[cron] publish result:', JSON.stringify(result));
      res.status(200).json({ success: true, mode: 'cron', ...result, timestamp: new Date().toISOString() });
      return;
    }

    if (!token) {
      res.status(401).json({ error: 'Authentication required' });
      return;
    }
    const userId = await resolveUserId(token);
    if (!userId) {
      res.status(401).json({ error: 'Invalid or expired session' });
      return;
    }
    const client = createUserClient(token);
    if (!client) {
      res.status(503).json({ error: 'Supabase is not configured on the server' });
      return;
    }
    const result = await publishDuePins(client);
    console.log(`[user ${userId}] publish result:`, JSON.stringify(result));
    res.status(200).json({ success: true, mode: 'user', ...result, timestamp: new Date().toISOString() });
  } catch (error) {
    console.error('[publish-scheduled-pins] error:', error);
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
