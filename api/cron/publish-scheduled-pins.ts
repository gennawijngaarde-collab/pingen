import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processScheduledPins } from '../../src/lib/scheduler';

interface VercelCronRequest extends VercelRequest {
  headers: {
    authorization?: string;
  };
}

export default async function handler(req: VercelCronRequest, res: VercelResponse) {
  // Verify this is a Vercel Cron request
  const authHeader = req.headers.authorization;
  const cronSecret = process.env.CRON_SECRET;

  // For security, require either Vercel Cron header or a secret
  if (authHeader !== `Bearer ${cronSecret}` && !authHeader?.includes('Vercel-Cron')) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  try {
    console.log('[CRON] Starting scheduled pins processing...');
    
    const result = await processScheduledPins();
    
    console.log('[CRON] Processing completed:', result);
    
    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[CRON] Error processing scheduled pins:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
