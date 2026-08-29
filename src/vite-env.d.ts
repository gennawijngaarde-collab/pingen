/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_APP_URL?: string;
  readonly VITE_APP_NAME?: string;
  readonly VITE_SUPABASE_URL?: string;
  readonly VITE_SUPABASE_ANON_KEY?: string;
  readonly VITE_OPENROUTER_API_KEY?: string;
  readonly VITE_OPENAI_API_KEY?: string;
  readonly VITE_IDEOGRAM_API_KEY?: string;
  readonly VITE_PINTEREST_APP_ID?: string;
  readonly VITE_PINTEREST_APP_SECRET?: string;
  readonly VITE_STRIPE_PUBLISHABLE_KEY?: string;
  readonly VITE_STRIPE_SECRET_KEY?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
