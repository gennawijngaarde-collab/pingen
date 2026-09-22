interface VercelRequest {
  method?: string;
  headers?: Record<string, string | string[] | undefined>;
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

  const authHeader = req.headers?.authorization || '';
  if (!authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authorization header manquant' });
    return;
  }

  const accessToken = authHeader.replace('Bearer ', '').trim();
  if (!accessToken) {
    res.status(401).json({ error: 'Access token manquant' });
    return;
  }

  try {
    const response = await fetch('https://api.pinterest.com/v5/boards?page_size=100', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    const data = await response.json();

    if (!response.ok) {
      res.status(response.status).json({
        error: data.message || data.error || 'Erreur Pinterest API',
        details: data,
      });
      return;
    }

    res.status(200).json(data);
  } catch (error) {
    res.status(500).json({
      error: 'Erreur lors de la récupération des boards Pinterest',
      details: error instanceof Error ? error.message : String(error),
    });
  }
}
