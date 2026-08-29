export type PaidPlan = 'pro' | 'business';

export interface StripeStatus {
  configured: boolean;
  publishableKey: string;
}

export async function fetchStripeStatus(): Promise<StripeStatus> {
  try {
    const res = await fetch('/api/stripe/status');
    if (!res.ok) {
      return { configured: false, publishableKey: '' };
    }
    return (await res.json()) as StripeStatus;
  } catch {
    return { configured: false, publishableKey: '' };
  }
}

export async function startStripeCheckout(
  plan: PaidPlan,
  userId: string,
  email: string
): Promise<void> {
  const origin = window.location.origin;
  const res = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      plan,
      userId,
      email,
      successUrl: `${origin}/dashboard/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard/settings?tab=billing&canceled=1`,
    }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Impossible de démarrer le paiement Stripe.');
  }
  window.location.assign(data.url);
}

export async function confirmStripeCheckout(
  sessionId: string,
  userId: string
): Promise<{ plan: PaidPlan; customerId?: string; subscriptionId?: string }> {
  const res = await fetch('/api/stripe/confirm', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, userId }),
  });
  const data = (await res.json()) as {
    plan?: PaidPlan;
    customerId?: string;
    subscriptionId?: string;
    error?: string;
  };
  if (!res.ok || !data.plan) {
    throw new Error(data.error || 'Paiement Stripe non confirmé.');
  }
  return {
    plan: data.plan,
    customerId: data.customerId,
    subscriptionId: data.subscriptionId,
  };
}

export async function openStripePortal(customerId: string): Promise<void> {
  const res = await fetch('/api/stripe/portal', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      customerId,
      returnUrl: `${window.location.origin}/dashboard/settings?tab=billing`,
    }),
  });
  const data = (await res.json()) as { url?: string; error?: string };
  if (!res.ok || !data.url) {
    throw new Error(data.error || 'Impossible d’ouvrir le portail Stripe.');
  }
  window.location.assign(data.url);
}
