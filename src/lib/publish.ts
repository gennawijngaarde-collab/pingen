import { supabase } from './supabase';
import type { Dictionary } from '@/i18n/types';

export const PUBLISH_ENDPOINT = '/api/cron/publish-scheduled-pins';

/** Error thrown when no Supabase session is available; translated by the caller. */
export class SessionExpiredError extends Error {
  constructor() {
    super('SESSION_EXPIRED');
    this.name = 'SessionExpiredError';
  }
}

import { fmt } from '@/i18n/fmt';
export { fmt };

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
  if (!token) throw new SessionExpiredError();

  const response = await fetch(PUBLISH_ENDPOINT, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(options),
  });

  const result = (await response.json().catch(() => ({}))) as Partial<PublishNowResult> & { error?: string };
  if (!response.ok) throw new Error(result.error || `HTTP ${response.status}`);

  return {
    processed: result.processed ?? 0,
    successful: result.successful ?? 0,
    failed: result.failed ?? 0,
    awaitingAccess: result.awaitingAccess ?? 0,
    details: Array.isArray(result.details) ? result.details : [],
  };
}

const ACCESS_PENDING_CODE = 'PINTEREST_ACCESS_PENDING';

/** True when a stored `error_message` means "waiting for Pinterest Standard access". */
export function isAccessPendingMessage(message: string | null | undefined): boolean {
  return typeof message === 'string' && message.startsWith(ACCESS_PENDING_CODE);
}

/** Translates a pin's stored error message when it is a known code. */
export function describePinError(message: string | null | undefined, t: Dictionary['publish']): string {
  if (isAccessPendingMessage(message)) return t.awaitingAccessPin;
  return message || t.publishError;
}

/** Translated message for a thrown publish error. */
export function describePublishError(error: unknown, t: Dictionary['publish']): string {
  if (error instanceof SessionExpiredError) return t.sessionExpired;
  return error instanceof Error && error.message ? error.message : t.cannotPublish;
}

/** Human-readable, translated summary of a publish run, for toasts. */
export function describePublishResult(
  result: PublishNowResult,
  t: Dictionary['publish']
): {
  title: string;
  description?: string;
  variant?: 'destructive';
} {
  // Pinterest/API errors are technical and come from the server; access-pending is translated.
  const firstFailure = result.details.find((d) => d.status === 'failed' || d.status === 'retry')?.error;

  if (result.processed === 0) {
    return { title: t.nothingToPublish, description: t.nothingToPublishDesc };
  }
  if (result.awaitingAccess > 0 && result.successful === 0 && result.failed === 0) {
    return {
      title: fmt(t.awaitingAccessTitle, { count: result.awaitingAccess }),
      description: t.awaitingAccessPin,
    };
  }
  if (result.failed > 0) {
    return {
      title:
        result.successful > 0
          ? fmt(t.partialFailure, { ok: result.successful, ko: result.failed })
          : t.publishFailed,
      description: firstFailure,
      variant: 'destructive',
    };
  }
  return {
    title: result.successful === 1 ? t.publishedOne : fmt(t.publishedMany, { count: result.successful }),
    description:
      result.awaitingAccess > 0 ? fmt(t.awaitingAccessShort, { count: result.awaitingAccess }) : undefined,
  };
}
