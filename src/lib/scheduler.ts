import { supabase, type Pin } from './supabase';
import { createPinterestPin, mockPinterestService, hasPinterestConfig } from './pinterest';

export interface ScheduledJob {
  id: string;
  pinId: string;
  userId: string;
  scheduledAt: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  retryCount: number;
  error?: string;
}

// Maximum retry attempts
const MAX_RETRIES = 3;

// Check if we're in demo mode (no Pinterest API credentials)
const isDemoMode = !hasPinterestConfig;

/**
 * Process all pending scheduled pins that are due for publishing
 */
export async function processScheduledPins(): Promise<{
  processed: number;
  successful: number;
  failed: number;
}> {
  const now = new Date().toISOString();
  
  // Get all pins that are scheduled and due for publishing
  const { data: scheduledPins, error } = await supabase
    .from('pins')
    .select(`
      *,
      pinterest_accounts!inner(*)
    `)
    .eq('status', 'scheduled')
    .lte('scheduled_at', now)
    .order('scheduled_at', { ascending: true });

  if (error) {
    console.error('Error fetching scheduled pins:', error);
    throw error;
  }

  if (!scheduledPins || scheduledPins.length === 0) {
    return { processed: 0, successful: 0, failed: 0 };
  }

  let successful = 0;
  let failed = 0;

  // Process each pin
  for (const pin of scheduledPins as any[]) {
    try {
      await publishScheduledPin(pin);
      successful++;
    } catch (err) {
      console.error(`Failed to publish pin ${pin.id}:`, err);
      failed++;
      
      // Update pin status to failed or retry
      const retryCount = (pin.retry_count || 0) + 1;
      if (retryCount >= MAX_RETRIES) {
        await supabase
          .from('pins')
          .update({
            status: 'failed',
            error_message: err instanceof Error ? err.message : 'Unknown error',
            retry_count: retryCount,
          })
          .eq('id', pin.id);
      } else {
        // Schedule retry in 15 minutes
        const retryAt = new Date(Date.now() + 15 * 60 * 1000).toISOString();
        await supabase
          .from('pins')
          .update({
            scheduled_at: retryAt,
            retry_count: retryCount,
            error_message: `Retry ${retryCount}/${MAX_RETRIES}: ${err instanceof Error ? err.message : 'Unknown error'}`,
          })
          .eq('id', pin.id);
      }
    }
  }

  return {
    processed: scheduledPins.length,
    successful,
    failed,
  };
}

/**
 * Publish a single scheduled pin to Pinterest
 */
async function publishScheduledPin(pin: Pin & { pinterest_accounts: any }): Promise<void> {
  const account = pin.pinterest_accounts;
  
  if (!account) {
    throw new Error('No Pinterest account connected for this pin');
  }

  // Check if token is expired and refresh if needed
  if (new Date(account.token_expires_at) <= new Date()) {
    // Token refresh logic would go here
    // For now, we'll try with the existing token
    console.warn('Token may be expired for account:', account.id);
  }

  let pinterestPinId: string;

  if (isDemoMode) {
    // Use mock service in demo mode
    const result = await mockPinterestService.createPin({
      title: pin.title,
      description: pin.description,
      link: pin.link || undefined,
      board_id: pin.board_id || 'default-board',
      image_url: pin.image_url,
      alt_text: pin.alt_text || pin.title,
    });
    pinterestPinId = result.id;
  } else {
    // Publish to real Pinterest API
    const result = await createPinterestPin(account.access_token, {
      title: pin.title,
      description: pin.description,
      link: pin.link || undefined,
      board_id: pin.board_id || '',
      image_url: pin.image_url,
      alt_text: pin.alt_text || pin.title,
    });
    pinterestPinId = result.id;
  }

  // Update pin status to published
  const { error } = await supabase
    .from('pins')
    .update({
      status: 'published',
      published_at: new Date().toISOString(),
      pinterest_pin_id: pinterestPinId,
      error_message: null,
      // En démo, on simule les premières métriques du pin publié
      ...(isDemoMode && {
        impressions: 150 + Math.round(Math.random() * 800),
        saves: 10 + Math.round(Math.random() * 60),
        clicks: 5 + Math.round(Math.random() * 40),
      }),
    })
    .eq('id', pin.id);

  if (error) {
    throw new Error(`Failed to update pin status: ${error.message}`);
  }

  // Increment user's monthly pin count
  await supabase.rpc('increment_pin_count', {
    user_uuid: pin.user_id,
  });

  console.log(`Successfully published pin ${pin.id} to Pinterest as ${pinterestPinId}`);
}

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
  const updates = pinIds.map((pinId, index) => {
    const scheduledAt = new Date(baseDate.getTime() + index * intervalMinutes * 60 * 1000);
    return {
      id: pinId,
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      retry_count: 0,
    };
  });

  const { error } = await supabase.from('pins').upsert(updates);

  if (error) {
    throw new Error(`Failed to bulk schedule pins: ${error.message}`);
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
  
  let currentDate = new Date(startDate);
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

    return {
      id: pinId,
      status: 'scheduled',
      scheduled_at: scheduledAt.toISOString(),
      retry_count: 0,
    };
  });

  const { error } = await supabase.from('pins').upsert(schedules);

  if (error) {
    throw new Error(`Failed to auto-schedule pins: ${error.message}`);
  }
}
