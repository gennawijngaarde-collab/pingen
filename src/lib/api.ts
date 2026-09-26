import { supabase } from './supabase';

export class ApiError extends Error {
  status: number;
  code?: string;
  constructor(status: number, message: string, code?: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

export class SessionExpiredError extends ApiError {
  constructor() {
    super(401, 'SESSION_EXPIRED', 'SESSION_EXPIRED');
  }
}

async function accessToken(): Promise<string> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new SessionExpiredError();
  return token;
}

/**
 * Calls a GenX API route as the signed-in user (Supabase JWT in Authorization).
 * Throws ApiError with the server's message/code on non-2xx responses.
 */
export async function apiFetch<T = Record<string, unknown>>(
  path: string,
  init: { method?: 'GET' | 'POST'; body?: unknown; headers?: Record<string, string>; timeoutMs?: number } = {}
): Promise<T> {
  const token = await accessToken();
  const res = await fetch(path, {
    method: init.method || (init.body !== undefined ? 'POST' : 'GET'),
    headers: {
      Authorization: `Bearer ${token}`,
      ...(init.body !== undefined ? { 'Content-Type': 'application/json' } : {}),
      ...init.headers,
    },
    body: init.body !== undefined ? JSON.stringify(init.body) : undefined,
    signal: AbortSignal.timeout(init.timeoutMs ?? 60_000),
  });

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  } catch {
    data = {};
  }

  if (res.status === 401) throw new SessionExpiredError();
  if (!res.ok) {
    const rawError = data.error;
    const message =
      typeof rawError === 'string'
        ? rawError
        : rawError && typeof rawError === 'object' && typeof (rawError as { message?: unknown }).message === 'string'
          ? (rawError as { message: string }).message
          : `HTTP ${res.status}`;
    throw new ApiError(res.status, message, typeof data.code === 'string' ? data.code : undefined);
  }
  return data as T;
}

export interface RuntimeConfig {
  ai: { hasTextAi: boolean; hasImageAi: boolean };
  stripe: { configured: boolean; publishableKey: string };
  pinterest: { configured: boolean; appId: string; hasSecret: boolean; redirectUri: string; scopes: string[] };
}

const FALLBACK_CONFIG: RuntimeConfig = {
  ai: { hasTextAi: false, hasImageAi: false },
  stripe: { configured: false, publishableKey: '' },
  pinterest: { configured: false, appId: '', hasSecret: false, redirectUri: '', scopes: [] },
};

let configPromise: Promise<RuntimeConfig> | null = null;

/** Public runtime config (/api/config), fetched once per page load. */
export function fetchRuntimeConfig(): Promise<RuntimeConfig> {
  if (!configPromise) {
    configPromise = fetch('/api/config', { signal: AbortSignal.timeout(12_000) })
      .then(async (res) => {
        if (!res.ok) throw new Error(`config ${res.status}`);
        const data = (await res.json()) as Partial<RuntimeConfig>;
        return {
          ai: { ...FALLBACK_CONFIG.ai, ...data.ai },
          stripe: { ...FALLBACK_CONFIG.stripe, ...data.stripe },
          pinterest: { ...FALLBACK_CONFIG.pinterest, ...data.pinterest },
        };
      })
      .catch(() => {
        configPromise = null;
        return FALLBACK_CONFIG;
      });
  }
  return configPromise;
}
