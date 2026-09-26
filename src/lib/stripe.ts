import { apiFetch, fetchRuntimeConfig } from './api';

export type PaidPlan = 'pro' | 'business';

export interface StripeStatus {
  configured: boolean;
  publishableKey: string;
}

export async function fetchStripeStatus(): Promise<StripeStatus> {
  const config = await fetchRuntimeConfig();
  return config.stripe;
}

/** Starts Stripe Checkout for the signed-in user (identity is taken from the session server-side). */
export async function startStripeCheckout(plan: PaidPlan): Promise<void> {
  const origin = window.location.origin;
  const data = await apiFetch<{ url?: string }>('/api/stripe/checkout', {
    body: {
      plan,
      successUrl: `${origin}/dashboard/settings?tab=billing&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${origin}/dashboard/settings?tab=billing&canceled=1`,
    },
  });
  if (!data.url) throw new Error('Stripe Checkout unavailable');
  window.location.assign(data.url);
}

/**
 * Confirms a Checkout session. The server verifies the payment with Stripe and
 * activates the plan itself; the browser only refreshes the profile afterwards.
 */
export async function confirmStripeCheckout(
  sessionId: string
): Promise<{ plan: PaidPlan; customerId?: string; subscriptionId?: string }> {
  const data = await apiFetch<{ plan?: PaidPlan; customerId?: string; subscriptionId?: string }>(
    '/api/stripe/confirm',
    { body: { sessionId } }
  );
  if (!data.plan) throw new Error('Stripe payment not confirmed');
  return { plan: data.plan, customerId: data.customerId, subscriptionId: data.subscriptionId };
}

/** Downgrades to Starter (cancels the Stripe subscription at period end when one exists). */
export async function cancelSubscription(): Promise<{ scheduledDowngrade: boolean }> {
  const data = await apiFetch<{ scheduledDowngrade?: boolean }>('/api/stripe/confirm', {
    body: { action: 'cancel' },
  });
  return { scheduledDowngrade: Boolean(data.scheduledDowngrade) };
}

/** Opens the Stripe customer portal for the signed-in user's own customer. */
export async function openStripePortal(): Promise<void> {
  const data = await apiFetch<{ url?: string }>('/api/stripe/portal', {
    body: { returnUrl: `${window.location.origin}/dashboard/settings?tab=billing` },
  });
  if (!data.url) throw new Error('Stripe portal unavailable');
  window.location.assign(data.url);
}
