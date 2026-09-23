interface VercelRequest {
  method?: string;
  url?: string;
  query?: Record<string, string | string[] | undefined>;
  headers?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  setHeader: (name: string, value: string) => void;
  send: (body: string | Buffer) => void;
  json: (body: Record<string, unknown>) => void;
}

function pickQuery(value: string | string[] | undefined): string {
  return Array.isArray(value) ? value[0] || '' : value || '';
}

function getProxyUrl(req: VercelRequest): string {
  const fromQuery = pickQuery(req.query?.proxy);
  if (fromQuery) return fromQuery;
  const raw = req.url || '';
  const search = raw.includes('?') ? raw.slice(raw.indexOf('?') + 1) : '';
  return new URLSearchParams(search).get('proxy') || '';
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

function buildGrokPrompt(visualPrompt: string, overlayText?: string): string {
  const text = overlayText?.trim();
  const visual = visualPrompt.trim();
  const parts = [
    'Professional vertical Pinterest pin, 2:3 portrait composition, high-end marketing graphic.',
    'The photograph MUST clearly depict the actual business, product or niche described. No generic nature stock unless the business is about nature.',
    visual,
    text
      ? `Leave a clean dark area in the lower third for a headline. Do not invent extra slogans.`
      : 'Clean composition without extra captions or UI chrome.',
    'Crisp details, no watermarks, no UI chrome, no logos of real brands, no celebrity faces.',
  ];
  return parts.join(' ').slice(0, 3900);
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
  // GET requests are for image proxying (public)
  if (req.method === 'GET') {
    const remote = getProxyUrl(req);
    if (!remote || !/^https:\/\//i.test(remote)) {
      res.status(400).json({ error: 'URL image invalide' });
      return;
    }
    const remoteRes = await fetch(remote);
    if (!remoteRes.ok) {
      res.status(502).json({ error: 'Impossible de charger l image.' });
      return;
    }
    const contentType = remoteRes.headers.get('content-type') || 'image/jpeg';
    const buffer = Buffer.from(await remoteRes.arrayBuffer());
    res.status(200);
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=300');
    res.send(buffer);
    return;
  }

  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // ✅ SECURITY: Verify authentication for POST requests (AI image generation)
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

  // Check for Grok API key (xAI)
  const apiKey = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || process.env.VITE_GROK_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) {
    res.status(401).json({ error: 'GROK_API_KEY ou XAI_API_KEY absente.' });
    return;
  }

  const body =
    typeof req.body === 'object' && req.body !== null ? (req.body as Record<string, unknown>) : {};

  const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : '';
  const overlayText = typeof body.overlayText === 'string' ? body.overlayText.trim() : '';
  if (!prompt) {
    res.status(400).json({ error: 'prompt requis' });
    return;
  }

  const fullPrompt = buildGrokPrompt(prompt, overlayText || undefined);

  try {
    // Call Grok Image API (xAI)
    const grokRes = await fetch('https://api.x.ai/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'grok-imagine-image-quality',
        prompt: fullPrompt,
      }),
    });

    if (!grokRes.ok) {
      const errorData = await grokRes.json().catch(() => ({})) as Record<string, unknown>;
      const errorMsg = 
        (typeof errorData.error === 'object' && errorData.error !== null && 'message' in errorData.error && typeof errorData.error.message === 'string')
          ? errorData.error.message
          : (typeof errorData.message === 'string' ? errorData.message : `Erreur Grok API (${grokRes.status})`);
      
      res.status(grokRes.status || 502).json({
        error: errorMsg,
        details: errorData,
      });
      return;
    }

    const grokData = await grokRes.json() as {
      data?: Array<{ url?: string; mime_type?: string }>;
      error?: { message?: string };
    };

    const imageUrl = grokData.data?.[0]?.url;
    if (!imageUrl) {
      res.status(502).json({ error: 'Aucune image renvoyée par Grok.' });
      return;
    }

    res.status(200).json({ url: imageUrl });
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la génération d image avec Grok',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
