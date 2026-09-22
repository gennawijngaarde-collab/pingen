interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
  url?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  // Extract auth header
  const authHeader = req.headers?.authorization;
  const authString = Array.isArray(authHeader) ? authHeader[0] : authHeader || '';
  
  if (!authString.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header manquant' });
    return;
  }

  const accessToken = authString.replace('Bearer ', '').trim();
  if (!accessToken) {
    res.status(401).json({ error: 'Access token manquant' });
    return;
  }

  // Determine endpoint from query parameter
  const url = new URL(req.url || '', 'https://dummy.com');
  const endpoint = url.searchParams.get('endpoint') || 'user';
  
  let pinterestUrl = 'https://api.pinterest.com/v5/user_account';
  if (endpoint === 'boards') {
    pinterestUrl = 'https://api.pinterest.com/v5/boards?page_size=100';
  }

  try {
    const response = await fetch(pinterestUrl, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = (await response.json()) as Record<string, unknown>;

    if (!response.ok) {
      res.status(response.status).json({
        error: (data.message as string) || (data.error as string) || 'Erreur Pinterest API',
        details: data,
      });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: `Erreur lors de la récupération ${endpoint === 'boards' ? 'des boards' : 'du profil'} Pinterest`,
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
