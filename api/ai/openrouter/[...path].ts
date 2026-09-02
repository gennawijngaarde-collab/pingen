interface VercelRequest {
  method?: string;
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
  json: (body: Record<string, unknown>) => void;
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

function pickString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const apiKey = (process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) {
    res.status(401).json({ error: { message: 'OPENROUTER_API_KEY absente.' } });
    return;
  }

  const rawPath = req.query?.path;
  const pathAfter = Array.isArray(rawPath)
    ? `/${rawPath.map(encodeURIComponent).join('/')}`
    : rawPath
      ? `/${encodeURIComponent(rawPath)}`
      : '/';

  const url = `https://openrouter.ai/api/v1${pathAfter}`;
  const appUrl = pickString(process.env.VITE_APP_URL) || 'https://www.pingenx.io';

  const upstream = await fetch(url, {
    method: req.method || 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-OpenRouter-Title': 'PinGen',
    },
    body: req.method === 'GET' || req.method === 'HEAD' ? undefined : JSON.stringify(req.body ?? {}),
  });

  const text = await upstream.text();
  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
  res.send(text);
}

