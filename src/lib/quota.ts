import { supabase, isDemoMode } from '@/lib/supabase';
import type { User } from '@/lib/supabase';

export type PlanKey = User['plan'];

export interface QuotaCounter {
  used: number;
  limit: number;
}

export interface QuotaUsage {
  plan: PlanKey;
  pins: QuotaCounter;
  aiImage: QuotaCounter;
  aiText: QuotaCounter;
}

/** Mirrors `plan_pin_limit` / `plan_monthly_quota` in the database (used as a fallback only). */
export const PLAN_LIMITS: Record<PlanKey, { pins: number; aiImage: number; aiText: number }> = {
  starter: { pins: 5, aiImage: 5, aiText: 20 },
  pro: { pins: 100, aiImage: 100, aiText: 300 },
  business: { pins: 300, aiImage: 300, aiText: 1000 },
};

export const PLAN_AUTOPILOT_DAILY: Record<PlanKey, number> = {
  starter: 0,
  pro: 3,
  business: 5,
};

function toCounter(value: unknown, fallbackLimit: number): QuotaCounter {
  const obj = (value && typeof value === 'object' ? value : {}) as Record<string, unknown>;
  const used = typeof obj.used === 'number' ? obj.used : 0;
  const limit = typeof obj.limit === 'number' ? obj.limit : fallbackLimit;
  return { used, limit };
}

export function fallbackQuotaUsage(plan: PlanKey, pinsUsed = 0): QuotaUsage {
  const limits = PLAN_LIMITS[plan];
  return {
    plan,
    pins: { used: pinsUsed, limit: limits.pins },
    aiImage: { used: 0, limit: limits.aiImage },
    aiText: { used: 0, limit: limits.aiText },
  };
}

/** Monthly usage for the signed-in user, computed server-side by `my_quota_usage()`. */
export async function fetchQuotaUsage(plan: PlanKey, pinsUsed = 0): Promise<QuotaUsage> {
  const fallback = fallbackQuotaUsage(plan, pinsUsed);
  if (isDemoMode) return fallback;
  const { data, error } = await supabase.rpc('my_quota_usage');
  if (error || !data || typeof data !== 'object') return fallback;
  const row = data as Record<string, unknown>;
  const resolvedPlan: PlanKey =
    row.plan === 'pro' || row.plan === 'business' || row.plan === 'starter' ? row.plan : plan;
  const limits = PLAN_LIMITS[resolvedPlan];
  return {
    plan: resolvedPlan,
    pins: toCounter(row.pins, limits.pins),
    aiImage: toCounter(row.aiImage, limits.aiImage),
    aiText: toCounter(row.aiText, limits.aiText),
  };
}

export function quotaPercent(counter: QuotaCounter): number {
  if (counter.limit <= 0) return 0;
  return Math.min(100, Math.round((counter.used / counter.limit) * 100));
}
