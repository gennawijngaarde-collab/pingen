import { timingSafeEqual } from 'node:crypto';
import { getSupabaseAnonKey, getSupabaseUrl } from './publishScheduledPins.js';

/**
 * Minimal request/response shapes shared by every Vercel function.
 * (Kept local so the API layer does not depend on `@vercel/node` types.)
 */
export interface ApiRequest {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface ApiResponse {
  status: (code: number) => ApiResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string | Buffer) => void;
  json: (body: Record<string, unknown>) => void;
}

export function header(req: ApiRequest, name: string): string {
  const raw = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return (Array.isArray(raw) ? raw[0] : raw) || '';
}

export function bearerToken(req: ApiRequest, headerName = 'authorization'): string {
  const value = header(req, headerName);
  return value.startsWith('Bearer ') ? value.slice(7).trim() : '';
}

export function jsonBody(req: ApiRequest): Record<string, unknown> {
  const raw = req.body;
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>;
  return {};
}

export function str(value: unknown, max = 2000): string {
  return typeof value === 'string' ? value.slice(0, max) : '';
}

export function isConfiguredKey(raw: string | undefined, minLength = 10): boolean {
  const key = (raw || '').trim();
  if (key.length < minLength) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

/** Constant-time string comparison (secrets, signatures). */
export function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length || bufA.length === 0) return false;
  return timingSafeEqual(bufA, bufB);
}

export interface AuthenticatedUser {
  id: string;
  email: string;
  token: string;
}

/**
 * Verifies the Supabase JWT sent by the browser and returns the user.
 * Verification is delegated to Supabase Auth, so revoked sessions are rejected.
 */
export async function authenticate(req: ApiRequest): Promise<AuthenticatedUser | null> {
  const token = bearerToken(req);
  if (!token || token.length > 4096) return null;
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return null;
  try {
    const res = await fetch(`${url}/auth/v1/user`, {
      headers: { Authorization: `Bearer ${token}`, apikey: anonKey },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string; email?: string };
    if (!user.id) return null;
    return { id: user.id, email: user.email || '', token };
  } catch {
    return null;
  }
}

export function unauthorized(res: ApiResponse, message = 'Authentication required'): void {
  res.status(401).json({ error: message });
}

/** Origins the app is served from: only these may receive redirects. */
export function allowedOrigins(): string[] {
  const origins = new Set<string>(['https://www.pingenx.io', 'https://pingenx.io']);
  const appUrl = (process.env.VITE_APP_URL || process.env.APP_URL || '').trim().replace(/\/$/, '');
  if (appUrl) origins.add(appUrl);
  if (process.env.VERCEL_ENV !== 'production') {
    origins.add('http://localhost:5173');
    origins.add('http://127.0.0.1:5173');
  }
  return Array.from(origins);
}

export function canonicalAppUrl(): string {
  const appUrl = (process.env.VITE_APP_URL || process.env.APP_URL || '').trim().replace(/\/$/, '');
  return appUrl || 'https://www.pingenx.io';
}

/** True when `candidate` is an absolute URL on one of our origins (prevents open redirects). */
export function isAllowedAppUrl(candidate: string): boolean {
  try {
    const url = new URL(candidate);
    return allowedOrigins().includes(url.origin);
  } catch {
    return false;
  }
}

/**
 * Best-effort in-memory rate limiter (per warm function instance).
 * Cheap first line of defence against tight loops; hard quotas live in the DB.
 */
const buckets = new Map<string, { count: number; resetAt: number }>();
export function rateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    if (buckets.size > 5000) {
      for (const [k, v] of buckets) if (v.resetAt <= now) buckets.delete(k);
    }
    return true;
  }
  bucket.count += 1;
  return bucket.count <= limit;
}

/**
 * Real client IP. Behind Cloudflare the trustworthy value is `cf-connecting-ip`
 * (x-forwarded-for then starts with the visitor IP followed by Cloudflare's).
 */
export function clientIp(req: ApiRequest): string {
  const cloudflare = header(req, 'cf-connecting-ip');
  if (cloudflare) return cloudflare;
  const forwarded = header(req, 'x-forwarded-for');
  return forwarded.split(',')[0]?.trim() || header(req, 'x-real-ip') || 'unknown';
}

export type QuotaKind = 'ai_text' | 'ai_image' | 'publish';

export interface QuotaResult {
  allowed: boolean;
  used: number;
  limit: number;
  plan: string;
  scope?: 'day' | 'month' | 'global';
}

/**
 * Consumes one unit of the caller's daily quota (enforced in Postgres, per plan).
 * Fails open only when Supabase itself is unreachable, so an outage never
 * blocks paying users; abuse protection is still guaranteed by the DB when up.
 */
export async function consumeQuota(userToken: string, kind: QuotaKind): Promise<QuotaResult> {
  const url = getSupabaseUrl();
  const anonKey = getSupabaseAnonKey();
  if (!url || !anonKey) return { allowed: true, used: 0, limit: 0, plan: 'unknown' };
  try {
    const res = await fetch(`${url}/rest/v1/rpc/consume_quota`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        Authorization: `Bearer ${userToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ p_kind: kind }),
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      console.error('[quota] rpc failed', res.status, await res.text().catch(() => ''));
      return { allowed: true, used: 0, limit: 0, plan: 'unknown' };
    }
    const data = (await res.json()) as Partial<QuotaResult>;
    return {
      allowed: data.allowed !== false,
      used: Number(data.used) || 0,
      limit: Number(data.limit) || 0,
      plan: typeof data.plan === 'string' ? data.plan : 'unknown',
      scope: data.scope === 'global' || data.scope === 'month' ? data.scope : 'day',
    };
  } catch (error) {
    console.error('[quota] rpc error', error);
    return { allowed: true, used: 0, limit: 0, plan: 'unknown' };
  }
}

export function quotaExceeded(res: ApiResponse, quota: QuotaResult, kind: QuotaKind): void {
  if (quota.scope === 'global') {
    // Platform-wide AI budget reached for today: not the user's fault, retry later.
    res.setHeader('Retry-After', '3600');
    res.status(503).json({ error: 'AI_CAPACITY: the AI service is at capacity today, please retry later', code: 'AI_CAPACITY' });
    return;
  }
  const period = quota.scope === 'month' ? 'monthly' : 'daily';
  res.setHeader('Retry-After', quota.scope === 'month' ? '86400' : '3600');
  res.status(429).json({
    error: `QUOTA_EXCEEDED: ${period} ${kind} limit (${quota.limit}) reached for plan ${quota.plan}`,
    code: 'QUOTA_EXCEEDED',
    kind,
    period,
    limit: quota.limit,
    plan: quota.plan,
  });
}
