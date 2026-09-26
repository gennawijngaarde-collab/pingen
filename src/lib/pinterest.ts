import { apiFetch, fetchRuntimeConfig } from './api';

// Pinterest API Configuration
const PINTEREST_API_BASE = 'https://api.pinterest.com/v5';
const CANONICAL_PROD_ORIGIN = 'https://www.pingenx.io';
/** App Pinterest GenX — public (client_id OAuth). The secret only ever lives on the server. */
export const PINTEREST_APP_ID = '1609578';

const envAppId = ((import.meta.env.VITE_PINTEREST_APP_ID as string | undefined) || '').trim();
const rawAppId = envAppId && envAppId !== '1607362' && envAppId !== '1606177' ? envAppId : PINTEREST_APP_ID;

/** True si App ID Pinterest réel configuré (build-time) */
export const hasPinterestConfig =
  Boolean(rawAppId) && !rawAppId.includes('your') && rawAppId !== '...';

export interface PinterestRuntimeConfig {
  configured: boolean;
  appId: string;
  hasSecret: boolean;
  redirectUri: string;
  scopes: string[];
}

/** Config runtime publique (/api/config) */
export async function fetchPinterestRuntimeConfig(): Promise<PinterestRuntimeConfig> {
  const config = await fetchRuntimeConfig();
  const pinterest = config.pinterest;
  return {
    configured: pinterest.configured,
    appId: pinterest.appId || rawAppId,
    hasSecret: pinterest.hasSecret,
    redirectUri: pinterest.redirectUri || getPinterestRedirectUri(),
    scopes: pinterest.scopes,
  };
}

export function getPinterestRedirectUri(origin?: string): string {
  const raw = (origin || (typeof window !== 'undefined' ? window.location.origin : CANONICAL_PROD_ORIGIN)).replace(
    /\/$/,
    ''
  );
  const isLocal = raw.includes('localhost') || raw.includes('127.0.0.1');
  const canonical = isLocal ? raw : CANONICAL_PROD_ORIGIN;
  return `${canonical}/dashboard/settings`;
}

// Types
export interface PinterestUser {
  id: string;
  username: string;
  profile_image: string | null;
  follower_count: number;
  following_count: number;
}

export interface PinterestBoard {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  pin_count: number;
  privacy: 'PUBLIC' | 'SECRET';
}

export interface PinterestPin {
  id: string;
  title: string;
  description: string;
  link: string | null;
  image_url: string;
  board_id: string;
  created_at: string;
}

export interface CreatePinData {
  title: string;
  description: string;
  link?: string;
  board_id: string;
  image_url: string;
  alt_text?: string;
}

export interface PinterestTokenResponse {
  access_token: string;
  refresh_token?: string;
  expires_in: number;
  refresh_token_expires_in?: number;
  scope?: string;
  token_type?: string;
}

// OAuth URL generator
export function getPinterestAuthUrl(
  redirectUri: string,
  state?: string,
  clientId = rawAppId
): string {
  const scope = [
    'boards:read',
    'boards:write',
    'pins:read',
    'pins:write',
    'user_accounts:read',
  ].join(',');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope,
  });

  if (state) {
    params.set('state', state);
  }

  return `https://www.pinterest.com/oauth/?${params.toString()}`;
}

function createOAuthState(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  const state = Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem('pinterest_oauth_state', state);
  return state;
}

export function consumeOAuthState(received: string | null): boolean {
  const expected = sessionStorage.getItem('pinterest_oauth_state');
  if (!expected || !received) return false;
  if (expected !== received) return false;
  sessionStorage.removeItem('pinterest_oauth_state');
  return true;
}

/** Valide le state sans le consommer (pour Strict Mode) */
export function peekOAuthState(received: string | null): boolean {
  const expected = sessionStorage.getItem('pinterest_oauth_state');
  if (!expected || !received) return false;
  return expected === received;
}

export function clearOAuthState(): void {
  sessionStorage.removeItem('pinterest_oauth_state');
}

