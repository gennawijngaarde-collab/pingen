import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim()
  if (key.length < 8) return false
  const lower = key.toLowerCase()
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...')
}

function readResendEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    apiKey: (env.RESEND_API_KEY || '').trim(),
    from: (env.RESEND_FROM || 'GX <contact@hrtech-studio.com>').trim(),
    adminEmail: (env.ADMIN_EMAIL || 'genna.wijngaarde@gmail.com').trim(),
  }
}

export function resendPlugin(mode: string): Plugin {
  return {
    name: 'resend-email-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''
        const env = readResendEnv(mode)

        if (req.method === 'GET' && url === '/api/email/status') {
          sendJson(res, 200, {
            configured: isConfiguredKey(env.apiKey),
            adminEmail: env.adminEmail,
          })
          return
        }

        if (req.method !== 'POST' || url !== '/api/email/notify') {
          next()
          return
        }

        void (async () => {
          try {
            const body = await readJsonBody(req)
            if (!isConfiguredKey(env.apiKey)) {
              sendJson(res, 200, { ok: false, skipped: true, error: 'RESEND_API_KEY absente' })
              return
            }

            const type = typeof body.type === 'string' ? body.type : 'signup'
            const email = typeof body.email === 'string' ? body.email.trim() : ''
            const fullName = typeof body.fullName === 'string' ? body.fullName.trim() : ''
            if (!email.includes('@')) {
              sendJson(res, 400, { error: 'email requis' })
              return
            }

            const subject =
              type === 'signup' ? `Nouvelle inscription PinGen — ${email}` : `PinGen — ${type}`
            const html = `<p>Nouvelle inscription PinGen.</p>
<p><strong>Nom :</strong> ${escapeHtml(fullName || '—')}</p>
<p><strong>Email :</strong> ${escapeHtml(email)}</p>`

            const sent = await fetch('https://api.resend.com/emails', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${env.apiKey}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                from: env.from,
                to: [env.adminEmail],
                subject,
                html,
              }),
            })
            const data = (await sent.json()) as { id?: string; message?: string }
            if (!sent.ok) {
              sendJson(res, sent.status, { ok: false, error: data.message || 'Échec Resend' })
              return
            }
            sendJson(res, 200, { ok: true, id: data.id || null })
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : 'Erreur email',
            })
          }
        })()
      })
    },
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function readJsonBody(req: IncomingMessage): Promise<Record<string, unknown>> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk: Buffer) => chunks.push(chunk))
    req.on('end', () => {
      try {
        const raw = Buffer.concat(chunks).toString('utf8')
        resolve(raw ? (JSON.parse(raw) as Record<string, unknown>) : {})
      } catch (error) {
        reject(error)
      }
    })
    req.on('error', reject)
  })
}

function sendJson(res: ServerResponse, status: number, payload: Record<string, unknown>) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}
