import { isConfiguredKey } from './http.js';

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function resendFrom(): string {
  return (process.env.RESEND_FROM || 'GenX <contact@pingenx.io>').trim();
}

export function resendConfigured(): boolean {
  return isConfiguredKey(process.env.RESEND_API_KEY, 8);
}

export async function sendResendEmail(input: {
  to: string;
  subject: string;
  html: string;
}): Promise<boolean> {
  const apiKey = (process.env.RESEND_API_KEY || '').trim();
  if (!resendConfigured()) return false;
  const sent = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: resendFrom(), to: [input.to], subject: input.subject, html: input.html }),
    signal: AbortSignal.timeout(15_000),
  });
  if (!sent.ok) {
    console.error('[email] resend failed', sent.status, await sent.text().catch(() => ''));
    return false;
  }
  return true;
}
