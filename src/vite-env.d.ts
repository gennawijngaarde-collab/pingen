/// <reference types="vite/client" />

// Only public values may be exposed to the browser through VITE_* variables.
// Secrets (OpenRouter, Grok, Pinterest secret, Stripe secret, Resend, Supabase
// service role, CRON_SECRET) are read server-side in api/ and server/ only.
interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_PINTEREST_APP_ID?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  /** Monitoring (public keys) */
  readonly VITE_SENTRY_DSN?: string;
  readonly VITE_POSTHOG_KEY?: string;
  readonly VITE_POSTHOG_HOST?: string;
  /** Injected by Vercel when system env vars are exposed */
  readonly VITE_VERCEL_GIT_COMMIT_SHA?: string;
  readonly VITE_VERCEL_ENV?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
