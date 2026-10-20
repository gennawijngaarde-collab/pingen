import { reportError } from './sentry.js';
import { canonicalAppUrl } from './http.js';
import { createServiceClient } from './publishScheduledPins.js';
import { escapeHtml, resendConfigured, sendResendEmail } from './email.js';

export interface TrialReminderResult {
  due: number;
  sent: number;
  skipped: number;
  errors: number;
}

interface TrialReminderRow {
  user_id: string;
  email: string;
  plan: string;
  trial_end: string;
}

function formatTrialEnd(iso: string, locale: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return new Intl.DateTimeFormat(locale, { dateStyle: 'long', timeStyle: 'short', timeZone: 'UTC' }).format(date);
}

function reminderCopy(plan: string, trialEnd: string): { locale: string; subject: string; html: string } {
  const billingUrl = `${canonicalAppUrl()}/dashboard/settings?tab=billing`;
  const planLabel = plan === 'business' ? 'Business' : 'Pro';
  const when = formatTrialEnd(trialEnd, 'fr-FR');
  return {
    locale: 'fr',
    subject: `Votre essai gratuit ${planLabel} se termine dans 2 jours`,
    html: `<p>Bonjour,</p>
<p>Votre essai gratuit <strong>GenX ${escapeHtml(planLabel)}</strong> se termine le <strong>${escapeHtml(when)} UTC</strong> (dans 2 jours).</p>
<p>Ensuite, l’abonnement sera facturé automatiquement. Pour ne rien payer, annulez avant cette date depuis vos paramètres de facturation.</p>
<p><a href="${escapeHtml(billingUrl)}">Gérer mon abonnement</a></p>
<p>Your 7-day free trial ends in 2 days. Cancel before then to avoid being charged.</p>
<p>— PinGen</p>`,
  };
}

/**
 * Emails users ~2 days before Stripe trial_end. Idempotent via trial_reminder_sent_at.
 * Runs from the existing daily/automation cron (Hobby allows only one Vercel cron).
 */
export async function sendTrialReminders(): Promise<TrialReminderResult> {
  const result: TrialReminderResult = { due: 0, sent: 0, skipped: 0, errors: 0 };
  if (!resendConfigured()) {
    result.skipped = 1;
    return result;
  }
  const client = createServiceClient();
  if (!client) {
    result.skipped = 1;
    return result;
  }

  const { data, error } = await client.rpc('trial_reminders_due');
  if (error) {
    console.error('[trial-reminder] rpc failed', error.message);
    await reportError(error, { route: 'trial-reminder' });
    result.errors++;
    return result;
  }

  const rows = (Array.isArray(data) ? data : []) as TrialReminderRow[];
  result.due = rows.length;

  for (const row of rows) {
    if (!row.email || !row.user_id || !row.trial_end) {
      result.skipped++;
      continue;
    }
    const copy = reminderCopy(row.plan, row.trial_end);
    try {
      const ok = await sendResendEmail({ to: row.email, subject: copy.subject, html: copy.html });
      if (!ok) {
        result.errors++;
        continue;
      }
      const { error: markError } = await client
        .from('subscriptions')
        .update({ trial_reminder_sent_at: new Date().toISOString() })
        .eq('user_id', row.user_id)
        .is('trial_reminder_sent_at', null);
      if (markError) {
        console.error('[trial-reminder] mark sent failed', markError.message);
        result.errors++;
        continue;
      }
      result.sent++;
    } catch (err) {
      result.errors++;
      console.error('[trial-reminder] send failed', row.user_id, err);
      await reportError(err, { route: 'trial-reminder', userId: row.user_id });
    }
  }

  return result;
}
