interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

const PLAN_AMOUNTS = {
  pro: 1900,
  business: 4900,
} as const;

type PaidPlan = keyof typeof PLAN_AMOUNTS;

function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'business';
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
  params: URLSearchParams,
  method: 'POST' | 'GET' = 'POST'
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : params,
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
  const pricePro = (process.env.STRIPE_PRICE_PRO || '').trim();
  const priceBusiness = (process.env.STRIPE_PRICE_BUSINESS || '').trim();
  if (!isConfiguredKey(secretKey)) {
    res.status(400).json({ error: 'Stripe n’est pas configuré. Ajoute STRIPE_SECRET_KEY sur Vercel.' });
    return;
  }

  const body =
    typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};

  const plan = body.plan;
  const userId = typeof body.userId === 'string' ? body.userId : '';
  const email = typeof body.email === 'string' ? body.email : '';
  const successUrl = typeof body.successUrl === 'string' ? body.successUrl : '';
  const cancelUrl = typeof body.cancelUrl === 'string' ? body.cancelUrl : '';

  if (!isPaidPlan(plan) || !userId || !successUrl || !cancelUrl) {
    res.status(400).json({ error: 'plan, userId, successUrl et cancelUrl requis' });
    return;
  }

  const params = new URLSearchParams();
  params.set('mode', 'subscription');
  params.set('client_reference_id', userId);
  params.set('success_url', successUrl);
  params.set('cancel_url', cancelUrl);
  params.set('metadata[user_id]', userId);
  params.set('metadata[plan]', plan);
  params.set('subscription_data[metadata][user_id]', userId);
  params.set('subscription_data[metadata][plan]', plan);
  if (email) params.set('customer_email', email);

  const priceId = plan === 'pro' ? pricePro : priceBusiness;
  if (isConfiguredKey(priceId)) {
    params.set('line_items[0][price]', priceId);
    params.set('line_items[0][quantity]', '1');
  } else {
    params.set('line_items[0][quantity]', '1');
    params.set('line_items[0][price_data][currency]', 'eur');
    params.set('line_items[0][price_data][unit_amount]', String(PLAN_AMOUNTS[plan]));
    params.set('line_items[0][price_data][recurring][interval]', 'month');
    params.set(
      'line_items[0][price_data][product_data][name]',
      plan === 'pro' ? 'PinGen Pro' : 'PinGen Business'
    );
  }

  const result = await stripeForm(secretKey, '/checkout/sessions', params, 'POST');
  const checkoutUrl = typeof result.data.url === 'string' ? result.data.url : '';
  if (!result.ok || !checkoutUrl) {
    res.status(result.status || 400).json({
      error: stripeError(result.data) || 'Impossible de créer la session Stripe Checkout.',
    });
    return;
  }

  res.status(200).json({ url: checkoutUrl });
}

