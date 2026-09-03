interface VercelRequest {
  method?: string;
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

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const envAppId = (process.env.VITE_PINTEREST_APP_ID || process.env.PINTEREST_APP_ID || '').trim();
  const appId = envAppId && envAppId !== '1606177' ? envAppId : '1607362';
  const secret = (process.env.PINTEREST_APP_SECRET || process.env.VITE_PINTEREST_APP_SECRET || '').trim();
  const configured = isConfiguredKey(appId) && isConfiguredKey(secret);
  const appUrl = (process.env.VITE_APP_URL || 'https://www.pingenx.io').trim().replace(/\/$/, '');
  const isLocal = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  const redirectBase = isLocal ? appUrl : 'https://www.pingenx.io';
  const redirectUri = `${redirectBase}/dashboard/settings`;

  res.status(200).json({
    configured,
    appId: isConfiguredKey(appId) ? appId : '',
    hasSecret: isConfiguredKey(secret),
    redirectUri,
    scopes: ['boards:read', 'boards:write', 'pins:read', 'pins:write', 'user_accounts:read'],
  });
}

