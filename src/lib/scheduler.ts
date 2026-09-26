import { supabase, type Pin } from './supabase';

/**
 * Scheduling helpers (client side, RLS-scoped).
 *
 * Publishing itself is done by the server engine (`server/publishScheduledPins.ts`,
 * exposed at /api/cron/publish-scheduled-pins): Pinterest tokens are never used
 * from the browser and the automation runs 24/7 without an open tab.
 */

/**
 * Schedule a new pin for publishing
 */
export async function schedulePinForPublishing(
  pinId: string,
  scheduledAt: Date
): Promise<void> {
  const { error } = await supabase
    .from('pins')
    .update({
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      retry_count: 0,
      error_message: null,
    })
    .eq('id', pinId);

  if (error) {
    throw new Error(`Failed to schedule pin: ${error.message}`);
  }
}

/**
 * Cancel a scheduled pin
 */
export async function cancelScheduledPin(pinId: string): Promise<void> {
  const { error } = await supabase
    .from('pins')
    .update({
      status: 'draft',
      scheduled_at: null,
    })
    .eq('id', pinId);

  if (error) {
    throw new Error(`Failed to cancel scheduled pin: ${error.message}`);
  }
}

/**
 * Get upcoming scheduled pins for a user
 */
export async function getUpcomingPins(userId: string, limit: number = 10): Promise<Pin[]> {
  const now = new Date().toISOString();
  
  const { data, error } = await supabase
    .from('pins')
    .select('*')
    .eq('user_id', userId)
    .eq('status', 'scheduled')
    .gte('scheduled_at', now)
    .order('scheduled_at', { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error(`Failed to fetch upcoming pins: ${error.message}`);
  }

  return data as Pin[];
}

/**
 * Get publishing statistics for a user
 */
export async function getPublishingStats(userId: string): Promise<{
  totalScheduled: number;
  totalPublished: number;
  totalFailed: number;
  publishingToday: number;
}> {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const [
    { count: totalScheduled },
    { count: totalPublished },
    { count: totalFailed },
    { count: publishingToday },
  ] = await Promise.all([
    supabase
      .from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'scheduled'),
    supabase
      .from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'published'),
    supabase
      .from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'failed'),
    supabase
      .from('pins')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('status', 'scheduled')
      .gte('scheduled_at', today.toISOString())
      .lt('scheduled_at', tomorrow.toISOString()),
  ]);

  return {
    totalScheduled: totalScheduled || 0,
    totalPublished: totalPublished || 0,
    totalFailed: totalFailed || 0,
    publishingToday: publishingToday || 0,
  };
}

/**
 * Bulk schedule pins
 */
export async function bulkSchedulePins(
  pinIds: string[],
  baseDate: Date,
  intervalMinutes: number = 60
): Promise<void> {
  const updates = pinIds.map((pinId, index) => ({
    id: pinId,
    scheduled_at: new Date(baseDate.getTime() + index * intervalMinutes * 60 * 1000).toISOString(),
  }));

  await applySchedules(updates, 'Failed to bulk schedule pins');
}

/** Plain UPDATEs (never upserts): RLS + column grants guarantee only own pins change. */
async function applySchedules(items: Array<{ id: string; scheduled_at: string }>, errorPrefix: string): Promise<void> {
  const results = await Promise.all(
    items.map((item) =>
      supabase
        .from('pins')
        .update({
          status: 'scheduled',
          scheduled_at: item.scheduled_at,
          retry_count: 0,
          error_message: null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', item.id)
    )
  );
  const failed = results.find((r) => r.error);
  if (failed?.error) {
    throw new Error(`${errorPrefix}: ${failed.error.message}`);
  }
}

/**
 * Auto-schedule pins at optimal times
 */
export async function autoSchedulePins(
  _userId: string,
  pinIds: string[],
  startDate: Date = new Date(),
  postsPerDay: number = 3
): Promise<void> {
  // Optimal posting times (based on Pinterest analytics)
  // These are in user's local time, converted to UTC
  const optimalHours = [8, 12, 15, 18, 21]; // 8am, 12pm, 3pm, 6pm, 9pm
  
  const currentDate = new Date(startDate);
  let hourIndex = 0;
  let postsToday = 0;

  const schedules = pinIds.map((pinId) => {
    // Find next available slot
    while (postsToday >= postsPerDay) {
      currentDate.setDate(currentDate.getDate() + 1);
      currentDate.setHours(optimalHours[0], 0, 0, 0);
      postsToday = 0;
      hourIndex = 0;
    }

    const scheduledAt = new Date(currentDate);
    scheduledAt.setHours(optimalHours[hourIndex % optimalHours.length], 0, 0, 0);

    postsToday++;
    hourIndex++;

    return { id: pinId, scheduled_at: scheduledAt.toISOString() };
  });

  await applySchedules(schedules, 'Failed to auto-schedule pins');
}
