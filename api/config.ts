import { isConfiguredKey, type ApiRequest, type ApiResponse } from '../server/http.js';
import { PINTEREST_SCOPES, pinterestAppId, pinterestAppSecret, pinterestRedirectUri } from '../server/pinterestApp.js';

/**
 * Public, non-sensitive runtime configuration for the browser
 * (which integrations are enabled + public identifiers only).
 * Replaces /api/ai/status, /api/stripe/status and /api/pinterest/config.
 */
export default function handler(_req: ApiRequest, res: ApiResponse) {
  const openRouter = (process.env.OPENROUTER_API_KEY || '').trim();
  const grokImage = (process.env.GROK_API_KEY || process.env.XAI_API_KEY || '').trim();
  const stripeSecret = (process.env.STRIPE_SECRET_KEY || '').trim();
  const stripePublishable = (process.env.VITE_STRIPE_PUBLISHABLE_KEY || process.env.STRIPE_PUBLISHABLE_KEY || '').trim();
  const appId = pinterestAppId();
  const secret = pinterestAppSecret();

  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300');
  res.status(200).json({
    ai: {
      hasTextAi: isConfiguredKey(openRouter),
      hasImageAi: isConfiguredKey(grokImage),
    },
    stripe: {
      configured: isConfiguredKey(stripeSecret),
      publishableKey: /^pk_(live|test)_/.test(stripePublishable) ? stripePublishable : '',
    },
    pinterest: {
      configured: isConfiguredKey(appId, 4) && isConfiguredKey(secret, 4),
      appId: isConfiguredKey(appId, 4) ? appId : '',
      hasSecret: isConfiguredKey(secret, 4),
      redirectUri: pinterestRedirectUri(),
      scopes: PINTEREST_SCOPES,
    },
  });
}
