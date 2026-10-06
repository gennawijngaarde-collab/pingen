import { createPublicKey, verify as cryptoVerify, type JsonWebKey } from 'node:crypto';

/**
 * Verifies GitHub Actions OIDC ID tokens so the auto-publish workflow can call
 * the API without a shared secret: GitHub signs a short-lived JWT that proves
 * the request comes from a workflow run of *this* repository on `main`.
 * Forks and other repositories get a different `repository_id` and are rejected.
 */

const ISSUER = 'https://token.actions.githubusercontent.com';
const JWKS_URL = `${ISSUER}/.well-known/jwks`;
export const GITHUB_OIDC_AUDIENCE = 'pingenx-cron';

// Numeric ids survive renames/transfers; both are public information.
const REPOSITORY_ID = (process.env.GITHUB_REPOSITORY_ID || '1327876725').trim();
const REPOSITORY_OWNER_ID = (process.env.GITHUB_REPOSITORY_OWNER_ID || '224803482').trim();
const ALLOWED_REF = (process.env.GITHUB_OIDC_REF || 'refs/heads/main').trim();
const ALLOWED_EVENTS = new Set(['schedule', 'workflow_dispatch']);

interface Jwk extends JsonWebKey {
  kid?: string;
  alg?: string;
  use?: string;
}

interface Claims {
  iss?: string;
  aud?: string | string[];
  exp?: number;
  nbf?: number;
  iat?: number;
  repository?: string;
  repository_id?: string;
  repository_owner_id?: string;
  ref?: string;
  event_name?: string;
  workflow?: string;
  run_id?: string;
}

let jwksCache: { keys: Jwk[]; fetchedAt: number } | null = null;
const JWKS_TTL_MS = 6 * 60 * 60 * 1000;

async function loadJwks(force = false): Promise<Jwk[]> {
  if (!force && jwksCache && Date.now() - jwksCache.fetchedAt < JWKS_TTL_MS) return jwksCache.keys;
  const res = await fetch(JWKS_URL, { signal: AbortSignal.timeout(8_000) });
  if (!res.ok) throw new Error(`JWKS fetch failed (${res.status})`);
  const data = (await res.json()) as { keys?: Jwk[] };
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache = { keys, fetchedAt: Date.now() };
  return keys;
}

function decodeSegment<T>(segment: string): T | null {
  try {
    return JSON.parse(Buffer.from(segment, 'base64url').toString('utf8')) as T;
  } catch {
    return null;
  }
}

export function looksLikeJwt(token: string): boolean {
  return /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token);
}

export interface GitHubCaller {
  repository: string;
  ref: string;
  event: string;
  workflow: string;
  runId: string;
}

/** Returns the verified workflow identity, or null when the token is not an acceptable GitHub OIDC token. */
export async function verifyGitHubOidcToken(token: string): Promise<GitHubCaller | null> {
  if (!looksLikeJwt(token)) return null;
  const [h, p, s] = token.split('.');
  const headerPart = decodeSegment<{ alg?: string; kid?: string; typ?: string }>(h);
  const claims = decodeSegment<Claims>(p);
  if (!headerPart || !claims || headerPart.alg !== 'RS256' || !headerPart.kid) return null;
  // Cheap claim checks first so we do not fetch JWKS for random JWTs (e.g. Supabase sessions).
  if (claims.iss !== ISSUER) return null;

  const now = Math.floor(Date.now() / 1000);
  if (typeof claims.exp !== 'number' || claims.exp <= now) return null;
  if (typeof claims.nbf === 'number' && claims.nbf > now + 60) return null;
  if (typeof claims.iat === 'number' && claims.iat > now + 60) return null;

  const audiences = Array.isArray(claims.aud) ? claims.aud : [claims.aud];
  if (!audiences.includes(GITHUB_OIDC_AUDIENCE)) return null;
  if (claims.repository_id !== REPOSITORY_ID) return null;
  if (claims.repository_owner_id !== REPOSITORY_OWNER_ID) return null;
  if (claims.ref !== ALLOWED_REF) return null;
  if (!claims.event_name || !ALLOWED_EVENTS.has(claims.event_name)) return null;

  let key = (await loadJwks()).find((k) => k.kid === headerPart.kid);
  if (!key) key = (await loadJwks(true)).find((k) => k.kid === headerPart.kid);
  if (!key || (key.alg && key.alg !== 'RS256')) return null;

  const publicKey = createPublicKey({ key, format: 'jwk' });
  const ok = cryptoVerify('RSA-SHA256', Buffer.from(`${h}.${p}`), publicKey, Buffer.from(s, 'base64url'));
  if (!ok) return null;

  return {
    repository: claims.repository || '',
    ref: claims.ref || '',
    event: claims.event_name || '',
    workflow: claims.workflow || '',
    runId: claims.run_id || '',
  };
}
