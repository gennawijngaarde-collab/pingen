import { canonicalAppUrl } from './http.js';

export const PINTEREST_DEFAULT_APP_ID = '1609578';
export const PINTEREST_SCOPES = ['boards:read', 'boards:write', 'pins:read', 'pins:write', 'user_accounts:read'];

export function pinterestAppId(): string {
  const envAppId = (process.env.VITE_PINTEREST_APP_ID || process.env.PINTEREST_APP_ID || '').trim();
  return envAppId && envAppId !== '1606177' && envAppId !== '1607362' ? envAppId : PINTEREST_DEFAULT_APP_ID;
}

export function pinterestAppSecret(): string {
  return (process.env.PINTEREST_APP_SECRET || '').trim();
}

export function pinterestRedirectUri(): string {
  const appUrl = canonicalAppUrl();
  const isLocal = appUrl.includes('localhost') || appUrl.includes('127.0.0.1');
  return `${isLocal ? appUrl : 'https://www.pingenx.io'}/dashboard/settings`;
}

/** Redirect URIs registered on the Pinterest app; the token exchange refuses anything else. */
export function allowedPinterestRedirectUris(): string[] {
  return Array.from(
    new Set([
      pinterestRedirectUri(),
      'https://www.pingenx.io/dashboard/settings',
      'https://pingenx.io/dashboard/settings',
      ...(process.env.VERCEL_ENV !== 'production' ? ['http://localhost:5173/dashboard/settings'] : []),
    ])
  );
}
