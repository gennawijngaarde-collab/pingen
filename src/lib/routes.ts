/** Source unique des chemins de l’app — à utiliser à la place des strings magiques. */
export const ROUTES = {
  home: '/',
  login: '/login',
  signup: '/signup',
  privacy: '/privacy',
  privacyCookies: '/privacy#cookies',
  terms: '/terms',
  legal: '/legal',
  cookies: '/cookies',
  comingSoon: '/coming-soon',
  dashboard: '/dashboard',
  generator: '/dashboard/generator',
  schedule: '/dashboard/schedule',
  analytics: '/dashboard/analytics',
  autopilot: '/dashboard/autopilot',
  settings: '/dashboard/settings',
  settingsBilling: '/dashboard/settings?tab=billing',
} as const;

export const HOME_HASH = {
  features: '/#features',
  howItWorks: '/#how-it-works',
  pricing: '/#pricing',
  faq: '/#faq',
} as const;

export type AppPath = (typeof ROUTES)[keyof typeof ROUTES];

export function isDashboardPath(pathname: string): boolean {
  return pathname === ROUTES.dashboard || pathname.startsWith(`${ROUTES.dashboard}/`);
}

export function safeInternalPath(path: string | null | undefined, fallback = ROUTES.dashboard): string {
  if (!path || !path.startsWith('/') || path.startsWith('//')) {
    return fallback;
  }
  return path;
}
