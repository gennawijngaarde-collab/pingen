import type { Dictionary } from '@/i18n/types';
import { fmt } from '@/i18n/fmt';
import { ApiError, SessionExpiredError } from './api';

export type AppErrorCode =
  | 'PIN_LIMIT_REACHED'
  | 'QUOTA_EXCEEDED'
  | 'QUOTA_EXCEEDED_MONTH'
  | 'AI_CAPACITY'
  | 'AUTOPILOT_DISABLED'
  | 'AUTOPILOT_REQUIRES_PRO'
  | 'AUTOPILOT_DAILY_LIMIT'
  | 'SESSION_EXPIRED'
  | 'TOO_MANY_REQUESTS'
  | 'IMAGE_UPLOAD_FAILED'
  | 'UNKNOWN';

export class AppError extends Error {
  code: AppErrorCode;
  limit?: number;
  constructor(code: AppErrorCode, message?: string, limit?: number) {
    super(message || code);
    this.name = 'AppError';
    this.code = code;
    this.limit = limit;
  }
}

/** Server/database error codes that the UI knows how to translate. Checked in order. */
const KNOWN_CODES: readonly AppErrorCode[] = [
  'PIN_LIMIT_REACHED',
  'AI_CAPACITY',
  'AUTOPILOT_REQUIRES_PRO',
  'AUTOPILOT_DAILY_LIMIT',
  'AUTOPILOT_DISABLED',
  'QUOTA_EXCEEDED',
];

/** True when the message carries one of our machine-readable codes (kept verbatim for translation). */
export function hasKnownErrorCode(message: string): boolean {
  return KNOWN_CODES.some((code) => message.includes(code));
}

function extractLimit(message: string): number | undefined {
  // "… limit (300) reached …" or "AUTOPILOT_DAILY_LIMIT: 3 autopilot pins per day …"
  const match = /\((\d+)\)/.exec(message) ?? /:\s*(\d+)\b/.exec(message);
  return match ? Number(match[1]) : undefined;
}

function fromCodeAndMessage(code: string | undefined, message: string, period?: unknown): AppError | null {
  const found = KNOWN_CODES.find((known) => code === known || message.includes(known));
  if (!found) return null;
  if (found === 'QUOTA_EXCEEDED') {
    const monthly = period === 'monthly' || /\bmonthly\b/i.test(message);
    return new AppError(monthly ? 'QUOTA_EXCEEDED_MONTH' : 'QUOTA_EXCEEDED', message, extractLimit(message));
  }
  return new AppError(found, message, extractLimit(message));
}

/** Normalises Supabase / API / network errors into a known code. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof SessionExpiredError) return new AppError('SESSION_EXPIRED');
  if (error instanceof ApiError) {
    const known = fromCodeAndMessage(error.code, error.message);
    if (known) return known;
    if (error.status === 429) return new AppError('TOO_MANY_REQUESTS', error.message);
    return new AppError('UNKNOWN', error.message);
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error && typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : String(error ?? '');
  const known = fromCodeAndMessage(undefined, message);
  if (known) return known;
  if (message === 'SESSION_EXPIRED') return new AppError('SESSION_EXPIRED');
  return new AppError('UNKNOWN', message);
}

/** Translated, user-facing message for any error. Falls back to the raw message when unknown. */
export function describeError(error: unknown, t: Dictionary['common']['errors'], fallback?: string): string {
  const appError = toAppError(error);
  switch (appError.code) {
    case 'PIN_LIMIT_REACHED':
      return fmt(t.pinLimitReached, { limit: appError.limit ?? '' });
    case 'QUOTA_EXCEEDED':
      return fmt(t.quotaExceeded, { limit: appError.limit ?? '' });
    case 'QUOTA_EXCEEDED_MONTH':
      return fmt(t.quotaExceededMonth, { limit: appError.limit ?? '' });
    case 'AI_CAPACITY':
      return t.aiCapacity;
    case 'AUTOPILOT_DISABLED':
      return t.autopilotDisabled;
    case 'AUTOPILOT_REQUIRES_PRO':
      return t.autopilotRequiresPro;
    case 'AUTOPILOT_DAILY_LIMIT':
      return fmt(t.autopilotDailyLimit, { limit: appError.limit ?? '' });
    case 'SESSION_EXPIRED':
      return t.sessionExpired;
    case 'TOO_MANY_REQUESTS':
      return t.tooManyRequests;
    case 'IMAGE_UPLOAD_FAILED':
      return t.imageUploadFailed;
    default:
      return fallback || appError.message || t.unknown;
  }
}
