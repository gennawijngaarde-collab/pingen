interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string) => void;
  json: (body: Record<string, unknown>) => void;
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

function pickString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function parseBody(raw: unknown): Record<string, unknown> {
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return typeof parsed === 'object' && parsed !== null ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (typeof raw === 'object' && raw !== null) {
    return raw as Record<string, unknown>;
  }
  return {};
}

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
    res.status(405).json({ error: { message: 'Method not allowed' } });
    return;
  }

  // ✅ SECURITY: Verify authentication
  const authHeader = req.headers?.authorization;
  const authString = Array.isArray(authHeader) ? authHeader[0] : authHeader || '';
  
  if (!authString.startsWith('Bearer ')) {
    res.status(401).json({ error: { message: 'Authentication required' } });
    return;
  }

  const token = authString.replace('Bearer ', '').trim();
  const { userId, error: authError } = await verifySupabaseToken(token);
  
  if (authError || !userId) {
    res.status(401).json({ error: { message: authError || 'Invalid authentication' } });
    return;
  }

  const apiKey = (process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) {
    res.status(401).json({ error: { message: "Le service IA texte n'est pas encore activé." } });
    return;
  }

  const appUrl = pickString(process.env.VITE_APP_URL) || 'https://www.pingenx.io';
  const body = parseBody(req.body);

  const upstream = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'HTTP-Referer': appUrl,
      'X-OpenRouter-Title': 'GenX',
      'X-User-Id': userId, // Track usage by user
    },
    body: JSON.stringify(body),
  });

  const text = await upstream.text();
  res.status(upstream.status);
  res.setHeader('Content-Type', upstream.headers.get('content-type') || 'application/json');
  res.send(text);
}
