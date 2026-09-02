interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 4) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const appId = (process.env.VITE_PINTEREST_APP_ID || process.env.PINTEREST_APP_ID || '').trim();
  const appSecret = (process.env.PINTEREST_APP_SECRET || process.env.VITE_PINTEREST_APP_SECRET || '').trim();
  if (!isConfiguredKey(appId) || !isConfiguredKey(appSecret)) {
    res.status(500).json({
      error: 'Pinterest App ID / Secret manquants. Configure-les dans les variables Vercel.',
    });
    return;
  }

  const body =
    typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};

  const code = typeof body.code === 'string' ? body.code : '';
  const redirectUri = typeof body.redirect_uri === 'string' ? body.redirect_uri : '';
  const grantType = typeof body.grant_type === 'string' ? body.grant_type : 'authorization_code';
  const refreshToken = typeof body.refresh_token === 'string' ? body.refresh_token : '';

  const params = new URLSearchParams();
  if (grantType === 'refresh_token') {
    if (!refreshToken) {
      res.status(400).json({ error: 'refresh_token requis' });
      return;
    }
    params.set('grant_type', 'refresh_token');
    params.set('refresh_token', refreshToken);
  } else {
    if (!code || !redirectUri) {
      res.status(400).json({ error: 'code et redirect_uri requis' });
      return;
    }
    params.set('grant_type', 'authorization_code');
    params.set('code', code);
    params.set('redirect_uri', redirectUri);
  }

  const basic = Buffer.from(`${appId}:${appSecret}`).toString('base64');
  const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
    method: 'POST',
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });

  const data = (await tokenRes.json()) as Record<string, unknown>;
  if (!tokenRes.ok) {
    res.status(tokenRes.status).json({
      error:
        (typeof data.message === 'string' && data.message) ||
        (typeof data.error === 'string' && data.error) ||
        "Échec de l'échange du token Pinterest",
      details: data,
    });
    return;
  }

  res.status(200).json(data);
}

