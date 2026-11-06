import type { ApiRequest, ApiResponse } from '../../server/http.js';
import auth from '../../server/shopify/http/auth.js';
import authCallback from '../../server/shopify/http/authCallback.js';
import billing from '../../server/shopify/http/billing.js';
import pinsApprove from '../../server/shopify/http/pinsApprove.js';
import pinsGenerate from '../../server/shopify/http/pinsGenerate.js';
import pinterestCallback from '../../server/shopify/http/pinterestCallback.js';
import pinterestStart from '../../server/shopify/http/pinterestStart.js';
import productsSync from '../../server/shopify/http/productsSync.js';
import session from '../../server/shopify/http/session.js';
import webhooks from '../../server/shopify/http/webhooks.js';

/**
 * One Vercel function for every Shopify route. The Hobby plan allows 12
 * functions per deployment, and the SaaS API already uses 11.
 */
export const config = { api: { bodyParser: false } };

type Handler = (req: ApiRequest, res: ApiResponse) => unknown | Promise<unknown>;

const routes: Record<string, Handler> = {
  auth,
  'auth/callback': authCallback,
  billing,
  'pins/approve': pinsApprove,
  'pins/generate': pinsGenerate,
  'pinterest/callback': pinterestCallback,
  'pinterest/start': pinterestStart,
  'products/sync': productsSync,
  session,
  webhooks,
};

function queryText(value: string | string[] | undefined): string {
  if (Array.isArray(value)) return value.filter(Boolean).join('/');
  return typeof value === 'string' ? value : '';
}

function routeKey(req: ApiRequest): string {
  // Vercel matches only one segment of this catch-all. Nested routes are
  // rewritten to /api/shopify/dispatch?section=&action= so the OAuth
  // callback and the other two-segment paths stay on this single function.
  const section = queryText(req.query?.section);
  const action = queryText(req.query?.action);
  if (section && action) return `${section}/${action}`;

  const fromQuery = queryText(req.query?.path);
  if (fromQuery && fromQuery !== 'dispatch') return fromQuery;
  const pathname = (req.url || '').split('?')[0];
  const marker = '/api/shopify/';
  const index = pathname.indexOf(marker);
  const fromPath = index >= 0 ? pathname.slice(index + marker.length).replace(/\/+$/, '') : '';
  return fromPath === 'dispatch' ? '' : fromPath;
}

type RawRequest = ApiRequest & Partial<AsyncIterable<Buffer | string>>;

async function ensureRawBody(req: RawRequest): Promise<void> {
  if (typeof req.body === 'string' || Buffer.isBuffer(req.body)) return;
  if (typeof req[Symbol.asyncIterator] !== 'function') return;
  const chunks: Buffer[] = [];
  let size = 0;
  for await (const chunk of req as AsyncIterable<Buffer | string>) {
    const buf = typeof chunk === 'string' ? Buffer.from(chunk) : chunk;
    size += buf.length;
    if (size > 1_000_000) throw new Error('payload too large');
    chunks.push(buf);
  }
  req.body = Buffer.concat(chunks).toString('utf8');
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  const key = routeKey(req);
  const route = routes[key];
  if (!route) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await ensureRawBody(req);
  await route(req, res);
}
