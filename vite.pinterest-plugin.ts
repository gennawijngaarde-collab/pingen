import fs from 'fs'
import path from 'path'
import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

interface PinterestCreds {
  appId: string
  appSecret: string
}

/** Credentials en mémoire (dev) — mis à jour sans redémarrer Vite */
let runtimeCreds: PinterestCreds | null = null

function readEnvCreds(mode: string): PinterestCreds {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    appId: (() => {
      const envAppId = (env.VITE_PINTEREST_APP_ID || env.PINTEREST_APP_ID || '').trim();
      return envAppId && envAppId !== '1606177' ? envAppId : '1607362';
    })(),
    appSecret: (env.PINTEREST_APP_SECRET || env.VITE_PINTEREST_APP_SECRET || '').trim(),
  }
}

function getCreds(mode: string): PinterestCreds {
  if (runtimeCreds?.appId && runtimeCreds?.appSecret) {
    return runtimeCreds
  }
  return readEnvCreds(mode)
}

function isConfigured(creds: PinterestCreds): boolean {
  return (
    Boolean(creds.appId) &&
    Boolean(creds.appSecret) &&
    !creds.appId.includes('your') &&
    !creds.appSecret.includes('your')
  )
}

function upsertEnvVar(content: string, key: string, value: string): string {
  const line = `${key}=${value}`
  const re = new RegExp(`^#?\\s*${key}=.*$`, 'm')
  if (re.test(content)) {
    return content.replace(re, line)
  }
  return `${content.trimEnd()}\n\n${line}\n`
}

function saveCredsToEnvFile(appId: string, appSecret: string): void {
  const envPath = path.resolve(process.cwd(), '.env')
  let content = ''
  try {
    content = fs.readFileSync(envPath, 'utf8')
  } catch {
    content = '# PinGen local env\n'
  }

  content = upsertEnvVar(content, 'VITE_PINTEREST_APP_ID', appId)
  content = upsertEnvVar(content, 'PINTEREST_APP_SECRET', appSecret)
  // Évite d'exposer le secret via VITE_ si présent
  content = content.replace(/^VITE_PINTEREST_APP_SECRET=.*$/m, '# VITE_PINTEREST_APP_SECRET=(use PINTEREST_APP_SECRET)')

  fs.writeFileSync(envPath, content, 'utf8')
}

/**
 * Endpoints locaux Pinterest (OAuth + config développeur).
 * Le client_secret ne part jamais dans le bundle client.
 */
export function pinterestOAuthPlugin(mode: string): Plugin {
  return {
    name: 'pinterest-oauth-api',
    configureServer(server: ViteDevServer) {
      // Hydrate depuis .env au démarrage
      const initial = readEnvCreds(mode)
      if (isConfigured(initial)) {
        runtimeCreds = initial
      }

      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''

        // GET /api/pinterest/config — statut + App ID (public)
        if (req.method === 'GET' && url === '/api/pinterest/config') {
          const creds = getCreds(mode)
          sendJson(res, 200, {
            configured: isConfigured(creds),
            appId: creds.appId && !creds.appId.includes('your') ? creds.appId : '',
            hasSecret: Boolean(creds.appSecret) && !creds.appSecret.includes('your'),
            redirectUri: 'http://localhost:5173/dashboard/settings',
            scopes: [
              'boards:read',
              'boards:write',
              'pins:read',
              'pins:write',
              'user_accounts:read',
            ],
          })
          return
        }

        // POST /api/pinterest/credentials — enregistre App ID + Secret (dev only)
        if (req.method === 'POST' && url === '/api/pinterest/credentials') {
          void (async () => {
            try {
              const body = await readJsonBody(req)
              const appId = typeof body.appId === 'string' ? body.appId.trim() : ''
              const appSecret = typeof body.appSecret === 'string' ? body.appSecret.trim() : ''

              if (!appId || !appSecret) {
                sendJson(res, 400, { error: 'appId et appSecret requis' })
                return
              }
              if (appId.includes('your') || appSecret.includes('your')) {
                sendJson(res, 400, { error: 'Remplace les valeurs placeholder par tes vraies clés Pinterest' })
                return
              }

              runtimeCreds = { appId, appSecret }
              saveCredsToEnvFile(appId, appSecret)

              sendJson(res, 200, {
                ok: true,
                configured: true,
                appId,
                message:
                  'Clés enregistrées. Tu peux connecter ton compte Pinterest tout de suite (OAuth).',
              })
            } catch (error) {
              sendJson(res, 500, {
                error: error instanceof Error ? error.message : 'Erreur sauvegarde credentials',
              })
            }
          })()
          return
        }

        // POST /api/pinterest/oauth/token — échange code / refresh
        if (req.method !== 'POST' || url !== '/api/pinterest/oauth/token') {
          next()
          return
        }

        void (async () => {
          try {
            const body = await readJsonBody(req)
            const code = typeof body.code === 'string' ? body.code : ''
            const redirectUri =
              typeof body.redirect_uri === 'string' ? body.redirect_uri : ''
            const grantType =
              typeof body.grant_type === 'string' ? body.grant_type : 'authorization_code'
            const refreshToken =
              typeof body.refresh_token === 'string' ? body.refresh_token : ''

            const creds = getCreds(mode)
            if (!isConfigured(creds)) {
              sendJson(res, 500, {
                error:
                  'Pinterest App ID / Secret manquants. Configure-les dans Paramètres → Compte Pinterest.',
              })
              return
            }

            const params = new URLSearchParams()
            if (grantType === 'refresh_token') {
              if (!refreshToken) {
                sendJson(res, 400, { error: 'refresh_token requis' })
                return
              }
              params.set('grant_type', 'refresh_token')
              params.set('refresh_token', refreshToken)
            } else {
              if (!code || !redirectUri) {
                sendJson(res, 400, { error: 'code et redirect_uri requis' })
                return
              }
              params.set('grant_type', 'authorization_code')
              params.set('code', code)
              params.set('redirect_uri', redirectUri)
            }

            const basic = Buffer.from(`${creds.appId}:${creds.appSecret}`).toString('base64')
            const tokenRes = await fetch('https://api.pinterest.com/v5/oauth/token', {
              method: 'POST',
              headers: {
                Authorization: `Basic ${basic}`,
                'Content-Type': 'application/x-www-form-urlencoded',
              },
              body: params,
            })

            const data = (await tokenRes.json()) as Record<string, unknown>
            if (!tokenRes.ok) {
              sendJson(res, tokenRes.status, {
                error:
                  (typeof data.message === 'string' && data.message) ||
                  (typeof data.error === 'string' && data.error) ||
                  "Échec de l'échange du token Pinterest",
                details: data,
              })
              return
            }

            sendJson(res, 200, data)
          } catch (error) {
            sendJson(res, 500, {
              error: error instanceof Error ? error.message : 'Erreur serveur OAuth',
            })
          }
        })()
      })
    },
  }
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

function sendJson(
  res: ServerResponse,
  status: number,
  payload: Record<string, unknown>
) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json')
  res.end(JSON.stringify(payload))
}
