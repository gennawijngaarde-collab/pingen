import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim()
  if (key.length < 10) return false
  const lower = key.toLowerCase()
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...')
}

function readAiKeys(mode: string): { openRouter: string; ideogram: string } {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    openRouter: (
      env.OPENROUTER_API_KEY ||
      env.VITE_OPENROUTER_API_KEY ||
      ''
    ).trim(),
    ideogram: (env.IDEOGRAM_API_KEY || env.VITE_IDEOGRAM_API_KEY || '').trim(),
  }
}

function buildIdeogramPrompt(visualPrompt: string, overlayText?: string): string {
  const text = overlayText?.trim()
  const visual = visualPrompt.trim()
  const parts = [
    'Professional vertical Pinterest pin, 2:3 portrait composition, high-end marketing graphic.',
    text
      ? `The pin includes large, perfectly spelled, highly readable headline text that says exactly: "${text}". Bold modern typography, high contrast against the background.`
      : 'Clean composition without extra captions or UI chrome.',
    visual,
    'Crisp details, no watermarks, no UI chrome, no logos of real brands, no celebrity faces.',
  ]
  return parts.join(' ').slice(0, 3900)
}

interface IdeogramImage {
  url?: string | null
  is_image_safe?: boolean
}

interface IdeogramResponse {
  data?: IdeogramImage[]
  message?: string
  error?: string
}

async function generateIdeogramImage(
  apiKey: string,
  prompt: string,
  overlayText?: string
): Promise<string> {
  const fullPrompt = buildIdeogramPrompt(prompt, overlayText)

  const form = new FormData()
  form.append('prompt', fullPrompt)
  form.append('aspect_ratio', '2x3')
  form.append('style_type', 'DESIGN')
  form.append('rendering_speed', 'DEFAULT')
  form.append('magic_prompt', overlayText?.trim() ? 'OFF' : 'AUTO')
  form.append('num_images', '1')

  const v3Res = await fetch('https://api.ideogram.ai/v1/ideogram-v3/generate', {
    method: 'POST',
    headers: { 'Api-Key': apiKey },
    body: form,
  })

  if (v3Res.ok) {
    return extractIdeogramUrl((await v3Res.json()) as IdeogramResponse)
  }

  const v3Error = await safeErrorMessage(v3Res)

  const legacyRes = await fetch('https://api.ideogram.ai/generate', {
    method: 'POST',
    headers: {
      'Api-Key': apiKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      image_request: {
        prompt: fullPrompt,
        aspect_ratio: 'ASPECT_2_3',
        model: 'V_2',
        style_type: 'DESIGN',
        magic_prompt_option: overlayText?.trim() ? 'OFF' : 'AUTO',
        num_images: 1,
      },
    }),
  })

  if (legacyRes.ok) {
    return extractIdeogramUrl((await legacyRes.json()) as IdeogramResponse)
  }

  const legacyError = await safeErrorMessage(legacyRes)
  throw new Error(v3Error || legacyError || 'Ideogram n’a renvoyé aucune image.')
}

function extractIdeogramUrl(payload: IdeogramResponse): string {
  const image = payload.data?.[0]
  if (image && image.is_image_safe === false) {
    throw new Error('Image bloquée par le filtre de sécurité Ideogram. Reformulez le prompt.')
  }
  if (image?.url) {
    return image.url
  }
  throw new Error(
    payload.message || payload.error || 'Aucune image renvoyée par Ideogram.'
  )
}

async function safeErrorMessage(res: Response): Promise<string> {
  try {
    const payload = (await res.json()) as IdeogramResponse & { detail?: string }
    return (
      payload.message ||
      payload.error ||
      payload.detail ||
      `Erreur Ideogram (${res.status})`
    )
  } catch {
    return `Erreur Ideogram (${res.status})`
  }
}

function attachAiMiddleware(server: ViteDevServer, mode: string) {
  server.middlewares.use((req, res, next) => {
    const url = req.url?.split('?')[0] || ''

    if (req.method === 'GET' && url === '/api/ai/status') {
      try {
        const keys = readAiKeys(mode)
        sendJson(res, 200, {
          hasTextAi: isConfiguredKey(keys.openRouter),
          hasImageAi: isConfiguredKey(keys.ideogram),
        })
      } catch (error) {
        sendJson(res, 500, {
          error: error instanceof Error ? error.message : 'Impossible de lire le statut IA',
        })
      }
      return
    }

    if (req.method === 'POST' && url === '/api/ai/image') {
      void (async () => {
        try {
          const keys = readAiKeys(mode)
          if (!isConfiguredKey(keys.ideogram)) {
            sendJson(res, 401, {
              error:
                'Clé Ideogram absente. Ajoutez IDEOGRAM_API_KEY dans .env puis redémarrez npm run dev.',
            })
            return
          }

          const body = await readJsonBody(req)
          const prompt = typeof body.prompt === 'string' ? body.prompt.trim() : ''
          const overlayText =
            typeof body.overlayText === 'string' ? body.overlayText.trim() : ''

          if (!prompt) {
            sendJson(res, 400, { error: 'prompt requis' })
            return
          }

          const imageUrl = await generateIdeogramImage(
            keys.ideogram,
            prompt,
            overlayText || undefined
          )
          sendJson(res, 200, { url: imageUrl })
        } catch (error) {
          sendJson(res, 502, {
            error:
              error instanceof Error
                ? error.message
                : 'Échec de la génération Ideogram',
          })
        }
      })()
      return
    }

    if (!url.startsWith('/api/ai/openrouter')) {
      next()
      return
    }

    void (async () => {
      try {
        const keys = readAiKeys(mode)
        if (!isConfiguredKey(keys.openRouter)) {
          sendJson(res, 401, {
            error:
              'Clé OpenRouter absente. Ajoutez OPENROUTER_API_KEY dans .env puis redémarrez npm run dev.',
          })
          return
        }

        const pathAfter = url.slice('/api/ai/openrouter'.length) || '/'
        const rawBody = await readRawBody(req)
        const upstream = await fetch(`https://openrouter.ai/api/v1${pathAfter}`, {
          method: req.method,
          headers: {
            Authorization: `Bearer ${keys.openRouter}`,
            'Content-Type': req.headers['content-type'] || 'application/json',
            'HTTP-Referer': 'http://localhost:5173',
            'X-OpenRouter-Title': 'PinGen',
          },
          body: req.method === 'GET' || req.method === 'HEAD' ? undefined : rawBody,
        })

        const text = await upstream.text()
        res.statusCode = upstream.status
        res.setHeader(
          'Content-Type',
          upstream.headers.get('content-type') || 'application/json'
        )
        res.end(text)
      } catch (error) {
        sendJson(res, 502, {
          error:
            error instanceof Error ? error.message : 'Échec du proxy OpenRouter',
        })
      }
    })()
  })
}

export function aiProxyPlugin(mode: string): Plugin {
  return {
    name: 'ai-proxy-api',
    configureServer(server) {
      attachAiMiddleware(server, mode)
    },
    configurePreviewServer(server) {
      attachAiMiddleware(server as unknown as ViteDevServer, mode)
    },
  }
}

function readRawBody(req: IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return readRawBody(req).then((raw) => {
    if (!raw) return {}
    return JSON.parse(raw) as Record<string, unknown>
  })
}

function sendJson(
  res: ServerResponse,
  status: number,
  payload: Record<string, unknown>
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.setHeader('Connection', 'close')
  res.end(JSON.stringify(payload))
}