/** Démarre le flux OAuth Pinterest (redirection navigateur) */
export async function startPinterestOAuth(): Promise<void> {
  const config = await fetchPinterestRuntimeConfig();
  const clientId = config.appId || rawAppId || PINTEREST_APP_ID;

  if (!clientId) {
    throw new Error(
      'App ID Pinterest manquant. Crée une app sur developers.pinterest.com et colle les clés dans Paramètres.'
    );
  }

  const redirectUri = config.redirectUri || getPinterestRedirectUri();
  const state = createOAuthState();
  window.location.href = getPinterestAuthUrl(redirectUri, state, clientId);
}

// Exchange code for access token (via middleware Vite — secret côté serveur)
export async function exchangeCodeForToken(
  code: string,
  redirectUri: string
): Promise<PinterestTokenResponse> {
  const data = await apiFetch<PinterestTokenResponse>('/api/pinterest/oauth/token', {
    body: { grant_type: 'authorization_code', code, redirect_uri: redirectUri },
  });
  if (!data.access_token) {
    throw new Error('Token Pinterest manquant dans la réponse');
  }
  return data;
}

// Refresh access token
export async function refreshPinterestToken(
  refreshToken: string
): Promise<PinterestTokenResponse> {
  return apiFetch<PinterestTokenResponse>('/api/pinterest/oauth/token', {
    body: { grant_type: 'refresh_token', refresh_token: refreshToken },
  });
}

/** Read-only Pinterest call through our proxy (Supabase JWT + the user's Pinterest token). */
async function pinterestProxy<T>(endpoint: 'user' | 'boards', accessToken: string): Promise<T> {
  return apiFetch<T>(`/api/pinterest/proxy?endpoint=${endpoint}`, {
    method: 'GET',
    headers: { 'X-Pinterest-Token': accessToken },
  });
}

async function pinterestFetch<T>(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<T> {
  const response = await fetch(`${PINTEREST_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${accessToken}`,
      ...(init?.body ? { 'Content-Type': 'application/json' } : {}),
      ...init?.headers,
    },
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message =
      (data as { message?: string }).message ||
      (data as { error?: string }).error ||
      `Erreur Pinterest API (${response.status})`;
    throw new Error(message);
  }
  return data as T;
}

// Get user info (via backend proxy to avoid CORS)
export async function getPinterestUser(accessToken: string): Promise<PinterestUser> {
  const data = await pinterestProxy<{
    id?: string;
    username?: string;
    profile_image?: string | null;
    follower_count?: number;
    following_count?: number;
  }>('user', accessToken);

  return {
    id: data.id || '',
    username: data.username || 'pinterest_user',
    profile_image: data.profile_image ?? null,
    follower_count: data.follower_count || 0,
    following_count: data.following_count || 0,
  };
}

// Get user's boards (via backend proxy to avoid CORS)
export async function getPinterestBoards(accessToken: string): Promise<PinterestBoard[]> {
  const data = await pinterestProxy<{
    items?: Array<{
      id: string;
      name: string;
      description?: string | null;
      image_cover_url?: string | null;
      pin_count?: number;
      privacy?: 'PUBLIC' | 'SECRET';
    }>;
  }>('boards', accessToken);

  return (data.items || []).map((board) => ({
    id: board.id,
    name: board.name,
    description: board.description ?? null,
    image_url: board.image_cover_url ?? null,
    pin_count: board.pin_count || 0,
    privacy: board.privacy || 'PUBLIC',
  }));
}

// Create a new board
export async function createPinterestBoard(
  accessToken: string,
  name: string,
  description?: string
): Promise<PinterestBoard> {
  const data = await pinterestFetch<{
    id: string;
    name: string;
    description?: string | null;
    image_cover_url?: string | null;
    privacy?: 'PUBLIC' | 'SECRET';
  }>('/boards', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      name,
      description,
      privacy: 'PUBLIC',
    }),
  });

  return {
    id: data.id,
    name: data.name,
    description: data.description ?? null,
    image_url: data.image_cover_url ?? null,
    pin_count: 0,
    privacy: data.privacy || 'PUBLIC',
  };
}

