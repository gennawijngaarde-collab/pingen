interface VercelRequest {
  method?: string;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 8) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  const from = (process.env.RESEND_FROM || 'GX <contact@hrtech-studio.com>').trim();
  const adminEmail = (process.env.ADMIN_EMAIL || 'genna.wijngaarde@gmail.com').trim();

  if (!isConfiguredKey(apiKey)) {
    res.status(200).json({ ok: false, skipped: true, error: 'RESEND_API_KEY absente' });
    return;
  }

  const body =
    typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};
  const type = typeof body.type === 'string' ? body.type : 'signup';
  const email = typeof body.email === 'string' ? body.email.trim() : '';
  const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : '';
  if (!email.includes('@')) {
    res.status(400).json({ error: 'email requis' });
    return;
  }

  const subject = type === 'signup' ? `Nouvelle inscription GX — ${email}` : `GX — ${type}`;
  const html = `<p>Nouvelle inscription GX.</p>
<p><strong>Nom :</strong> ${escapeHtml(fullName || '—')}</p>
<p><strong>Email :</strong> ${escapeHtml(email)}</p>`;

  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to: [adminEmail],
      subject,
      html,
    }),
  });

  const data = (await sent.json()) as { id?: string; message?: string };
  if (!sent.ok) {
    res.status(sent.status).json({ ok: false, error: data.message || 'Échec Resend' });
    return;
  }

  res.status(200).json({ ok: true, id: data.id || null });
}

