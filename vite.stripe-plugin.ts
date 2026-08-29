import type { IncomingMessage, ServerResponse } from 'http'
import type { Plugin, ViteDevServer } from 'vite'
import { loadEnv } from 'vite'

const PLAN_AMOUNTS = {
  pro: 1900,
  business: 4900,
} as const

type PaidPlan = keyof typeof PLAN_AMOUNTS

function isPaidPlan(value: unknown): value is PaidPlan {
  return value === 'pro' || value === 'business'
}

function isConfiguredKey(raw: string | undefined): boolean {
  const key = (raw || '').trim()
  if (key.length < 10) return false
  const lower = key.toLowerCase()
  return !lower.includes('your') && !lower.includes('placeholder') && !lower.includes('...')
}

function readStripeEnv(mode: string) {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    secretKey: (env.STRIPE_SECRET_KEY || env.VITE_STRIPE_SECRET_KEY || '').trim(),
    publishableKey: (env.VITE_STRIPE_PUBLISHABLE_KEY || '').trim(),
    pricePro: (env.STRIPE_PRICE_PRO || '').trim(),
    priceBusiness: (env.STRIPE_PRICE_BUSINESS || '').trim(),
  }
}

async function stripeForm(
  secretKey: string,
  path: string,
  params: URLSearchParams,
  method = 'POST'
): Promise<{ ok: boolean; status: number; data: Record<string, unknown> }> {
  const res = await fetch(`https://api.stripe.com/v1${path}`, {
    method,
    headers: {
      Authorization: `Bearer ${secretKey}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: method === 'GET' ? undefined : params,
  })
  const data = (await res.json()) as Record<string, unknown>
  return { ok: res.ok, status: res.status, data }
}

export function stripePlugin(mode: string): Plugin {
  return {
    name: 'stripe-billing-api',
    configureServer(server: ViteDevServer) {
      server.middlewares.use((req, res, next) => {
        const url = req.url?.split('?')[0] || ''

        if (req.method === 'GET' && url === '/api/stripe/status') {
          const env = readStripeEnv(mode)
          sendJson(res, 200, {
            configured: isConfiguredKey(env.secretKey),
            publishableKey: isConfiguredKey(env.publishableKey) ? env.publishableKey : '',
          })
          return
        }

        if (req.method === 'POST' && url === '/api/stripe/checkout') {
          void (async () => {
            try {
              const env = readStripeEnv(mode)
              if (!isConfiguredKey(env.secretKey)) {
                sendJson(res, 400, {
                  error: 'Stripe n’est pas configuré. Ajoute STRIPE_SECRET_KEY dans .env.',
                })
                return
              }

              const body = await readJsonBody(req)
              const plan = body.plan
              const userId = typeof body.userId === 'string' ? body.userId : ''
              const email = typeof body.email === 'string' ? body.email : ''
              const successUrl = typeof body.successUrl === 'string' ? body.successUrl : ''
              const cancelUrl = typeof body.cancelUrl === 'string' ? body.cancelUrl : ''

              if (!isPaidPlan(plan) || !userId || !successUrl || !cancelUrl) {
                sendJson(res, 400, { error: 'plan, userId, successUrl et cancelUrl requis' })
                return
              }

              const params = new URLSearchParams()
              params.set('mode', 'subscription')
              params.set('client_reference_id', userId)
              params.set('success_url', successUrl)
              params.set('cancel_url', cancelUrl)
              params.set('metadata[user_id]', userId)
              params.set('metadata[plan]', plan)
              params.set('subscription_data[metadata][user_id]', userId)
              params.set('subscription_data[metadata][plan]', plan)
              if (email) params.set('customer_email', email)

              const priceId = plan === 'pro' ? env.pricePro : env.priceBusiness
              if (isConfiguredKey(priceId)) {
                params.set('line_items[0][price]', priceId)
                params.set('line_items[0][quantity]', '1')
              } else {
                params.set('line_items[0][quantity]', '1')
                params.set('line_items[0][price_data][currency]', 'eur')
                params.set('line_items[0][price_data][unit_amount]', String(PLAN_AMOUNTS[plan]))
                params.set('line_items[0][price_data][recurring][interval]', 'month')
                params.set(
                  'line_items[0][price_data][product_data][name]',
                  plan === 'pro' ? 'PinGen Pro' : 'PinGen Business'
                )
              }

              const result = await stripeForm(env.secretKey, '/checkout/sessions', params)
              const checkoutUrl = typeof result.data.url === 'string' ? result.data.url : ''
              if (!result.ok || !checkoutUrl) {
                sendJson(res, result.status || 400, {
                  error:
                    stripeError(result.data) || 'Impossible de créer la session Stripe Checkout.',
                })
                return
              }

              sendJson(res, 200, { url: checkoutUrl })
            } catch (error) {
              sendJson(res, 500, {
                error: error instanceof Error ? error.message : 'Erreur Stripe checkout',
              })
            }
          })()
          return
        }

        if (req.method === 'POST' && url === '/api/stripe/confirm') {
          void (async () => {
            try {
              const env = readStripeEnv(mode)
              if (!isConfiguredKey(env.secretKey)) {
                sendJson(res, 400, { error: 'Stripe n’est pas configuré.' })
                return
              }

              const body = await readJsonBody(req)
              const sessionId = typeof body.sessionId === 'string' ? body.sessionId : ''
              const userId = typeof body.userId === 'string' ? body.userId : ''
              if (!sessionId || !userId) {
                sendJson(res, 400, { error: 'sessionId et userId requis' })
                return
              }

              const result = await stripeForm(
                env.secretKey,
                `/checkout/sessions/${encodeURIComponent(sessionId)}`,
                new URLSearchParams(),
                'GET'
              )
              if (!result.ok) {
                sendJson(res, result.status || 400, {
                  error: stripeError(result.data) || 'Session Stripe introuvable.',
                })
                return
              }

              const metadata = (result.data.metadata || {}) as Record<string, unknown>
              const sessionUserId =
                (typeof metadata.user_id === 'string' && metadata.user_id) ||
                (typeof result.data.client_reference_id === 'string'
                  ? result.data.client_reference_id
                  : '')
              const plan = metadata.plan
              const paymentStatus = result.data.payment_status
              const status = result.data.status

              if (sessionUserId !== userId) {
                sendJson(res, 403, { error: 'Cette session Stripe ne correspond pas à ce compte.' })
                return
              }
              if (status !== 'complete' && paymentStatus !== 'paid' && paymentStatus !== 'no_payment_required') {
                sendJson(res, 400, { error: 'Le paiement Stripe n’est pas terminé.' })
                return
              }
              if (!isPaidPlan(plan)) {
                sendJson(res, 400, { error: 'Plan Stripe invalide.' })
                return
              }

              sendJson(res, 200, {
                plan,
                customerId:
                  typeof result.data.customer === 'string' ? result.data.customer : undefined,
                subscriptionId:
                  typeof result.data.subscription === 'string'
                    ? result.data.subscription
                    : undefined,
              })
            } catch (error) {
              sendJson(res, 500, {
                error: error instanceof Error ? error.message : 'Erreur Stripe confirm',
              })
            }
          })()
          return
        }

        if (req.method === 'POST' && url === '/api/stripe/portal') {
          void (async () => {
            try {
              const env = readStripeEnv(mode)
              if (!isConfiguredKey(env.secretKey)) {
                sendJson(res, 400, { error: 'Stripe n’est pas configuré.' })
                return
              }

              const body = await readJsonBody(req)
              const customerId = typeof body.customerId === 'string' ? body.customerId : ''
              const returnUrl = typeof body.returnUrl === 'string' ? body.returnUrl : ''
              if (!customerId || !returnUrl) {
                sendJson(res, 400, { error: 'customerId et returnUrl requis' })
                return
              }

              const params = new URLSearchParams()
              params.set('customer', customerId)
              params.set('return_url', returnUrl)
              const result = await stripeForm(env.secretKey, '/billing_portal/sessions', params)
              const portalUrl = typeof result.data.url === 'string' ? result.data.url : ''
              if (!result.ok || !portalUrl) {
                sendJson(res, result.status || 400, {
                  error: stripeError(result.data) || 'Impossible d’ouvrir le portail client Stripe.',
                })
                return
              }
              sendJson(res, 200, { url: portalUrl })
            } catch (error) {
              sendJson(res, 500, {
                error: error instanceof Error ? error.message : 'Erreur Stripe portal',
              })
            }
          })()
          return
        }

        next()
      })
    },
  }
}

function stripeError(data: Record<string, unknown>): string {
  const err = data.error
  if (err && typeof err === 'object' && 'message' in err && typeof err.message === 'string') {
    return err.message
  }
  return typeof data.message === 'string' ? data.message : ''
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
