import { useCallback, useEffect, useState } from 'react';

interface ProductRow {
  product_gid: string;
  title: string;
  image_url: string | null;
  product_url: string | null;
  product_status: string | null;
}

interface PinRow {
  id: string;
  title: string;
  status: string;
  link: string | null;
  scheduled_at: string | null;
  error_message: string | null;
}

interface SessionPayload {
  shop: string;
  plan: string;
  subscriptionStatus: string;
  pinterest: string | null;
  products: ProductRow[];
  pins: PinRow[];
  pinsUsed: number;
  pinsLimit: number;
}

async function sessionToken(): Promise<string | null> {
  const shopify = (window as unknown as { shopify?: { idToken?: () => Promise<string> } }).shopify;
  if (!shopify?.idToken) return null;
  return shopify.idToken();
}

async function api<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
    },
  });
  const body = (await res.json()) as T & { error?: string };
  if (!res.ok) throw new Error(body.error || `Erreur ${res.status}`);
  return body;
}

export function ShopifyApp() {
  const [shopInput, setShopInput] = useState('');
  const [token, setToken] = useState<string | null>(null);
  const [session, setSession] = useState<SessionPayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const refresh = useCallback(async (current: string) => {
    const payload = await api<SessionPayload>('/api/shopify/session', current);
    setSession(payload);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const current = await sessionToken();
      if (cancelled) return;
      if (!current) return;
      setToken(current);
      try {
        await refresh(current);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Session impossible');
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refresh]);

  async function run(task: () => Promise<void>) {
    if (!token) return;
    setBusy(true);
    setError(null);
    try {
      await task();
      await refresh(token);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action impossible');
    } finally {
      setBusy(false);
    }
  }

  if (!token) {
    return (
      <main className="mx-auto max-w-lg px-6 py-16">
        <h1 className="text-2xl font-bold text-[#111111]">Installer PingenX sur Shopify</h1>
        <p className="mt-3 text-[#717171]">
          Ouvrez cette page depuis l’admin Shopify, ou indiquez le domaine de la boutique pour lancer l’installation.
        </p>
        <form
          className="mt-6 flex gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            const shop = shopInput.trim();
            if (!shop) return;
            window.location.href = `/api/shopify/auth?shop=${encodeURIComponent(shop)}`;
          }}
        >
          <input
            className="flex-1 rounded-md border border-[#E2E2E2] px-3 py-2"
            placeholder="boutique.myshopify.com"
            value={shopInput}
            onChange={(event) => setShopInput(event.target.value)}
            aria-label="Domaine Shopify"
          />
          <button className="rounded-md bg-[#3B9EFF] px-4 py-2 font-medium text-white" type="submit">
            Installer
          </button>
        </form>
        {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      </main>
    );
  }

  return (
    <main className="mx-auto max-w-3xl px-6 py-10">
      <h1 className="text-2xl font-bold text-[#111111]">{session?.shop || 'PingenX'}</h1>
      <p className="mt-2 text-[#717171]">
        Plan {session?.plan || '…'} ({session?.subscriptionStatus || '…'}). Pins ce mois : {session?.pinsUsed ?? 0}/
        {session?.pinsLimit ?? 0}. Pinterest : {session?.pinterest || 'non connecté'}.
      </p>
      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
      <div className="mt-6 flex flex-wrap gap-2">
        <button
          className="rounded-md border border-[#E2E2E2] px-3 py-2"
          disabled={busy}
          onClick={() => run(() => api('/api/shopify/products/sync', token, { method: 'POST' }))}
          type="button"
        >
          Synchroniser les produits
        </button>
        <button
          className="rounded-md border border-[#E2E2E2] px-3 py-2"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const { url } = await api<{ url: string }>('/api/shopify/pinterest/start', token);
              window.top?.location.assign(url);
            })
          }
          type="button"
        >
          Connecter Pinterest
        </button>
        <button
          className="rounded-md bg-[#3B9EFF] px-3 py-2 text-white"
          disabled={busy}
          onClick={() =>
            run(async () => {
              const { confirmationUrl } = await api<{ confirmationUrl: string }>('/api/shopify/billing', token, {
                method: 'POST',
                body: JSON.stringify({ plan: 'shop_pro' }),
              });
              window.top?.location.assign(confirmationUrl);
            })
          }
          type="button"
        >
          Passer au plan Pro
        </button>
      </div>

      <h2 className="mt-10 text-lg font-bold">Produits</h2>
      <ul className="mt-3 divide-y divide-[#E2E2E2] border border-[#E2E2E2]">
        {(session?.products || []).map((product) => (
          <li key={product.product_gid} className="flex items-center justify-between gap-3 px-3 py-3">
            <span>
              {product.title}
              {product.product_status && product.product_status !== 'ACTIVE' ? ` (${product.product_status})` : ''}
            </span>
            <button
              className="rounded-md bg-[#111111] px-3 py-1.5 text-sm text-white"
              disabled={busy || !product.image_url}
              onClick={() =>
                run(() =>
                  api('/api/shopify/pins/generate', token, {
                    method: 'POST',
                    body: JSON.stringify({ productGid: product.product_gid }),
                  }),
                )
              }
              type="button"
            >
              Créer un brouillon
            </button>
          </li>
        ))}
      </ul>

      <h2 className="mt-10 text-lg font-bold">Pins</h2>
      <ul className="mt-3 divide-y divide-[#E2E2E2] border border-[#E2E2E2]">
        {(session?.pins || []).map((pin) => (
          <li key={pin.id} className="flex items-center justify-between gap-3 px-3 py-3">
            <span>
              {pin.title} — {pin.status}
              {pin.error_message ? ` (${pin.error_message})` : ''}
            </span>
            {pin.status === 'draft' && (
              <button
                className="rounded-md bg-[#7C3AED] px-3 py-1.5 text-sm text-white"
                disabled={busy}
                onClick={() =>
                  run(() =>
                    api('/api/shopify/pins/approve', token, {
                      method: 'POST',
                      body: JSON.stringify({ pinId: pin.id }),
                    }),
                  )
                }
                type="button"
              >
                Valider et programmer
              </button>
            )}
          </li>
        ))}
      </ul>
    </main>
  );
}
