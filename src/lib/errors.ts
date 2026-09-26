import type { Dictionary } from '@/i18n/types';
import { fmt } from '@/i18n/fmt';
import { ApiError, SessionExpiredError } from './api';

export type AppErrorCode =
  | 'PIN_LIMIT_REACHED'
  | 'QUOTA_EXCEEDED'
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

function extractLimit(message: string): number | undefined {
  const match = /\((\d+)\)/.exec(message);
  return match ? Number(match[1]) : undefined;
}

/** Normalises Supabase / API / network errors into a known code. */
export function toAppError(error: unknown): AppError {
  if (error instanceof AppError) return error;
  if (error instanceof SessionExpiredError) return new AppError('SESSION_EXPIRED');
  if (error instanceof ApiError) {
    if (error.code === 'QUOTA_EXCEEDED' || error.message.startsWith('QUOTA_EXCEEDED')) {
      return new AppError('QUOTA_EXCEEDED', error.message, extractLimit(error.message));
    }
    if (error.status === 429) return new AppError('TOO_MANY_REQUESTS', error.message);
    return new AppError('UNKNOWN', error.message);
  }
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'object' && error && 'message' in error && typeof (error as { message: unknown }).message === 'string'
        ? (error as { message: string }).message
        : String(error ?? '');
  if (message.includes('PIN_LIMIT_REACHED')) return new AppError('PIN_LIMIT_REACHED', message, extractLimit(message));
  if (message.includes('QUOTA_EXCEEDED')) return new AppError('QUOTA_EXCEEDED', message, extractLimit(message));
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
