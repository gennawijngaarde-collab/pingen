import { reportError } from '../../server/sentry.js';
import {
  authenticate,
  canonicalAppUrl,
  clientIp,
  consumeQuota,
  isConfiguredKey,
  jsonBody,
  quotaExceeded,
  rateLimit,
  unauthorized,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';

/** Only these models may be requested; anything else is silently mapped to the default. */
const ALLOWED_MODELS = new Set(['google/gemini-2.5-flash', 'google/gemini-2.5-flash-lite']);
const DEFAULT_MODEL = 'google/gemini-2.5-flash';
const MAX_TOKENS_CAP = 1500;
const MAX_MESSAGES = 12;
const MAX_TEXT_CHARS = 12_000;
const MAX_IMAGE_DATA_URL = 6_000_000;

type Part = { type: 'text'; text: string } | { type: 'image_url'; image_url: { url: string } };
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string | Part[];
}

function sanitizeMessages(raw: unknown): Message[] | null {
  if (!Array.isArray(raw) || raw.length === 0 || raw.length > MAX_MESSAGES) return null;
  const out: Message[] = [];
  let textBudget = MAX_TEXT_CHARS;

  for (const item of raw) {
    if (!item || typeof item !== 'object') return null;
    const { role, content } = item as { role?: unknown; content?: unknown };
    if (role !== 'system' && role !== 'user' && role !== 'assistant') return null;

    if (typeof content === 'string') {
      textBudget -= content.length;
      if (textBudget < 0) return null;
      out.push({ role, content });
      continue;
    }

    if (!Array.isArray(content) || content.length === 0 || content.length > 6) return null;
    const parts: Part[] = [];
    for (const part of content) {
      if (!part || typeof part !== 'object') return null;
      const p = part as { type?: unknown; text?: unknown; image_url?: { url?: unknown } };
      if (p.type === 'text' && typeof p.text === 'string') {
        textBudget -= p.text.length;
        if (textBudget < 0) return null;
        parts.push({ type: 'text', text: p.text });
      } else if (p.type === 'image_url' && typeof p.image_url?.url === 'string') {
        const url = p.image_url.url;
        const ok =
          (/^https:\/\//i.test(url) && url.length < 2048) ||
          (/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(url) && url.length < MAX_IMAGE_DATA_URL);
        if (!ok) return null;
        parts.push({ type: 'image_url', image_url: { url } });
      } else {
        return null;
      }
    }
    out.push({ role, content: parts });
  }
  return out;
}

/**
 * Text generation proxy (OpenRouter). Authenticated, model-pinned, token-capped
 * and metered per user/day so a single account cannot drain the AI budget.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }
  if (!rateLimit(`ai-chat:${clientIp(req)}`, 60, 60_000)) {
    res.status(429).json({ error: { message: 'Too many requests' } });
    return;
  }

  const user = await authenticate(req);
  if (!user) {
    unauthorized(res);
    return;
  }

  const apiKey = (process.env.OPENROUTER_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) {
    res.status(503).json({ error: { message: 'Text AI is not enabled on this environment.' } });
    return;
  }

  const body = jsonBody(req);
  const messages = sanitizeMessages(body.messages);
  if (!messages) {
    res.status(400).json({ error: { message: 'Invalid messages payload' } });
    return;
  }

  const requestedModel = typeof body.model === 'string' ? body.model : DEFAULT_MODEL;
  const model = ALLOWED_MODELS.has(requestedModel) ? requestedModel : DEFAULT_MODEL;
  const maxTokens = Math.min(
    MAX_TOKENS_CAP,
    Math.max(16, Number.isFinite(Number(body.max_tokens)) ? Number(body.max_tokens) : 600)
  );
  const temperature =
    typeof body.temperature === 'number' && body.temperature >= 0 && body.temperature <= 1.5 ? body.temperature : undefined;
  const responseFormat =
    body.response_format && typeof body.response_format === 'object' && (body.response_format as { type?: unknown }).type === 'json_object'
      ? { type: 'json_object' }
      : undefined;

  const quota = await consumeQuota(user.token, 'ai_text');
  if (!quota.allowed) {
    quotaExceeded(res, quota, 'ai_text');
    return;
  }

  try {
    const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': canonicalAppUrl(),
        'X-OpenRouter-Title': 'GenX',
        'X-User-Id': user.id,
      },
      body: JSON.stringify({ model, messages, max_tokens: maxTokens, temperature, response_format: responseFormat }),
      signal: AbortSignal.timeout(50_000),
    });

    const text = await upstream.text();
    res.status(upstream.status);
    res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
    res.send(text);
  } catch (error) {
    console.error('[ai/chat] upstream error', error);
    await reportError(error, { route: 'ai/chat' });
    res.status(504).json({ error: { message: 'The AI service did not answer in time. Please retry.' } });
  }
}
