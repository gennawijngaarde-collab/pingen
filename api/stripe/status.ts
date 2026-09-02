interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const secretKey = (process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || '').trim();
  const publishableKey = (process.env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim();
  res.status(200).json({
    configured: isConfiguredKey(secretKey),
    publishableKey: isConfiguredKey(publishableKey) ? publishableKey : '',
  });
}

