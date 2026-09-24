import type { VercelRequest, VercelResponse } from '@vercel/node';
import { processScheduledPins } from '../../src/lib/scheduler';

// Helper to verify Supabase JWT token
async function verifySupabaseToken(token: string): Promise<{ userId: string | null; error: string | null }> {
  const supabaseUrl = (process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || '').trim();
  const supabaseKey = (process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || '').trim();
  
  if (!supabaseUrl || !supabaseKey) {
    return { userId: null, error: 'Supabase configuration missing' };
  }

  try {
    const response = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseKey,
      },
    });

    if (!response.ok) {
      return { userId: null, error: 'Invalid or expired token' };
    }

    const user = await response.json() as { id?: string };
    if (!user.id) {
      return { userId: null, error: 'Invalid user data' };
    }

    return { userId: user.id, error: null };
  } catch {
    return { userId: null, error: 'Token verification failed' };
  }
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Verify authentication
  const authHeader = req.headers?.authorization;
  const authString = Array.isArray(authHeader) ? authHeader[0] : authHeader || '';
  
  if (!authString.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const token = authString.replace('Bearer ', '').trim();
  const { userId, error: authError } = await verifySupabaseToken(token);
  
  if (authError || !userId) {
    res.status(401).json({ error: authError || 'Invalid authentication' });
    return;
  }

  try {
    console.log('[PUBLISH ALL] Processing all scheduled pins for user:', userId);
    
    const result = await processScheduledPins();
    
    console.log('[PUBLISH ALL] Processing completed:', result);
    
    res.status(200).json({
      success: true,
      ...result,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[PUBLISH ALL] Error:', error);
    
    res.status(500).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    });
  }
}
