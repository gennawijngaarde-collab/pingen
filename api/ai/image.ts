import { reportError } from '../../server/sentry.js';
import { lookup } from 'node:dns/promises';
import { isIP } from 'node:net';
import {
  authenticate,
  clientIp,
  consumeQuota,
  isConfiguredKey,
  jsonBody,
  quotaExceeded,
  rateLimit,
  str,
  unauthorized,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';

const MAX_IMAGE_BYTES = 15 * 1024 * 1024;
const MAX_REDIRECTS = 3;

function pickQuery(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getProxyUrl(req: ApiRequest): string {
  const fromQuery = pickQuery(req.query?.proxy);
  if (fromQuery) return fromQuery;
  const raw = req.url || '';
  const search = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  return new URLSearchParams(search).get('proxy') || '';
}

function isPrivateIp(ip: string): boolean {
  if (isIP(ip) === 4) {
    const [a, b] = ip.split('.').map(Number);
    return (
      a === 10 ||
      a === 127 ||
      a === 0 ||
      (a === 169 && b === 254) ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 100 && b >= 64 && b <= 127) ||
      a >= 224
    );
  }
  const lower = ip.toLowerCase();
  return (
    lower === '::' ||
    lower === '::1' ||
    lower.startsWith('fc') ||
    lower.startsWith('fd') ||
    lower.startsWith('fe80') ||
    lower.startsWith('::ffff:')
  );
}

/** Rejects anything that is not a public https host (SSRF guard). */
async function assertPublicHttpsUrl(raw: string): Promise<URL> {
  const url = new URL(raw);
  if (url.protocol !== 'https:') throw new Error('only https images are allowed');
  if (url.username || url.password) throw new Error('credentials in URL are not allowed');
  const host = url.hostname.toLowerCase();
  if (!host || host === 'localhost' || host.endsWith('.localhost') || host.endsWith('.internal') || host.endsWith('.local')) {
    throw new Error('host not allowed');
  }
  if (isIP(host)) {
    if (isPrivateIp(host)) throw new Error('host not allowed');
    return url;
  }
  const addresses = await lookup(host, { all: true });
  if (addresses.length === 0 || addresses.some((a) => isPrivateIp(a.address))) {
    throw new Error('host not allowed');
  }
  return url;
}

async function fetchPublicImage(raw: string): Promise<Response> {
  let current = raw;
  for (let hop = 0; hop <= MAX_REDIRECTS; hop++) {
    const url = await assertPublicHttpsUrl(current);
    const res = await fetch(url, {
      redirect: 'manual',
      signal: AbortSignal.timeout(15_000),
      headers: { Accept: 'image/*', 'User-Agent': 'GenX-ImageProxy/1.0' },
    });
    if (res.status >= 300 && res.status < 400) {
      const location = res.headers.get('location');
      if (!location) throw new Error('redirect without location');
      current = new URL(location, url).toString();
      continue;
    }
    return res;
  }
  throw new Error('too many redirects');
}

function buildGrokPrompt(visualPrompt: string, overlayText?: string): string {
  const text = overlayText?.trim();
  const visual = visualPrompt.trim();
  const parts = [
    'Professional vertical Pinterest pin, 2:3 portrait composition, high-end marketing graphic.',
    'The photograph MUST clearly depict the actual business, product or niche described. No generic nature stock unless the business is about nature.',
    visual,
    text
      ? 'Leave a clean dark area in the lower third for a headline. Do not invent extra slogans.'
      : 'Clean composition without extra captions or UI chrome.',
    'Crisp details, no watermarks, no UI chrome, no logos of real brands, no celebrity faces.',
  ];
  return parts.join(' ').slice(0, 3900);
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  // GET: image proxy used by the canvas compositor (CORS). Public but hardened.
  if (req.method === 'GET') {
    if (!rateLimit(`img-proxy:${clientIp(req)}`, 120, 60_000)) {
      res.status(429).json({ error: 'Too many requests' });
      return;
    }
    const remote = getProxyUrl(req);
    if (!remote || remote.length > 2048) {
      res.status(400).json({ error: 'Invalid image URL' });
      return;
    }
    try {
      const remoteRes = await fetchPublicImage(remote);
      if (!remoteRes.ok) {
        res.status(502).json({ error: 'Unable to load the image.' });
        return;
      }
      const contentType = (remoteRes.headers.get('content-type') || '').split(';')[0].trim().toLowerCase();
      if (!contentType.startsWith('image/') || contentType === 'image/svg+xml') {
        res.status(415).json({ error: 'Not an image' });
        return;
      }
      const declared = Number(remoteRes.headers.get('content-length') || 0);
      if (declared > MAX_IMAGE_BYTES) {
        res.status(413).json({ error: 'Image too large' });
        return;
      }
      const buffer = Buffer.from(await remoteRes.arrayBuffer());
      if (buffer.length > MAX_IMAGE_BYTES) {
        res.status(413).json({ error: 'Image too large' });
        return;
      }
      res.status(200);
      res.setHeader('Content-Type', contentType);
      res.setHeader('X-Content-Type-Options', 'nosniff');
      res.setHeader('Content-Disposition', 'inline');
      res.setHeader('Cache-Control', 'public, max-age=300');
      res.send(buffer);
    } catch {
      res.status(400).json({ error: 'Image URL not allowed' });
    }
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  res.setHeader('Cache-Control', 'no-store');

  if (!rateLimit(`ai-image:${clientIp(req)}`, 30, 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    unauthorized(res);
    return;
  }

  const apiKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) {
    res.status(503).json({ error: 'Image AI is not enabled on this environment.' });
    return;
  }

  const body = jsonBody(req);
  const prompt = str(body.prompt, 3000).trim();
  const overlayText = str(body.overlayText, 120).trim();
  if (!prompt) {
    res.status(400).json({ error: 'prompt is required' });
    return;
  }

  const quota = await consumeQuota(user.token, 'ai_image');
  if (!quota.allowed) {
    quotaExceeded(res, quota, 'ai_image');
    return;
  }

  const fullPrompt = buildGrokPrompt(prompt, overlayText || undefined);

  try {
    const grokRes = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ model: 'grok-imagine-image-quality', prompt: fullPrompt }),
      signal: AbortSignal.timeout(55_000),
    });

    if (!grokRes.ok) {
      const errorData = (await grokRes.json().catch(() => ({}))) as Record<string, unknown>;
      const errorMsg =
        typeof errorData.error === 'object' &&
        errorData.error !== null &&
        'message' in errorData.error &&
        typeof (errorData.error as { message: unknown }).message === 'string'
          ? (errorData.error as { message: string }).message
          : typeof errorData.message === 'string'
            ? errorData.message
            : `Image generation failed (${grokRes.status})`;
      console.error('[ai/image] grok error', grokRes.status, errorMsg);
      res.status(grokRes.status >= 500 ? 502 : grokRes.status).json({ error: errorMsg });
      return;
    }

    const grokData = (await grokRes.json()) as { data?: Array<{ url?: string }> };
    const imageUrl = grokData.data?.[0]?.url;
    if (!imageUrl || !/^https:\/\//i.test(imageUrl)) {
      res.status(502).json({ error: 'No image returned by the image service.' });
      return;
    }

    res.status(200).json({ url: imageUrl });
  } catch (error) {
    console.error('[ai/image] error', error);
    await reportError(error, { route: 'ai/image' });
    res.status(504).json({ error: 'Image generation timed out. Please retry.' });
  }
}
