interface VercelRequest {
  method?: string;
}

interface VercelResponse {
  status: (code: number) => VercelResponse;
  json: (body: Record<string, unknown>) => void;
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim();
  if (key.length < 10) return false;
  const lower = key.toLowerCase();
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...');
}

export default function handler(_req: VercelRequest, res: VercelResponse) {
  const openRouter = (process.env.OPENROUTER_API_KEY || process.env.VITE_OPENROUTER_API_KEY || '').trim();
  const ideogram = (process.env.IDEOGRAM_API_KEY || process.env.VITE_IDEOGRAM_API_KEY || '').trim();

  res.status(200).json({
    hasTextAi: isConfiguredKey(openRouter),
    hasImageAi: isConfiguredKey(ideogram),
  });
}

