/**
 * Minimal Sentry reporter for the serverless functions (no SDK: keeps cold
 * starts small). Sends an error event through the envelope endpoint derived
 * from SENTRY_DSN. No-op when the DSN is not configured.
 */
interface Dsn {
  endpoint: string;
  publicKey: string;
}

function parseDsn(raw: string): Dsn | null {
  try {
    const url = new URL(raw);
    const projectId = url.pathname.replace(/^\/+/, '');
    if (!url.username || !projectId) return null;
    return {
      endpoint: `${url.protocol}//${url.host}/api/${projectId}/envelope/`,
      publicKey: url.username,
    };
  } catch {
    return null;
  }
}

const dsn = parseDsn((process.env.SENTRY_DSN || '').trim());
const environment = process.env.VERCEL_ENV || process.env.NODE_ENV || 'development';
const release = (process.env.VERCEL_GIT_COMMIT_SHA || '').slice(0, 12) || undefined;

export function sentryEnabled(): boolean {
  return dsn !== null;
}

function parseStack(stack: string | undefined) {
  if (!stack) return undefined;
  const frames = stack
    .split('\n')
    .slice(1)
    .map((line) => line.trim().match(/^at (?:(.+?) \()?(.+?):(\d+):(\d+)\)?$/))
    .filter((m): m is RegExpMatchArray => m !== null)
    .map((m) => ({ function: m[1] || '<anonymous>', filename: m[2], lineno: Number(m[3]), colno: Number(m[4]) }))
    .reverse();
  return frames.length ? { frames } : undefined;
}

/**
 * Reports an exception with optional context (route, user id, extra data).
 * Never throws and never blocks the response for more than a few seconds.
 */
export async function reportError(
  error: unknown,
  context: { route?: string; userId?: string; tags?: Record<string, string>; extra?: Record<string, unknown> } = {}
): Promise<void> {
  if (!dsn) return;
  const err = error instanceof Error ? error : new Error(typeof error === 'string' ? error : JSON.stringify(error));
  const eventId = crypto.randomUUID().replace(/-/g, '');
  const timestamp = new Date().toISOString();

  const event = {
    event_id: eventId,
    timestamp,
    platform: 'node',
    level: 'error',
    environment,
    release,
    server_name: 'vercel',
    transaction: context.route,
    tags: { runtime: 'vercel-function', ...(context.route ? { route: context.route } : {}), ...context.tags },
    user: context.userId ? { id: context.userId } : undefined,
    extra: context.extra,
    exception: {
      values: [{ type: err.name || 'Error', value: err.message, stacktrace: parseStack(err.stack) }],
    },
  };

  const envelope =
    JSON.stringify({ event_id: eventId, sent_at: timestamp, dsn: process.env.SENTRY_DSN }) +
    '\n' +
    JSON.stringify({ type: 'event' }) +
    '\n' +
    JSON.stringify(event) +
    '\n';

  try {
    await fetch(dsn.endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-sentry-envelope',
        'X-Sentry-Auth': `Sentry sentry_version=7, sentry_client=genx-server/1.0, sentry_key=${dsn.publicKey}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(3000),
    });
  } catch {
    // Monitoring must never break the request.
  }
}
