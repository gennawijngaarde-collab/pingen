import { supabase } from './supabase';

export const PUBLISH_ENDPOINT = '/api/cron/publish-scheduled-pins';

export interface PublishDetail {
  pinId: string;
  status: 'published' | 'retry' | 'failed' | 'awaiting_access';
  pinterestPinId?: string;
  error?: string;
}

export interface PublishNowResult {
  processed: number;
  successful: number;
  failed: number;
  awaitingAccess: number;
  details: PublishDetail[];
}

export interface PublishNowOptions {
  /** Publish these pins immediately, even if scheduled for later. */
  pinIds?: string[];
  /** 'due' (default): overdue pins only. 'all': every scheduled pin, including future ones. */
  scope?: 'due' | 'all';
}

/**
 * Publishes pins on Pinterest through the server-side engine (token refresh,
 * board resolution, retries). Requires a signed-in user; RLS scopes the pins.
 */
export async function publishPinsNow(options: PublishNowOptions = {}): Promise<PublishNowResult> {
  const { data: { session } } = await supabase.auth.getSession();
  const token = session?.access_token;
  if (!token) throw new Error('Session expirée, reconnecte-toi.');

  const response = await fetch(PUBLISH_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  const result = (await response.json().catch(() => ({}))) as Partial<PublishNowResult> & { error?: string };
  if (!response.ok) throw new Error(result.error || `Erreur ${response.status}`);

  return {
    processed: result.processed ?? 0,
    successful: result.successful ?? 0,
    failed: result.failed ?? 0,
    awaitingAccess: result.awaitingAccess ?? 0,
    details: Array.isArray(result.details) ? result.details : [],
  };
}

/** Human-readable summary of a publish run, for toasts. */
export function describePublishResult(result: PublishNowResult): {
  title: string;
  description?: string;
  variant?: 'destructive';
} {
  const firstError = result.details.find((d) => d.error)?.error;

  if (result.processed === 0) {
    return {
      title: 'Aucun pin à publier',
      description: 'Aucun pin programmé ne correspond à cette action.',
    };
  }
  if (result.awaitingAccess > 0 && result.successful === 0) {
    return {
      title: `${result.awaitingAccess} pin(s) en attente d'approbation Pinterest`,
      description: firstError,
    };
  }
  if (result.failed > 0) {
    return {
      title: result.successful > 0 ? `${result.successful} publié(s), ${result.failed} échec(s)` : 'Publication impossible',
      description: firstError,
      variant: 'destructive',
    };
  }
  return {
    title: result.successful === 1 ? 'Pin publié sur Pinterest !' : `${result.successful} pins publiés sur Pinterest !`,
    description: result.awaitingAccess > 0 ? `${result.awaitingAccess} pin(s) en attente d'approbation Pinterest.` : undefined,
  };
}
