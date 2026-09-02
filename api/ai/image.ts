interface VercelRequest {
  method?: string;
  body?: unknown;
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

function buildIdeogramPrompt(visualPrompt: string, overlayText?: string): string {
  const text = overlayText?.trim();
  const visual = visualPrompt.trim();
  const parts = [
    'Professional vertical Pinterest pin, 2:3 portrait composition, high-end marketing graphic.',
    text
      ? `The pin includes large, perfectly spelled, highly readable headline text that says exactly: "${text}". Bold modern typography, high contrast against the background.`
      : 'Clean composition without extra captions or UI chrome.',
    visual,
    'Crisp details, no watermarks, no UI chrome, no logos of real brands, no celebrity faces.',
  ];
  return parts.join(' ').slice(0, 3900);
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const apiKey = (process.env.IDEOGRAM_API_KEY || process.env.VITE_IDEOGRAM_API_KEY || '').trim();
  if (!isConfiguredKey(apiKey)) {
    res.status(401).json({ error: 'IDEOGRAM_API_KEY absente.' });
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

  const fullPrompt = buildIdeogramPrompt(prompt, overlayText || undefined);

  const form = new FormData();
  form.append('prompt', fullPrompt);
  form.append('aspect_ratio', '2x3');
  form.append('style_type', 'DESIGN');
  form.append('rendering_speed', 'DEFAULT');
  form.append('magic_prompt', overlayText ? 'OFF' : 'AUTO');
  form.append('num_images', '1');

  const v3Res = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: { 'Api-Key': apiKey },
    body: form,
  });

  if (v3Res.ok) {
    const payload = (await v3Res.json()) as {
      data?: Array<{ url?: string | null; is_image_safe?: boolean }>;
      message?: string;
      error?: string;
      detail?: string;
    };
    const image = payload.data?.[0];
    if (image?.is_image_safe === false) {
      res.status(502).json({ error: 'Image bloquée par le filtre de sécurité Ideogram.' });
      return;
    }
    if (image?.url) {
      res.status(200).json({ url: image.url });
      return;
    }
  }

  const legacyRes = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: { 'Api-Key': apiKey, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image_request: {
        prompt: fullPrompt,
        aspect_ratio: 'ASPECT_2_3',
        model: 'V_2',
        style_type: 'DESIGN',
        magic_prompt_option: overlayText ? 'OFF' : 'AUTO',
        num_images: 1,
      },
    }),
  });

  const legacyPayload = (await legacyRes.json()) as {
    data?: Array<{ url?: string | null; is_image_safe?: boolean }>;
    message?: string;
    error?: string;
    detail?: string;
  };

  if (!legacyRes.ok) {
    res.status(502).json({
      error: legacyPayload.message || legacyPayload.error || legacyPayload.detail || `Erreur Ideogram (${legacyRes.status})`,
    });
    return;
  }

  const url = legacyPayload.data?.[0]?.url;
  if (!url) {
    res.status(502).json({ error: 'Aucune image renvoyée par Ideogram.' });
    return;
  }
  res.status(200).json({ url });
}

