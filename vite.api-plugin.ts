import { existsSync } from 'node:fs'
import path from 'node:path'
import type { IncomingMessage, ServerResponse } from 'node:http'
import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

/**
 * Dev-only: serves `api/**.ts` (the real Vercel functions) under /api so the
 * browser hits the exact same code in `vite dev` as in production.
 * Secrets come from .env* files via loadEnv and are exposed on process.env
 * for the handlers, never to the client bundle.
 */
type Handler = (req: unknown, res: unknown) => unknown | Promise<unknown>

interface VercelLikeRequest extends IncomingMessage {
  query: Record<string, string | string[]>
  body: unknown
}

async function readBody(req: IncomingMessage): Promise<Buffer> {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk)
  return Buffer.concat(chunks)
}

function resolveHandlerFile(pathname: string): string | null {
  const rel = pathname.replace(/^\/api\/?/, '').replace(/\/+$/, '')
  if (!rel || rel.includes('..')) return null
  const candidates = [path.resolve(process.cwd(), 'api', `${rel}.ts`), path.resolve(process.cwd(), 'api', rel, 'index.ts')]
  return candidates.find((file) => existsSync(file)) || null
}

function wrapResponse(res: ServerResponse) {
  const api = {
    status(code: number) {
      res.statusCode = code
      return api
    },
    setHeader(name: string, value: string) {
      res.setHeader(name, value)
    },
    send(body: string | Buffer) {
      res.end(body)
    },
    json(body: unknown) {
      if (!res.getHeader('Content-Type')) res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(body))
    },
  }
  return api
}

export function apiDevPlugin(mode: string): Plugin {
  return {
    name: 'genx-api-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      const env = loadEnv(mode, process.cwd(), '')
      for (const [key, value] of Object.entries(env)) {
        if (process.env[key] === undefined) process.env[key] = value
      }

      server.middlewares.use(async (req, res, next) => {
        const url = new URL(req.url || '/', 'http://localhost')
        if (!url.pathname.startsWith('/api/')) return next()

        const file = resolveHandlerFile(url.pathname)
        if (!file) return next()

        try {
          const mod = (await server.ssrLoadModule(file)) as { default?: Handler; config?: { api?: { bodyParser?: boolean } } }
          const handler = mod.default
          if (typeof handler !== 'function') {
            res.statusCode = 500
            res.end('API handler has no default export')
            return
          }

          const request = req as VercelLikeRequest
          request.query = Object.fromEntries(url.searchParams.entries())
          const raw = await readBody(req)
          const parseBody = mod.config?.api?.bodyParser !== false
          if (!parseBody) {
            request.body = raw.toString('utf8')
          } else if (raw.length === 0) {
            request.body = undefined
          } else if ((req.headers['content-type'] || '').includes('application/json')) {
            try {
              request.body = JSON.parse(raw.toString('utf8'))
            } catch {
              request.body = raw.toString('utf8')
            }
          } else {
            request.body = raw.toString('utf8')
          }

          await handler(request, wrapResponse(res))
        } catch (error) {
          server.ssrFixStacktrace(error as Error)
          console.error(`[api-dev] ${url.pathname} failed:`, error)
          if (!res.headersSent) {
            res.statusCode = 500
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ error: 'Internal error (see terminal)' }))
          }
        }
      })
    },
  }
}
