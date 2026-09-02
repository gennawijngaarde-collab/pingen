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
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

async function stripeForm(
  secretKey: string,
  path: string,
  params: URLSearchParams
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: params,
  });
  const data = (await res.json()) as Record<string, unknown>;
  return { ok: res.ok, status: res.status, data };
}

function stripeError(data: Record<string, unknown>): string {
  const err = data.error;
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message;
  }
  return typeof data.message === 'string' ? data.message : '';
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secretKey = (process.env.STRIPE_SECRET_KEY || process.env.VITE_STRIPE_SECRET_KEY || '').trim();
  if (!isConfiguredKey(secretKey)) {
    res.status(400).json({ error: 'Stripe n’est pas configuré.' });
    return;
  }

  const body =
    typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};

  const customerId = typeof body.customerId === 'string' ? body.customerId : '';
  const returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : '';
  if (!customerId || !returnUrl) {
    res.status(400).json({ error: 'customerId et returnUrl requis' });
    return;
  }

  const params = new URLSearchParams();
  params.set('customer', customerId);
  params.set('return_url', returnUrl);
  const result = await stripeForm(secretKey, '/billing_portal/sessions', params);
  const portalUrl = typeof result.data.url === 'string' ? result.data.url : '';
  if (!result.ok || !portalUrl) {
    res.status(result.status || 400).json({
      error: stripeError(result.data) || 'Impossible d’ouvrir le portail client Stripe.',
    });
    return;
  }

  res.status(200).json({ url: portalUrl });
}

