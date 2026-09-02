interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

type PaidPlan = 'pro' | 'business';

function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'business';
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

async function stripeGet(
  secretKey: string,
  path: string
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
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

  const sessionId = typeof body.sessionId === 'string' ? body.sessionId : '';
  const userId = typeof body.userId === 'string' ? body.userId : '';
  if (!sessionId || !userId) {
    res.status(400).json({ error: 'sessionId et userId requis' });
    return;
  }

  const result = await stripeGet(secretKey, `/checkout/sessions/${encodeURIComponent(sessionId)}`);
  if (!result.ok) {
    res.status(result.status || 400).json({
      error: stripeError(result.data) || 'Session Stripe introuvable.',
    });
    return;
  }

  const metadata = (result.data.metadata || {}) as Record<string, unknown>;
  const sessionUserId =
    (typeof metadata.user_id === 'string' && metadata.user_id) ||
    (typeof result.data.client_reference_id === 'string' ? result.data.client_reference_id : '');
  const plan = metadata.plan;
  const paymentStatus = result.data.payment_status;
  const status = result.data.status;

  if (sessionUserId !== userId) {
    res.status(403).json({ error: 'Cette session Stripe ne correspond pas à ce compte.' });
    return;
  }
  if (
    status !== 'complete' &&
    paymentStatus !== 'paid' &&
    paymentStatus !== 'no_payment_required'
  ) {
    res.status(400).json({ error: 'Le paiement Stripe n’est pas terminé.' });
    return;
  }
  if (!isPaidPlan(plan)) {
    res.status(400).json({ error: 'Plan Stripe invalide.' });
    return;
  }

  res.status(200).json({
    plan,
    customerId: typeof result.data.customer === 'string' ? result.data.customer : undefined,
    subscriptionId:
      typeof result.data.subscription === 'string' ? result.data.subscription : undefined,
  });
}

