import { reportError } from '../../server/sentry.js';
import { createServiceClient } from '../../server/publishScheduledPins.js';
import { resolveAdminEmail } from '../../server/maintenance.js';
import {
  clientIp,
  isConfiguredKey,
  jsonBody,
  rateLimit,
  str,
  type ApiRequest,
  type ApiResponse,
} from '../../server/http.js';

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

const EMAIL_RE = /^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/;

/**
 * Notifies the admin of a new signup. The browser has no session yet when
 * email confirmation is enabled, so instead of a JWT we verify that an auth
 * user with that email really was created in the last few minutes.
 */
export default async function handler(req: ApiRequest, res: ApiResponse) {
  res.setHeader('Cache-Control', 'no-store');
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }
  if (!rateLimit(`notify:${clientIp(req)}`, 5, 10 * 60_000)) {
    res.status(429).json({ error: 'Too many requests' });
    return;
  }

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM || 'GenX <contact@pingenx.io>').trim();
  const adminEmail = isConfiguredKey(apiKey, 8) ? await resolveAdminEmail().catch(() => null) : null;
  if (!adminEmail) {
    res.status(200).json({ ok: false, skipped: true });
    return;
  }

  const body = jsonBody(req);
  const email = str(body.email, 254).trim().toLowerCase();
  const fullName = str(body.fullName, 120).trim();
  if (!EMAIL_RE.test(email)) {
    res.status(400).json({ error: 'valid email required' });
    return;
  }

  const client = createServiceClient();
  if (!client) {
    res.status(200).json({ ok: false, skipped: true });
    return;
  }
  const { data: recent, error } = await client.rpc('signup_recently_created', { p_email: email });
  if (error || recent !== true) {
    // Do not reveal whether the address exists.
    res.status(202).json({ ok: true });
    return;
  }

  const html = `<p>Nouvelle inscription GenX.</p>
<p><strong>Nom :</strong> ${escapeHtml(fullName || '—')}</p>
<p><strong>Email :</strong> ${escapeHtml(email)}</p>`;

  try {
    const sent = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from, to: [adminEmail], subject: `Nouvelle inscription GenX — ${email}`, html }),
      signal: AbortSignal.timeout(15_000),
    });
    if (!sent.ok) {
      console.error('[email/notify] resend failed', sent.status, await sent.text().catch(() => ''));
      res.status(202).json({ ok: false });
      return;
    }
    res.status(200).json({ ok: true });
  } catch (error) {
    console.error('[email/notify] error', error);
    await reportError(error, { route: 'email/notify' });
    res.status(202).json({ ok: false });
  }
}
