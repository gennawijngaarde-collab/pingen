interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.status(405).json({
    ok: false,
    error:
      'Endpoint disponible en dev uniquement. En production, configure PINTEREST_APP_SECRET via les variables Vercel.',
  });
}