// Create a pin
export async function createPinterestPin(
  accessToken: string,
  pinData: CreatePinData
): Promise<PinterestPin> {
  const data = await pinterestFetch<{
    id: string;
    title?: string;
    description?: string;
    link?: string | null;
    board_id?: string;
    created_at?: string;
    media?: { images?: Record<string, { url?: string }> };
  }>('/pins', accessToken, {
    method: 'POST',
    body: JSON.stringify({
      title: pinData.title,
      description: pinData.description,
      link: pinData.link,
      board_id: pinData.board_id,
      media_source: {
        source_type: 'image_url',
        url: pinData.image_url,
      },
      alt_text: pinData.alt_text,
    }),
  });

  return {
    id: data.id,
    title: data.title || pinData.title,
    description: data.description || pinData.description,
    link: data.link ?? null,
    image_url: data.media?.images?.['600x']?.url || pinData.image_url,
    board_id: data.board_id || pinData.board_id,
    created_at: data.created_at || new Date().toISOString(),
  };
}

// Get pin analytics
export async function getPinAnalytics(
  accessToken: string,
  pinId: string
): Promise<{
  impressions: number;
  saves: number;
  closeups: number;
  clicks: number;
}> {
  const data = await pinterestFetch<{
    impressions?: number;
    saves?: number;
    closeups?: number;
    clicks?: number;
  }>(`/pins/${pinId}/analytics`, accessToken);

  return {
    impressions: data.impressions || 0,
    saves: data.saves || 0,
    closeups: data.closeups || 0,
    clicks: data.clicks || 0,
  };
}

/**
 * Finalise la connexion OAuth : code → tokens → profil + boards.
 */
export async function completePinterestOAuth(code: string): Promise<{
  access_token: string;
  refresh_token: string;
  expires_in: number;
  user: PinterestUser;
  boards: PinterestBoard[];
}> {
  const config = await fetchPinterestRuntimeConfig();
  const redirectUri = config.redirectUri || getPinterestRedirectUri();
  const tokens = await exchangeCodeForToken(code, redirectUri);
  const user = await getPinterestUser(tokens.access_token);
  let boards: PinterestBoard[] = [];
  try {
    boards = await getPinterestBoards(tokens.access_token);
  } catch (error) {
    console.warn('Impossible de charger les boards Pinterest:', error);
  }

  return {
    access_token: tokens.access_token,
    refresh_token: tokens.refresh_token || '',
    expires_in: tokens.expires_in || 2592000,
    user,
    boards,
  };
}

// Mock Pinterest service for demo
export const mockPinterestService = {
  user: {
    id: 'mock_user_123',
    username: 'demo_user',
    profile_image:
      'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop&crop=face',
    follower_count: 1250,
    following_count: 340,
  },
  boards: [
    {
      id: 'board_1',
      name: 'Inspiration Déco',
      description: 'Idées déco pour la maison',
      image_url:
        'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=400&h=400&fit=crop',
      pin_count: 45,
      privacy: 'PUBLIC' as const,
    },
    {
      id: 'board_2',
      name: 'Recettes Faciles',
      description: 'Recettes rapides et délicieuses',
      image_url:
        'https://images.unsplash.com/photo-1495521821757-a1efb6729352?w=400&h=400&fit=crop',
      pin_count: 128,
      privacy: 'PUBLIC' as const,
    },
    {
      id: 'board_3',
      name: 'Mode & Style',
      description: 'Tendances mode et conseils style',
      image_url:
        'https://images.unsplash.com/photo-1445205170230-053b83016050?w=400&h=400&fit=crop',
      pin_count: 67,
      privacy: 'PUBLIC' as const,
    },
  ],

  async getUser(): Promise<PinterestUser> {
    return this.user;
  },

  async getBoards(): Promise<PinterestBoard[]> {
    return this.boards;
  },

  async createPin(pinData: CreatePinData): Promise<PinterestPin> {
    return {
      id: `pin_${Date.now()}`,
      title: pinData.title,
      description: pinData.description,
      link: pinData.link || null,
      image_url: pinData.image_url,
      board_id: pinData.board_id,
      created_at: new Date().toISOString(),
    };
  },
};
