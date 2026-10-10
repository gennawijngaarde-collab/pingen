/**
 * Error tracking (Sentry) and product analytics (PostHog).
 *
 * Both SDKs are loaded lazily and only when their public key is configured
 * (`VITE_SENTRY_DSN`, `VITE_POSTHOG_KEY`), so the default bundle stays small and
 * no third-party request is made on environments without monitoring.
 *
 * Privacy: PostHog runs cookieless (memory persistence), only identified users
 * get a person profile, inputs are masked in session data, and no IP is stored.
 */
import type * as SentryType from '@sentry/react';
import type { PostHog } from 'posthog-js';

type Sentry = typeof SentryType;

const sentryDsn = (import.meta.env.VITE_SENTRY_DSN as string | undefined)?.trim() || '';
const posthogKey = (import.meta.env.VITE_POSTHOG_KEY as string | undefined)?.trim() || '';
const posthogHost = (import.meta.env.VITE_POSTHOG_HOST as string | undefined)?.trim() || 'https://eu.i.posthog.com';
const release = (import.meta.env.VITE_VERCEL_GIT_COMMIT_SHA as string | undefined)?.slice(0, 12);
const environment = (import.meta.env.VITE_VERCEL_ENV as string | undefined) || import.meta.env.MODE;

let sentry: Promise<Sentry | null> | null = null;
let posthog: Promise<PostHog | null> | null = null;

export const monitoringEnabled = { sentry: Boolean(sentryDsn), posthog: Boolean(posthogKey) };

function loadSentry(): Promise<Sentry | null> {
  if (!sentryDsn) return Promise.resolve(null);
  if (!sentry) {
    sentry = import('@sentry/react')
      .then((mod) => {
        mod.init({
          dsn: sentryDsn,
          release,
          environment,
          tracesSampleRate: 0,
          ignoreErrors: [
            'SESSION_EXPIRED',
            'QUOTA_EXCEEDED',
            'PIN_LIMIT_REACHED',
            'AUTOPILOT_DISABLED',
            /ResizeObserver loop/,
            /Load failed/,
            /Failed to fetch/,
          ],
          beforeSend(event) {
            if (event.request?.url) event.request.url = event.request.url.split('?')[0];
            return event;
          },
        });
        return mod;
      })
      .catch(() => null);
  }
  return sentry;
}

function loadPostHog(): Promise<PostHog | null> {
  if (!posthogKey) return Promise.resolve(null);
  if (!posthog) {
    posthog = import('posthog-js')
      .then(({ default: ph }) => {
        ph.init(posthogKey, {
          api_host: posthogHost,
          persistence: 'memory',
          person_profiles: 'identified_only',
          capture_pageview: false,
          capture_pageleave: true,
          autocapture: false,
          disable_session_recording: true,
          mask_all_text: true,
          mask_all_element_attributes: true,
          ip: false,
          respect_dnt: true,
        });
        if (release) ph.register({ release, environment });
        return ph;
      })
      .catch(() => null);
  }
  return posthog;
}

export function initMonitoring(): void {
  void loadSentry();
  void loadPostHog();
}

export function captureException(error: unknown, context?: Record<string, unknown>): void {
  void loadSentry().then((s) => s?.captureException(error, context ? { extra: context } : undefined));
}

export function identifyUser(user: { id: string; plan?: string | null; locale?: string }): void {
  void loadSentry().then((s) => s?.setUser({ id: user.id }));
  void loadPostHog().then((ph) => {
    ph?.identify(user.id, { plan: user.plan ?? 'starter', locale: user.locale });
  });
}

export function resetUser(): void {
  void loadSentry().then((s) => s?.setUser(null));
  void loadPostHog().then((ph) => ph?.reset());
}

export type AnalyticsEvent =
  | 'signup_completed'
  | 'login_completed'
  | 'pin_generated'
  | 'pin_saved'
  | 'pin_published_manually'
  | 'autopilot_toggled'
  | 'autopilot_generate_now'
  | 'pinterest_connected'
  | 'checkout_started'
  | 'plan_activated'
  | 'subscription_cancelled'
  | 'language_changed'
  | 'quota_hit';

export function track(event: AnalyticsEvent, properties?: Record<string, string | number | boolean | null>): void {
  void loadPostHog().then((ph) => ph?.capture(event, properties));
}

export function trackPageview(path: string): void {
  void loadPostHog().then((ph) => ph?.capture('$pageview', { $current_url: `${window.location.origin}${path}` }));
}
